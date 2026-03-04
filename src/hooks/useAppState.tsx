import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { ResultModel, toSpokenSentence } from '../models/result';
import { apiService } from '../services/api';
import { ttsService } from '../services/tts';
import { HapticService } from '../services/haptic';
import { AppConstants } from '../config/constants';
import { useSettings } from './useSettings';

export type AppStatus = 'ready' | 'processing' | 'error' | 'noConnection';

interface AppStateContextType {
  status: AppStatus;
  history: ResultModel[];
  currentResult: ResultModel | null;
  errorMessage: string | null;
  isConnected: boolean;
  isBackendReachable: boolean;
  analyzeImage: (blob: Blob) => Promise<void>;
  clearError: () => void;
  dismissResult: () => void;
  retryConnection: () => Promise<void>;
  startAutoScan: (intervalSeconds: number) => void;
  stopAutoScan: () => void;
  setCaptureCallback: (cb: (() => void) | null) => void;
}

const AppStateContext = createContext<AppStateContextType | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const [status, setStatus] = useState<AppStatus>('ready');
  const [history, setHistory] = useState<ResultModel[]>([]);
  const [currentResult, setCurrentResult] = useState<ResultModel | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(navigator.onLine);
  const [isBackendReachable, setIsBackendReachable] = useState(false);
  const autoScanRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const captureCallbackRef = useRef<(() => void) | null>(null);
  const settingsRef = useRef(settings);
  const statusRef = useRef<AppStatus>('ready');

  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { statusRef.current = status; }, [status]);

  useEffect(() => {
    ttsService.init();

    const onOnline = () => {
      setIsConnected(true);
      setStatus(prev => prev === 'noConnection' ? 'ready' : prev);
      checkBackend();
    };
    const onOffline = () => {
      setIsConnected(false);
      setStatus('noConnection');
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    checkBackend();
    const interval = setInterval(checkBackend, 10000);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      clearInterval(interval);
    };
  }, []);

  const checkBackend = async () => {
    const reachable = await apiService.ping();
    setIsBackendReachable(reachable);
  };

  const analyzeImage = useCallback(async (blob: Blob) => {
    if (statusRef.current === 'processing') return;
    setStatus('processing');
    setCurrentResult(null);
    setErrorMessage(null);

    const s = settingsRef.current;
    if (s.voiceEnabled) {
      ttsService.speak('Analyzing your surroundings', s.language);
    }

    try {
      const result = await apiService.analyzeImage(blob);
      setCurrentResult(result);
      setHistory(prev => {
        const next = [result, ...prev];
        return next.slice(0, AppConstants.maxHistoryItems);
      });
      setStatus('ready');

      const hasDetection = result.priorityObject !== 'No object' && result.priorityObject !== 'Unknown';
      const hasCurrency = result.currency != null;

      if (s.vibrationEnabled) {
        if (hasDetection) {
          const didVibrate = HapticService.feedbackForDistance(result.distance, s.vibrationIntensity, result.isCritical);
          if (!didVibrate) HapticService.detected();
        } else if (hasCurrency) {
          HapticService.detected();
        }
      }

      if (s.voiceEnabled && (hasDetection || hasCurrency)) {
        const sentence = toSpokenSentence(result);
        if (result.isCritical) {
          ttsService.speakUrgent(sentence, s.language);
        } else {
          ttsService.speakCalm(sentence, s.language);
        }
      }
    } catch (e: any) {
      const msg = e.message || 'Something went wrong';
      setErrorMessage(msg);
      if (msg.includes('timed out')) {
        setStatus('error');
      } else if (msg.includes('internet') || msg.includes('connection')) {
        setStatus('noConnection');
      } else {
        setStatus('error');
      }
      if (s.voiceEnabled) {
        ttsService.speak(msg, s.language);
      }
    }
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage(null);
    setStatus('ready');
  }, []);

  const dismissResult = useCallback(() => {
    setCurrentResult(null);
  }, []);

  const retryConnection = useCallback(async () => {
    setStatus('ready');
    setErrorMessage(null);
    await checkBackend();
  }, []);

  const setCaptureCallback = useCallback((cb: (() => void) | null) => {
    captureCallbackRef.current = cb;
  }, []);

  const startAutoScan = useCallback((intervalSeconds: number) => {
    stopAutoScan();
    autoScanRef.current = setInterval(() => {
      captureCallbackRef.current?.();
    }, intervalSeconds * 1000);
  }, []);

  const stopAutoScan = useCallback(() => {
    if (autoScanRef.current) {
      clearInterval(autoScanRef.current);
      autoScanRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => { stopAutoScan(); };
  }, [stopAutoScan]);

  return (
    <AppStateContext.Provider value={{
      status, history, currentResult, errorMessage,
      isConnected, isBackendReachable,
      analyzeImage, clearError, dismissResult, retryConnection,
      startAutoScan, stopAutoScan, setCaptureCallback,
    }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
