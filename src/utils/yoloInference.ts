import * as ort from 'onnxruntime-web';

// Configure ONNX runtime WASM path for Vite
ort.env.wasm.numThreads = 2;
ort.env.wasm.simd = true;

export interface DetectionBox {
  id: string;
  class: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x, y, width, height] normalized (0..1)
  type: 'victim' | 'asset' | 'infrastructure';
}

export interface FrameAnalysisResult {
  detections: DetectionBox[];
  victimsCount: number;
  vehiclesCount: number;
  boatsCount: number;
  waterCoverage: number;
  inferenceTimeMs: number;
}

let primarySession: ort.InferenceSession | null = null;
let isInitializing = false;

// Relevant COCO Class Mappings for Disaster Response
const RELEVANT_CLASSES: Record<number, { name: string; type: 'victim' | 'asset' | 'infrastructure' }> = {
  0: { name: 'Stranded Person', type: 'victim' },
  8: { name: 'Rescue Boat', type: 'asset' },
  2: { name: 'Vehicle', type: 'infrastructure' }, // Car
  3: { name: 'Vehicle', type: 'infrastructure' }, // Motorcycle
  5: { name: 'Vehicle', type: 'infrastructure' }, // Bus
  7: { name: 'Vehicle', type: 'infrastructure' }, // Truck
};

export async function initYoloModels(): Promise<boolean> {
  if (primarySession) return true;
  if (isInitializing) return false;

  isInitializing = true;
  try {
    const sessionOptions: ort.InferenceSession.SessionOptions = {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    };

    // 1. Load high-accuracy YOLO11n ONNX (Fast 10MB WASM allocation with full 80 COCO classes)
    try {
      primarySession = await ort.InferenceSession.create('/models/yolo11n.onnx', sessionOptions);
      console.log('✅ YOLO11n High-Accuracy COCO Model loaded in browser');
    } catch (err) {
      console.warn('yolo11n load failed, trying yolov8m_coco fallback:', err);
      try {
        primarySession = await ort.InferenceSession.create('/models/yolov8m_coco.onnx', sessionOptions);
        console.log('✅ YOLOv8m Model loaded as fallback');
      } catch (fallbackErr) {
        console.error('All ONNX model loads failed:', fallbackErr);
      }
    }

    isInitializing = false;
    return !!primarySession;
  } catch (e) {
    console.error('Failed to initialize ONNX models:', e);
    isInitializing = false;
    return false;
  }
}

function preprocessImage(
  source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
  targetWidth = 640,
  targetHeight = 640
): { tensor: ort.Tensor; waterCoverage: number } {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const { data } = imageData;

  const float32Data = new Float32Array(3 * targetWidth * targetHeight);
  const area = targetWidth * targetHeight;

  let waterPixelCount = 0;

  for (let i = 0; i < area; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];

    // Normalize RGB to [0, 1] for CHW format
    float32Data[i] = r / 255.0; // R
    float32Data[area + i] = g / 255.0; // G
    float32Data[area * 2 + i] = b / 255.0; // B

    // Accurate water index:
    // Exclude dry dirt, dry sand, dry grass (where Red is dominant: r > g and r > b + 25)
    const isDrySoil = r > 70 && r > b + 25 && r >= g;

    // Water:
    // 1. Blue/Cyan water: Blue is prominent
    const isBlueWater = !isDrySoil && b > r + 8 && b > 55;
    // 2. Greenish/Turbid flood river water: Green > Red and Blue > 50
    const isGreenTurbidWater = !isDrySoil && g > r + 12 && b > 60 && Math.abs(g - b) < 45;
    // 3. Deep dark water (high absorption)
    const isDeepDarkWater = !isDrySoil && r < 50 && g < 65 && b < 80 && Math.abs(r - g) < 20;

    if (isBlueWater || isGreenTurbidWater || isDeepDarkWater) {
      waterPixelCount++;
    }
  }

  const waterCoverage = Math.min(99.0, Math.round((waterPixelCount / area) * 1000) / 10);
  const tensor = new ort.Tensor('float32', float32Data, [1, 3, targetHeight, targetWidth]);

  return { tensor, waterCoverage };
}

function calculateIoU(boxA: [number, number, number, number], boxB: [number, number, number, number]): number {
  const xA = Math.max(boxA[0], boxB[0]);
  const yA = Math.max(boxA[1], boxB[1]);
  const xB = Math.min(boxA[0] + boxA[2], boxB[0] + boxB[2]);
  const yB = Math.min(boxA[1] + boxA[3], boxB[1] + boxB[3]);

  const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
  const boxAArea = boxA[2] * boxA[3];
  const boxBArea = boxB[2] * boxB[3];

  return interArea / (boxAArea + boxBArea - interArea + 1e-6);
}

