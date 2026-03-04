import { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';
import { useAppState } from '../hooks/useAppState';
import { HapticService } from '../services/haptic';
import { ttsService } from '../services/tts';
import { t } from '../config/localizations';
import { theme } from '../config/theme';
import { shortSummary } from '../models/result';
import StatusBar from '../components/StatusBar';
import AnalyzeButton from '../components/AnalyzeButton';
import ProcessingOverlay from '../components/ProcessingOverlay';
import ResultSheet from '../components/ResultSheet';
import ConnectionBanner from '../components/ConnectionBanner';
import BoundingBoxOverlay from '../components/BoundingBoxOverlay';

export default function HomePage() {
  const navigate = useNavigate();
  const { settings, updateSettings, colors } = useSettings();
  const {
    status, history, currentResult, isConnected, isBackendReachable,
    analyzeImage, clearError, dismissResult, retryConnection,
    startAutoScan, stopAutoScan, setCaptureCallback,
  } = useAppState();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onAnalyzeTapRef = useRef<(() => void) | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCameraError, setIsCameraError] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{ w: number; h: number } | null>(null);
  const [showError, setShowError] = useState<string | null>(null);

  const isScanPaused = capturedImage !== null;

  // Initialize camera
  useEffect(() => {
    initCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Announce camera ready
  useEffect(() => {
    if (isCameraReady && settings.voiceEnabled) {
      setTimeout(() => {
        ttsService.speak(t('camera_ready', settings.language), settings.language);
        ttsService.setSpeechRate(settings.speechRate);
      }, 800);
    }
  }, [isCameraReady]);

  // Keep ref to latest onAnalyzeTap to avoid stale closure in auto-scan
  useEffect(() => { onAnalyzeTapRef.current = onAnalyzeTap; }, [onAnalyzeTap]);

  // Register capture callback once; always calls latest onAnalyzeTap via ref
  useEffect(() => {
    setCaptureCallback(() => onAnalyzeTapRef.current?.());
    return () => setCaptureCallback(null);
  }, [setCaptureCallback]);

  // Handle auto-scan setting change
  useEffect(() => {
    if (settings.autoScan) {
      startAutoScan(settings.scanIntervalSeconds);
    } else {
      stopAutoScan();
    }
    return () => stopAutoScan();
  }, [settings.autoScan, settings.scanIntervalSeconds]);

  // Show error dialogs
  useEffect(() => {
    if (status === 'error' || status === 'noConnection') {
      setShowError(status);
    } else {
      setShowError(null);
    }
  }, [status]);

  async function initCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraReady(true);
        setIsCameraError(false);
      }
    } catch {
      setIsCameraError(true);
    }
  }

  const onAnalyzeTap = useCallback(async () => {
    if (status === 'processing' || isScanPaused) return;
    HapticService.tap();

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !isCameraReady) {
      if (settings.voiceEnabled) {
        ttsService.speak('Camera is not ready. Please wait.', settings.language);
      }
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    setImageSize({ w: video.videoWidth, h: video.videoHeight });
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      await analyzeImage(blob);
    }, 'image/jpeg', 0.85);
  }, [status, isScanPaused, isCameraReady, analyzeImage, settings]);

  function resumeScanning() {
    setCapturedImage(null);
    setImageSize(null);
    dismissResult();
  }

  function onAutoScanChanged(enabled: boolean) {
    updateSettings({ autoScan: enabled });
  }

  const lastResult = history.length > 0 ? shortSummary(history[0]) : null;

  return (
    <div className="h-screen w-screen relative overflow-hidden" style={{ backgroundColor: '#0D0D0D' }}>
      {/* Hidden canvas for capturing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera view */}
      {isCameraError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ backgroundColor: '#111' }}>
          <svg className="w-20 h-20" style={{ color: theme.danger }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <p className="mt-4 text-lg" style={{ color: colors.textSecondary }}>
            {t('camera_unavailable', settings.language)}
          </p>
          <p className="mt-2 text-sm" style={{ color: colors.textTertiary }}>
            {t('check_permissions', settings.language)}
          </p>
        </div>
      ) : (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          autoPlay
          style={{ display: isCameraReady ? 'block' : 'none' }}
        />
      )}

      {/* Camera loading */}
      {!isCameraReady && !isCameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ backgroundColor: '#111' }}>
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${theme.accent} transparent ${theme.accent} ${theme.accent}` }} />
          <p className="mt-4 text-base" style={{ color: colors.textSecondary }}>
            {t('starting_camera', settings.language)}
          </p>
        </div>
      )}

      {/* Captured frame overlay */}
      {capturedImage && (
        <div className="absolute inset-0 bg-black">
          <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Bounding boxes */}
      {currentResult && imageSize && (
        <BoundingBoxOverlay result={currentResult} imageWidth={imageSize.w} imageHeight={imageSize.h} />
      )}

      {/* Double tap to analyze */}
      {!isScanPaused && (
        <div
          className="absolute inset-0 z-10"
          onDoubleClick={onAnalyzeTap}
        />
      )}

      {/* Status bar */}
      <StatusBar
        status={status}
        statusLabel={isScanPaused ? 'Reviewing' : undefined}
        statusColor={isScanPaused ? theme.warning : undefined}
        onSettingsTap={() => navigate('/settings')}
      />

      {/* Connection banner */}
      <div className="absolute top-16 left-0 right-0 z-30">
        <ConnectionBanner
          isConnected={isConnected}
          isBackendReachable={isBackendReachable}
          onRetry={retryConnection}
        />
      </div>

      {/* Bottom action area */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 pb-9"
        style={{
          background: `linear-gradient(to bottom, transparent 0%, rgba(13,13,13,0.8) 40%, #0D0D0D 100%)`,
          height: 220,
        }}
      >
        <div className="flex flex-col items-center justify-end h-full">
          {lastResult && (
            <button
              onClick={() => navigate('/history')}
              className="mb-3 px-4 py-1.5 rounded-full text-sm"
              style={{ backgroundColor: 'rgba(26,26,26,0.7)', color: colors.textPrimary }}
            >
              {t('last_result', settings.language)} {lastResult}
            </button>
          )}

          <AnalyzeButton
            isProcessing={status === 'processing' || isScanPaused}
            onTap={onAnalyzeTap}
          />

          <button
            onClick={() => onAutoScanChanged(!settings.autoScan)}
            className="mt-3 px-5 py-2 rounded-full text-sm font-medium border-[1.5px]"
            style={{
              borderColor: settings.autoScan ? theme.accent : colors.inactive,
              backgroundColor: settings.autoScan ? `${theme.accent}26` : 'transparent',
              color: settings.autoScan ? theme.accent : colors.textSecondary,
            }}
          >
            {settings.autoScan ? t('auto_on', settings.language) : t('auto', settings.language)}
          </button>
        </div>
      </div>

      {/* Processing overlay */}
      {status === 'processing' && <ProcessingOverlay />}

      {/* Result sheet */}
      {currentResult && status !== 'processing' && (
        <ResultSheet result={currentResult} onDismiss={resumeScanning} />
      )}

      {/* Error dialog */}
      {showError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => { clearError(); setShowError(null); }}>
          <div
            className="mx-8 p-8 rounded-3xl max-w-sm w-full"
            style={{ backgroundColor: colors.surface }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <svg className="w-16 h-16" style={{ color: showError === 'noConnection' ? theme.danger : theme.warning }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                {showError === 'noConnection' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m-2.829-2.829a5 5 0 000-7.07m-2.828 2.828a1 1 0 010 1.414" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-center" style={{ color: colors.textPrimary }}>
              {showError === 'noConnection' ? 'No Connection' : 'Error'}
            </h3>
            <p className="mt-2 text-center" style={{ color: colors.textSecondary }}>
              {showError === 'noConnection' ? 'Check your internet and try again' : 'Something went wrong. Please try again.'}
            </p>
            <button
              onClick={() => { clearError(); setShowError(null); retryConnection(); }}
              className="mt-6 w-full h-14 rounded-2xl text-lg font-bold text-white"
              style={{ backgroundColor: theme.accent }}
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
