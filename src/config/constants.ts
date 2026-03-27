export const AppConstants = {
  appName: 'EYES',
  appTagline: 'AI-Powered Vision Assistance',
  appVersion: '1.0.0',

  baseUrl: 'eyes-flutter-backend-production.up.railway.app', //p'
  analyzeEndpoint: '/api/analyze',
  apiTimeoutMs: 10000,

  defaultVoiceEnabled: true,
  defaultVibrationEnabled: true,
  defaultVibrationIntensity: 2,
  defaultSpeechRate: 0.45,
  defaultAutoScan: false,
  defaultScanIntervalSeconds: 5,
  defaultLanguage: 'en' as 'en' | 'fil',

  scanIntervals: [3, 5, 10, 15],
  maxHistoryItems: 20,

  distanceVeryClose: 1.0,
  distanceClose: 3.0,
  distanceMedium: 5.0,

  aboutDescription:
    'EYES is an assistive mobile application designed to help visually ' +
    'impaired users perceive their surroundings through AI-powered object ' +
    'detection, distance estimation, and scene understanding.',

  thesisDisclaimer:
    'This application was developed as part of an undergraduate thesis ' +
    'project. It is intended for research and demonstration purposes.',

  aiModels: [
    'YOLOv8n — Object Detection',
    'MiDaS — Depth Estimation',
    'Zero-DCE — Low-Light Enhancement',
  ],

  developers: [
    'Giancarlo Inigo S. Fandino',
    'Erick Lorenzo P. Belen',
    'Gebriel Lamvert C. Ginete',
  ],

  institution: 'Your University Name',
  academicYear: 'A.Y. 2025–2026',
} as const;
