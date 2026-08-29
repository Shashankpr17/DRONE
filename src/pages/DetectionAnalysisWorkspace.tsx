import React, { useState, useEffect, useRef } from 'react';
import { runClientYoloInference, initYoloModels, type DetectionBox } from '../utils/yoloInference';
import { getSocket } from '../api/socketClient';
import { uploadMediaFile } from '../api/disasterApi';

export const DetectionAnalysisWorkspace: React.FC = () => {
  const [videoPlayUrl, setVideoPlayUrl] = useState<string | null>(null);
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);
  const [isEsp32Active, setIsEsp32Active] = useState(false);
  const [esp32Url, setEsp32Url] = useState('http://192.168.137.221/');
  const [esp32FrameData, setEsp32FrameData] = useState<string | null>(null);
  const [esp32Viewers, setEsp32Viewers] = useState(1);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [esp32Error, setEsp32Error] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeDetections, setActiveDetections] = useState<DetectionBox[]>([]);
  const [victimsCount, setVictimsCount] = useState(0);
  const [boatsCount, setBoatsCount] = useState(0);
  const [vehiclesCount, setVehiclesCount] = useState(0);
  const [waterCoverage, setWaterCoverage] = useState(0);
  const [inferenceTime, setInferenceTime] = useState<number | null>(null);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const liveStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isInferringRef = useRef<boolean>(false);
  const lastBroadcastRef = useRef<number>(0);

  // Pre-load ONNX model on component mount
  useEffect(() => {
    let isMounted = true;
    async function loadEngine() {
      setIsProcessing(true);
      await initYoloModels();
      if (isMounted) {
        setIsProcessing(false);
      }
    }
    loadEngine();

    return () => {
      isMounted = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (liveStreamRef.current) {
        liveStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Listen to WebSocket ESP32-CAM frame broadcast and status
  useEffect(() => {
    let socket: any;
    try {
      socket = getSocket();
    } catch {
      return;
    }

    const handleFrame = (payload: { data: string; timestamp: number }) => {
      if (isEsp32Active && payload?.data) {
        setEsp32FrameData(`data:image/jpeg;base64,${payload.data}`);
        setEsp32Error(null);
      }
    };

    const handleStatus = (status: { active: boolean; url: string | null; viewers: number }) => {
      if (status?.viewers !== undefined) {
        setEsp32Viewers(Math.max(1, status.viewers));
      }
    };

    socket.on('esp32:frame', handleFrame);
    socket.on('esp32:status', handleStatus);

    return () => {
      socket.off('esp32:frame', handleFrame);
      socket.off('esp32:status', handleStatus);
    };
  }, [isEsp32Active]);

  // Continuous frame analysis loop during video playback or live camera feed (Webcam or ESP32-CAM)
  useEffect(() => {
    const isFeedActive = Boolean(videoPlayUrl || isLiveCameraActive || isEsp32Active);
    if (!isFeedActive) return;

    let isRunning = true;

    const detectLoop = async () => {
      if (!isRunning) return;

      // Check if ESP32 image feed or Video element is ready
      const img = imgRef.current;
      const video = videoRef.current;

      let sourceElement: HTMLVideoElement | HTMLImageElement | null = null;

      if (isEsp32Active && img && img.complete && img.naturalWidth > 0) {
        sourceElement = img;
      } else if (video && !video.paused && !video.ended && video.readyState >= 2) {
        sourceElement = video;
      }

      if (sourceElement && !isInferringRef.current) {
        isInferringRef.current = true;
        try {
          const result = await runClientYoloInference(sourceElement);
          if (isRunning) {
            setActiveDetections(result.detections);
            setVictimsCount(result.victimsCount);
            setVehiclesCount(result.vehiclesCount);
            setBoatsCount(result.boatsCount);
            setWaterCoverage(result.waterCoverage);
            setInferenceTime(result.inferenceTimeMs);

            // Broadcast live stats across the entire app via WebSocket
            const now = performance.now();
            if (now - lastBroadcastRef.current > 1200) {
              lastBroadcastRef.current = now;
              try {
                const socket = getSocket();
                socket.emit('client:detection', {
                  waterCoverage: result.waterCoverage,
                  victimsCount: result.victimsCount,
                  vehiclesCount: result.vehiclesCount,
                  boatsCount: result.boatsCount,
                  detections: result.detections,
                });
              } catch {}
            }
          }
        } catch (err) {
          console.warn('Frame detection step warning:', err);
        } finally {
          isInferringRef.current = false;
        }
      }

      animFrameRef.current = requestAnimationFrame(detectLoop);
    };

    animFrameRef.current = requestAnimationFrame(detectLoop);

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [videoPlayUrl, isLiveCameraActive, isEsp32Active]);

  // Connect to ESP32-CAM Stream via Backend Relay
  const handleConnectEsp32 = (targetUrl?: string) => {
    let url = (targetUrl || esp32Url).trim();
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `http://${url}`;
    }

    try {
      const parsed = new URL(url);
      if (!parsed.port && (parsed.pathname === '/' || parsed.pathname === '')) {
        url = `http://${parsed.hostname}:81/stream`;
      }
    } catch {}

    // Clear any previous feeds
    if (liveStreamRef.current) {
      liveStreamRef.current.getTracks().forEach((t) => t.stop());
      liveStreamRef.current = null;
    }
    if (videoPlayUrl) {
      URL.revokeObjectURL(videoPlayUrl);
      setVideoPlayUrl(null);
    }

    setEsp32Url(url);
    setIsLiveCameraActive(false);
    setIsEsp32Active(true);
    setEsp32Error(null);
    setUploadedFileName(`ESP32-CAM Relay (${url})`);
    setActiveDetections([]);
    setVictimsCount(0);
    setShowSourceModal(false);

    try {
      const socket = getSocket();
      socket.emit('esp32:start', { url });
    } catch (err) {
      console.warn('Failed to start ESP32 socket relay:', err);
    }
  };

  // Stop Live Camera (Webcam or ESP32-CAM)
  const handleStopLiveCamera = () => {
    if (liveStreamRef.current) {
      liveStreamRef.current.getTracks().forEach((t) => t.stop());
      liveStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (isEsp32Active) {
      try {
        const socket = getSocket();
        socket.emit('esp32:stop');
      } catch {}
    }
    setIsLiveCameraActive(false);
    setIsEsp32Active(false);
    setEsp32FrameData(null);
    setEsp32Error(null);
    setUploadedFileName(null);
    setActiveDetections([]);
    setVictimsCount(0);
    setWaterCoverage(0);
    setInferenceTime(null);
  };

  // Capture Live Snapshot and Save to Disk (backend/data/uploads)
  const handleCaptureSnapshot = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isEsp32Active && imgRef.current) {
      const img = imgRef.current;
      canvas.width = img.naturalWidth || 1280;
      canvas.height = img.naturalHeight || 720;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } else if (videoRef.current) {
      const video = videoRef.current;
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    } else {
      return;
    }

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `drone_live_snapshot_${Date.now()}.jpg`, { type: 'image/jpeg' });
      try {
        setUploadStatus('Saving snapshot to local Mission Footage folder...');
        await uploadMediaFile(file, { sector: 'Sector 12', waterCoverage, victimsCount });
        setUploadStatus('Snapshot saved locally to backend/data/uploads');
        setTimeout(() => setUploadStatus(null), 3500);
      } catch (err) {
        console.warn('Failed to save snapshot to backend:', err);
        setUploadStatus(null);
      }
    }, 'image/jpeg', 0.95);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isLiveCameraActive || isEsp32Active) {
      handleStopLiveCamera();
    }

    if (videoPlayUrl) {
      URL.revokeObjectURL(videoPlayUrl);
    }

    const blobUrl = URL.createObjectURL(file);
    setVideoPlayUrl(blobUrl);
    setUploadedFileName(file.name);
    setActiveDetections([]);
    setVictimsCount(0);
    setUploadStatus('Saving to local Mission Footage folder...');

    // Automatically save real file to local disk (backend/data/uploads)
    try {
      await uploadMediaFile(file, { sector: 'Sector 12' });
      setUploadStatus('Saved to local Mission Footage folder');
      setTimeout(() => setUploadStatus(null), 3500);
    } catch (err) {
      console.warn('Failed to upload file to backend store:', err);
      setUploadStatus(null);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearVideo = () => {
    if (videoPlayUrl) {
      URL.revokeObjectURL(videoPlayUrl);
    }
    setVideoPlayUrl(null);
    setUploadedFileName(null);
    setActiveDetections([]);
    setVictimsCount(0);
    setWaterCoverage(0);
    setInferenceTime(null);
  };

  return (
    <div className="p-4 md:p-6 lg:p-xl w-full min-h-full flex flex-col gap-6">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="video/mp4,video/quicktime,video/webm,video/avi,image/jpeg,image/png,image/webp"
        className="hidden"
      />

      {/* Page Header */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="font-headline-lg text-2xl md:text-headline-lg text-on-surface font-bold">
            Detection &amp; Analysis Workspace
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {uploadStatus && (
            <span className="px-2.5 py-1 bg-surface-container-high border border-outline-variant text-on-surface rounded-lg text-xs font-medium animate-pulse">
              💾 {uploadStatus}
            </span>
          )}

          {/* LIVE CAMERA BUTTON */}
          {isLiveCameraActive || isEsp32Active ? (
            <>
              <button
                onClick={handleCaptureSnapshot}
                className="px-3.5 py-2 bg-primary-container text-on-primary hover:bg-primary rounded-lg font-label-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">photo_camera</span>
                Capture Snapshot
              </button>
              <button
                onClick={handleStopLiveCamera}
                className="px-3.5 py-2 bg-error text-white hover:bg-error/90 rounded-lg font-label-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">videocam_off</span>
                Stop Live Feed
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowSourceModal(true)}
              className="px-3.5 py-2 bg-error text-white hover:bg-error/90 rounded-lg font-label-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span className="material-symbols-outlined text-base">videocam</span>
              Live Video Cam
            </button>
          )}

          {/* UPLOAD VIDEO BUTTON */}
          {videoPlayUrl ? (
            <button
              onClick={handleClearVideo}
              className="px-3.5 py-2 bg-error text-white hover:bg-error/90 rounded-lg font-label-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">stop_circle</span>
              Stop Video Feed
            </button>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 bg-primary text-on-primary hover:bg-primary/90 rounded-lg font-label-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">upload_file</span>
              {uploadedFileName ? `Change Video (${uploadedFileName})` : 'Upload Drone Video (.mp4)'}
            </button>
          )}

          <button
            onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
            className={`px-3.5 py-2 rounded-lg font-label-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer ${
              showBoundingBoxes
                ? 'bg-secondary-container text-on-secondary-container'
                : 'bg-surface-variant text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-base">
              {showBoundingBoxes ? 'visibility' : 'visibility_off'}
            </span>
            {showBoundingBoxes ? 'Bounding Boxes: ON' : 'Bounding Boxes: OFF'}
          </button>
        </div>
      </div>

      {/* Camera Source Selection Modal */}
      {showSourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-outline-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">sensors</span>
                <h3 className="font-headline-md text-base font-bold text-on-surface">
                  Connect ESP32-CAM Live Feed
                </h3>
              </div>
              <button
                onClick={() => setShowSourceModal(false)}
                className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* ESP32-CAM WiFi Stream */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-surface-container-low border border-primary/20 space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <span className="material-symbols-outlined text-base">router</span>
                  <span>ESP32-CAM WiFi Stream (Drone Optical Cam)</span>
                </div>
                <p className="text-xs text-on-surface-variant">
                  Stream live drone camera frames directly from your ESP32-CAM IP address.
                </p>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-on-surface uppercase tracking-wider block">
                    ESP32-CAM URL / IP Address:
                  </label>
                  <input
                    type="text"
                    value={esp32Url}
                    onChange={(e) => setEsp32Url(e.target.value)}
                    placeholder="http://192.168.137.221/"
                    className="w-full px-3 py-2 text-xs bg-surface border border-outline-variant rounded-lg text-on-surface font-mono focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Quick Preset Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-on-surface-variant self-center">Presets:</span>
                  <button
                    type="button"
                    onClick={() => setEsp32Url('http://192.168.137.221:81/stream')}
                    className="px-2 py-0.5 text-[10px] font-mono bg-surface border border-outline-variant hover:border-primary text-on-surface rounded transition-colors cursor-pointer"
                  >
                    192.168.137.221:81/stream
                  </button>
                  <button
                    type="button"
                    onClick={() => setEsp32Url('http://192.168.137.221/')}
                    className="px-2 py-0.5 text-[10px] font-mono bg-surface border border-outline-variant hover:border-primary text-on-surface rounded transition-colors cursor-pointer"
                  >
                    192.168.137.221/
                  </button>
                  <button
                    type="button"
                    onClick={() => setEsp32Url('http://192.168.137.151:81/stream')}
                    className="px-2 py-0.5 text-[10px] font-mono bg-surface border border-outline-variant hover:border-primary text-on-surface rounded transition-colors cursor-pointer"
                  >
                    192.168.137.151:81/stream
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleConnectEsp32()}
                  className="w-full py-2.5 bg-primary text-on-primary hover:bg-primary/90 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">sensors</span>
                  Connect ESP32-CAM
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Model Loading Status Indicator */}
      {isProcessing && (
        <div className="p-3 bg-primary/10 border border-primary/30 text-primary text-xs rounded-xl flex items-center gap-2 animate-pulse shadow-sm">
          <span className="material-symbols-outlined text-lg animate-spin">sync</span>
          <span>Initializing Client-Side YOLOv11 Neural Engine into browser WebAssembly...</span>
        </div>
      )}

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left Panel: Video Player & Overlays */}
        <div className="xl:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col relative shadow-xs p-3 md:p-4">
          <div className="relative flex-1 bg-inverse-surface w-full min-h-[420px] overflow-hidden rounded-lg mt-2 flex items-center justify-center">
            {videoPlayUrl || isLiveCameraActive || isEsp32Active ? (
              <div className="relative inline-flex items-center justify-center max-w-full max-h-[560px] overflow-hidden">
                {isEsp32Active ? (
                  <div className="relative inline-flex items-center justify-center max-w-full max-h-[560px]">
                    <img
                      ref={imgRef}
                      src={esp32FrameData || esp32Url}
                      alt="ESP32-CAM Live Stream"
                      className="block max-h-[560px] max-w-full w-auto h-auto rounded-md select-none"
                      onError={() => {
                        if (!esp32FrameData) {
                          setEsp32Error(`Connecting to ESP32 stream at ${esp32Url}... Ensure the camera is powered on and on the same WiFi.`);
                        }
                      }}
                      onLoad={() => setEsp32Error(null)}
                    />
                    {esp32Error && !esp32FrameData && (
                      <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center text-white gap-3 rounded-md z-10">
                        <span className="material-symbols-outlined text-4xl text-error">wifi_off</span>
                        <h4 className="font-bold text-sm">ESP32-CAM Connecting...</h4>
                        <p className="text-xs text-gray-300 max-w-md">{esp32Error}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowSourceModal(true)}
                            className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg font-semibold cursor-pointer"
                          >
                            Change IP / Port
                          </button>
                          <button
                            onClick={() => handleConnectEsp32('http://192.168.137.221:81/stream')}
                            className="px-3 py-1.5 bg-surface-container text-white text-xs rounded-lg font-semibold cursor-pointer border border-white/20"
                          >
                            Try :81/stream
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    src={videoPlayUrl || undefined}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="block max-h-[560px] max-w-full w-auto h-auto rounded-md"
                  />
                )}

                {/* YOLO Bounding Boxes Canvas Layer - Tight Pixel-Perfect Overlay */}
                {showBoundingBoxes && (
                  <div className="absolute inset-0 pointer-events-none w-full h-full">
                    {activeDetections.map((det, idx) => {
                      const isVictim = det.type === 'victim' || det.class.toLowerCase().includes('person') || det.class.toLowerCase().includes('victim');
                      const isBoat = det.class.toLowerCase().includes('boat');
                      const color = isVictim ? '#ef4444' : isBoat ? '#0284c7' : '#f59e0b';

                      const [x, y, w, h] = det.bbox;

                      return (
                        <div
                          key={idx}
                          className="absolute border-2 transition-all duration-75"
                          style={{
                            left: `${Math.max(0, Math.min(100, x * 100))}%`,
                            top: `${Math.max(0, Math.min(100, y * 100))}%`,
                            width: `${Math.max(1, Math.min(100, w * 100))}%`,
                            height: `${Math.max(1, Math.min(100, h * 100))}%`,
                            borderColor: color,
                            backgroundColor: `${color}18`,
                            boxShadow: `0 0 8px ${color}66`,
                          }}
                        >
                          <span
                            className="absolute -top-5 left-0 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase rounded whitespace-nowrap shadow-md tracking-wider flex items-center gap-1"
                            style={{ backgroundColor: color }}
                          >
                            {det.class} {Math.round(det.confidence * 100)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full min-h-[420px] flex flex-col items-center justify-center bg-surface-container-low/60 p-6 text-center border-2 border-dashed border-outline-variant/60 rounded-lg">
                <span className="material-symbols-outlined text-4xl text-outline mb-2">videocam</span>
                <p className="text-on-surface-variant text-sm">No feed active.</p>
                <p className="text-on-surface-variant/70 text-xs mt-1">Click "Live Video Cam" or "Upload Drone Video" to start detection.</p>
              </div>
            )}

            {/* Live Telemetry HUD Bar */}
            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap justify-between items-center text-white font-data-mono text-[11px] bg-on-background/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 gap-2 z-10">
              <span>WATER COVERAGE: {waterCoverage}%</span>
              <span>VICTIMS DETECTED: {victimsCount}</span>
              <span>SURVEY: KIIT CAMPUS 6</span>
              {isEsp32Active && (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  RELAY: {esp32Viewers} {esp32Viewers === 1 ? 'LAPTOP' : 'LAPTOPS'} CONNECTED
                </span>
              )}
              <span>INFERENCE: {videoPlayUrl || isLiveCameraActive || isEsp32Active ? `REAL-TIME ${inferenceTime ? `(${inferenceTime}ms)` : '30 FPS'}` : 'STANDBY'}</span>
            </div>
          </div>
        </div>

        {/* Right Panel: AI Detection Summary shifted directly to the top */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          {/* Detection Summary Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 md:p-5 shadow-xs">
            <h3 className="font-headline-md text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-base">troubleshoot</span>
              AI Detection Summary
            </h3>

            <div className="space-y-2.5 mt-3">
              {/* Victims */}
              <div className="bg-error-container/20 border border-error/30 p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-error/15 flex items-center justify-center">
                    <span className="material-symbols-outlined text-error text-[18px]">person_alert</span>
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-on-surface">Victims Detected</p>
                  </div>
                </div>
                <span className="font-data-mono text-2xl font-black text-error">{victimsCount}</span>
              </div>

              {/* Boats */}
              <div className="bg-primary-container/10 border border-primary-container/25 p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-primary-container/15 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary-container text-[18px]">sailing</span>
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-on-surface">Rescue Boats</p>
                  </div>
                </div>
                <span className="font-data-mono text-2xl font-black text-primary-container">{boatsCount}</span>
              </div>

              {/* Vehicles */}
              <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-amber-500/15 flex items-center justify-center">
                    <span className="material-symbols-outlined text-amber-500 text-[18px]">directions_car</span>
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-on-surface">Submerged Vehicles</p>
                  </div>
                </div>
                <span className="font-data-mono text-2xl font-black text-amber-600">{vehiclesCount}</span>
              </div>

              {/* Water Inundation Level */}
              <div className="bg-surface border border-outline-variant p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-surface-variant flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface-variant text-[18px]">tsunami</span>
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-on-surface">Water Coverage</p>
                  </div>
                </div>
                <span className="font-data-mono text-2xl font-black text-on-surface">{waterCoverage}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
