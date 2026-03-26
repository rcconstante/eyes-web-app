/**
 * Voice Recognition Service
 * Uses Web Speech Recognition API for voice commands.
 * Supports commands to capture images and trigger app introduction.
 */

type VoiceCommand = 'capture' | 'intro';
type CommandCallback = (command: VoiceCommand) => void;

const CAPTURE_PHRASES = [
  'take photo', 'take a photo', 'take picture', 'take a picture',
  'capture', 'analyze', 'scan', 'snap',
  'kunan', 'suriin', 'i-scan', 'kuhanan',
];

const INTRO_PHRASES = [
  'eyes what can you do',
  'what can you do',
  'ano magagawa mo',
  'eyes ano magagawa mo',
  'what is eyes',
  'ano ang eyes',
];

export class VoiceRecognitionService {
  private recognition: any = null;
  private _isListening = false;
  private callback: CommandCallback | null = null;
  private pausedForTts = false;

  get isListening(): boolean {
    return this._isListening && !this.pausedForTts;
  }

  get isSupported(): boolean {
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  setLanguage(lang: string) {
    if (this.recognition) {
      this.recognition.lang = lang === 'fil' ? 'fil-PH' : 'en-US';
    }
  }

  init(callback: CommandCallback, lang: string = 'en'): boolean {
    this.callback = callback;

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) return false;

    this.recognition = new SpeechRecognitionAPI();
    this.recognition.continuous = true;
    this.recognition.interimResults = false;
    this.recognition.lang = lang === 'fil' ? 'fil-PH' : 'en-US';
    this.recognition.maxAlternatives = 3;

    this.recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          // Check all alternatives for a match
          for (let j = 0; j < result.length; j++) {
            const transcript = result[j].transcript.toLowerCase().trim();
            const command = this.matchCommand(transcript);
            if (command) {
              this.callback?.(command);
              return;
            }
          }
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        this._isListening = false;
      }
      // For other errors (network, no-speech), let onend restart
    };

    this.recognition.onend = () => {
      if (this._isListening && !this.pausedForTts) {
        try {
          this.recognition?.start();
        } catch {
          // already started
        }
      }
    };

    return true;
  }

  private matchCommand(transcript: string): VoiceCommand | null {
    for (const phrase of INTRO_PHRASES) {
      if (transcript.includes(phrase)) return 'intro';
    }
    for (const phrase of CAPTURE_PHRASES) {
      if (transcript.includes(phrase)) return 'capture';
    }
    return null;
  }

  start() {
    if (!this.recognition) return;
    this._isListening = true;
    this.pausedForTts = false;
    try {
      this.recognition.start();
    } catch {
      // already started
    }
  }

  stop() {
    this._isListening = false;
    this.pausedForTts = false;
    try {
      this.recognition?.stop();
    } catch {
      // not started
    }
  }

  /** Pause recognition temporarily (e.g. while TTS is speaking) */
  pauseForTts() {
    if (!this._isListening) return;
    this.pausedForTts = true;
    try {
      this.recognition?.stop();
    } catch {
      // not started
    }
  }

  /** Resume recognition after TTS finishes */
  resumeAfterTts() {
    if (!this._isListening) return;
    this.pausedForTts = false;
    try {
      this.recognition?.start();
    } catch {
      // already started
    }
  }

  dispose() {
    this.stop();
    this.recognition = null;
    this.callback = null;
  }
}

export const voiceRecognitionService = new VoiceRecognitionService();
