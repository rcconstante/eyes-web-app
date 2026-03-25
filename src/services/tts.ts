export class TtsService {
  private synth: SpeechSynthesis | null = null;
  private defaultRate = 0.9; // Web Speech API rate (0.1-10, default 1)

  init() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.synth = window.speechSynthesis;
    }
  }

  setSpeechRate(flutterRate: number) {
    // Flutter rate 0.25-1.0 maps to Web Speech API ~0.5-1.5
    this.defaultRate = 0.5 + flutterRate * 1.0;
  }

  setLanguage(_lang: string) {
    // Language is set per utterance
  }

  speak(text: string, lang: string = 'en-US'): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) { resolve(); return; }
      this.synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'fil' ? 'fil-PH' : 'en-US';
      utterance.rate = this.defaultRate;
      utterance.volume = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      this.synth.speak(utterance);
    });
  }

  speakUrgent(text: string, lang: string = 'en-US'): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) { resolve(); return; }
      this.synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'fil' ? 'fil-PH' : 'en-US';
      utterance.rate = Math.min(this.defaultRate + 0.3, 2.0);
      utterance.pitch = 1.2;
      utterance.volume = 1.0;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      this.synth.speak(utterance);
    });
  }

  speakCalm(text: string, lang: string = 'en-US'): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) { resolve(); return; }
      this.synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'fil' ? 'fil-PH' : 'en-US';
      utterance.rate = this.defaultRate;
      utterance.pitch = 0.95;
      utterance.volume = 1.0;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      this.synth.speak(utterance);
    });
  }

  stop() {
    this.synth?.cancel();
  }

  dispose() {
    this.synth?.cancel();
  }
}

export const ttsService = new TtsService();
