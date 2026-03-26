import { elevenLabsTtsService } from './elevenLabsTts';
import { voiceRecognitionService } from './voiceRecognition';

function webSpeechFallback(text: string, lang: string): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) { resolve(); return; }
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang === 'fil' ? 'fil-PH' : 'en-US';
    utter.onend = () => resolve();
    utter.onerror = () => resolve();
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  });
}

export class TtsService {
  private defaultRate = 0.9;
  private currentLang = 'en';

  init() {
    // ElevenLabs needs no initialization
  }

  setSpeechRate(flutterRate: number) {
    // Map 0.25–1.0 to ElevenLabs speed ~0.75–1.25
    this.defaultRate = 0.75 + flutterRate * 0.5;
  }

  setLanguage(lang: string) {
    this.currentLang = lang;
  }

  async speak(text: string, lang: string = 'en'): Promise<void> {
    const activeLang = lang || this.currentLang;
    voiceRecognitionService.pauseForTts();
    try {
      await elevenLabsTtsService.speak(text, this.defaultRate);
    } catch (err) {
      console.warn('[TTS] ElevenLabs unavailable, falling back to Web Speech API:', err);
      await webSpeechFallback(text, activeLang);
    } finally {
      voiceRecognitionService.resumeAfterTts();
    }
  }

  async speakUrgent(text: string, lang: string = 'en'): Promise<void> {
    return this.speak(text, lang);
  }

  async speakCalm(text: string, lang: string = 'en'): Promise<void> {
    return this.speak(text, lang);
  }

  stop() {
    elevenLabsTtsService.stop();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    voiceRecognitionService.resumeAfterTts();
  }

  dispose() {
    elevenLabsTtsService.dispose();
  }
}

export const ttsService = new TtsService();