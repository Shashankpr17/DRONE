import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSocket } from '../api/socketClient';
import type { DetectionBox } from '../utils/yoloInference';

export interface DetectionState {
  waterCoverage: number | null;
  victimsCount: number;
  vehiclesCount: number;
  boatsCount: number;
  detections: DetectionBox[];
  lastUpdated: string | null;
  isLiveActive: boolean;
}

interface DetectionContextType extends DetectionState {
  updateDetection: (data: Partial<DetectionState>) => void;
  resetDetection: () => void;
}

const STORAGE_KEY = 'disaster_last_ai_detection';

const getInitialState = (): DetectionState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        isLiveActive: false,
      };
    }
  } catch {}
  return {
    waterCoverage: null,
    victimsCount: 0,
    vehiclesCount: 0,
    boatsCount: 0,
    detections: [],
    lastUpdated: null,
    isLiveActive: false,
  };
};

const DetectionContext = createContext<DetectionContextType | undefined>(undefined);

export const DetectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DetectionState>(getInitialState);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const socket = getSocket();

    const handleNewDetection = (data: any) => {
      if (!data) return;

      const now = new Date().toISOString();
      const updated: DetectionState = {
        waterCoverage: typeof data.waterCoverage === 'number' ? data.waterCoverage : state.waterCoverage,
        victimsCount: typeof data.victimsCount === 'number' ? data.victimsCount : state.victimsCount,
        vehiclesCount: typeof data.vehiclesCount === 'number' ? data.vehiclesCount : state.vehiclesCount,
        boatsCount: typeof data.boatsCount === 'number' ? data.boatsCount : state.boatsCount,
        detections: Array.isArray(data.detections) ? data.detections : state.detections,
        lastUpdated: now,
        isLiveActive: true,
      };

      setState(updated);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}

      // Reset isLiveActive after 8 seconds of no incoming frames
      clearTimeout(timer);
      timer = setTimeout(() => {
        setState((prev) => ({ ...prev, isLiveActive: false }));
      }, 8000);
    };

    socket.on('detection:new', handleNewDetection);

    return () => {
      clearTimeout(timer);
      socket.off('detection:new', handleNewDetection);
    };
  }, []);

  const updateDetection = (data: Partial<DetectionState>) => {
    setState((prev) => {
      const next = { ...prev, ...data, lastUpdated: new Date().toISOString() };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const resetDetection = () => {
    const fresh: DetectionState = {
      waterCoverage: null,
      victimsCount: 0,
      vehiclesCount: 0,
      boatsCount: 0,
      detections: [],
      lastUpdated: null,
      isLiveActive: false,
    };
    setState(fresh);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <DetectionContext.Provider value={{ ...state, updateDetection, resetDetection }}>
      {children}
    </DetectionContext.Provider>
  );
};

export const useDetectionData = () => {
  const context = useContext(DetectionContext);
  if (!context) {
    throw new Error('useDetectionData must be used within a DetectionProvider');
  }
  return context;
};