function nonMaxSuppression(boxes: DetectionBox[], iouThreshold = 0.45): DetectionBox[] {
  boxes.sort((a, b) => b.confidence - a.confidence);
  const selected: DetectionBox[] = [];

  for (const box of boxes) {
    let shouldKeep = true;
    for (const kept of selected) {
      if (calculateIoU(box.bbox, kept.bbox) > iouThreshold) {
        shouldKeep = false;
        break;
      }
    }
    if (shouldKeep) {
      selected.push(box);
    }
  }
  return selected;
}

export async function runClientYoloInference(
  source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement
): Promise<FrameAnalysisResult> {
  const startTime = performance.now();

  if (!primarySession) {
    await initYoloModels();
  }

  const { tensor, waterCoverage } = preprocessImage(source);
  const rawBoxes: DetectionBox[] = [];

  if (primarySession) {
    try {
      const feeds: Record<string, ort.Tensor> = {};
      const inputName = primarySession.inputNames[0] || 'images';
      feeds[inputName] = tensor;

      const results = await primarySession.run(feeds);
      const outputName = primarySession.outputNames[0];
      const output = results[outputName];

      if (output && output.data) {
        const data = output.data as Float32Array;
        // Output tensor shape: [1, numChannels, 8400]
        // numChannels = 84 (4 bbox + 80 COCO classes) or 6 for custom 2-class
        const numAnchors = 8400;
        const numChannels = data.length / numAnchors;

        for (let i = 0; i < numAnchors; i++) {
          const cx = data[0 * numAnchors + i] / 640.0;
          const cy = data[1 * numAnchors + i] / 640.0;
          const w = data[2 * numAnchors + i] / 640.0;
          const h = data[3 * numAnchors + i] / 640.0;

          if (w < 0.02 || h < 0.02 || w > 0.95 || h > 0.95) continue;

          // For standard COCO 80-class model
          if (numChannels >= 84) {
            let maxScore = 0;
            let bestClassId = -1;

            // Only check classes relevant to disaster response (person, boat, vehicles)
            for (const classIdStr in RELEVANT_CLASSES) {
              const cId = Number(classIdStr);
              const score = data[(4 + cId) * numAnchors + i];
              if (score > maxScore) {
                maxScore = score;
                bestClassId = cId;
              }
            }

            // Clean confidence threshold for high-precision detection
            if (maxScore >= 0.35 && bestClassId >= 0) {
              const x = Math.max(0, Math.min(1, cx - w / 2));
              const y = Math.max(0, Math.min(1, cy - h / 2));
              const classInfo = RELEVANT_CLASSES[bestClassId];

              rawBoxes.push({
                id: `det_${rawBoxes.length + 1}`,
                class: classInfo.name,
                confidence: Math.round(maxScore * 100) / 100,
                bbox: [x, y, Math.min(1 - x, w), Math.min(1 - y, h)],
                type: classInfo.type,
              });
            }
          } else {
            // Fallback for custom model
            const score0 = data[4 * numAnchors + i];
            const score1 = numChannels > 5 ? data[5 * numAnchors + i] : 0;
            const maxScore = Math.max(score0, score1);
            const isGroup = score1 > score0;

            if (maxScore >= 0.25) {
              const x = Math.max(0, Math.min(1, cx - w / 2));
              const y = Math.max(0, Math.min(1, cy - h / 2));

              rawBoxes.push({
                id: `det_${rawBoxes.length + 1}`,
                class: isGroup ? 'Victims Group' : 'Stranded Person',
                confidence: Math.round(maxScore * 100) / 100,
                bbox: [x, y, Math.min(1 - x, w), Math.min(1 - y, h)],
                type: 'victim',
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn('YOLO inference error:', err);
    }
  }

  const finalBoxes = nonMaxSuppression(rawBoxes, 0.45);
  const victimsCount = finalBoxes.filter((b) => b.type === 'victim').length;
  const vehiclesCount = finalBoxes.filter((b) => b.class === 'Vehicle').length;
  const boatsCount = finalBoxes.filter((b) => b.class === 'Rescue Boat').length;

  const durationMs = Math.round(performance.now() - startTime);

  return {
    detections: finalBoxes,
    victimsCount,
    vehiclesCount,
    boatsCount,
    waterCoverage,
    inferenceTimeMs: durationMs,
  };
}

