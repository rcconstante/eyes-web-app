/** BCP 47: Filipino; many engines expose Tagalog (tl) for Philippines speech. */
const FILIPINO_PRIMARY = new Set(['fil', 'tl']);

function normalizeVoiceLang(lang: string): string {
  return lang.toLowerCase().replace(/_/g, '-');
}

function isFilipinoVoice(voice: SpeechSynthesisVoice): boolean {
  const parts = normalizeVoiceLang(voice.lang).split('-');
  const primary = parts[0] ?? '';
  return FILIPINO_PRIMARY.has(primary);
}

function pickFilipinoVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const fil = voices.filter(isFilipinoVoice);
  if (fil.length === 0) return null;
  const norm = (v: SpeechSynthesisVoice) => normalizeVoiceLang(v.lang);
  return (
    fil.find((v) => norm(v) === 'fil-ph') ??
    fil.find((v) => norm(v) === 'tl-ph') ??
    fil.find((v) => norm(v).startsWith('fil-')) ??
    fil.find((v) => norm(v).startsWith('tl-')) ??
    fil[0]
  );
}

function pickEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const en = voices.filter((v) => normalizeVoiceLang(v.lang).startsWith('en'));
  if (en.length === 0) return null;
  const norm = (v: SpeechSynthesisVoice) => normalizeVoiceLang(v.lang);
  return (
    en.find((v) => norm(v) === 'en-us') ??
    en.find((v) => norm(v).startsWith('en-')) ??
    en[0]
  );
}

export class TtsService {
  private synth: SpeechSynthesis | null = null;
  private defaultRate = 0.9; // Web Speech API rate (0.1-10, default 1)

  init() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.synth = window.speechSynthesis;
    }
  }

  private applyVoice(utterance: SpeechSynthesisUtterance, lang: string): void {
    const voices = this.synth?.getVoices() ?? [];
    const wantsFilipino = lang === 'fil';
    if (wantsFilipino) {
      const filVoice = pickFilipinoVoice(voices);
      if (filVoice) {
        utterance.voice = filVoice;
        utterance.lang = filVoice.lang;
        return;
      }
      utterance.lang = 'fil-PH';
      return;
    }
    const enVoice = pickEnglishVoice(voices);
    if (enVoice) {
      utterance.voice = enVoice;
      utterance.lang = enVoice.lang;
    } else {
      utterance.lang = 'en-US';
    }
  }

  setSpeechRate(flutterRate: number) {
    // Flutter rate 0.25-1.0 maps to Web Speech API ~0.5-1.5
    this.defaultRate = 0.5 + flutterRate * 1.0;
  }

  setLanguage(lang: string) {
    // Language is set per utterance (kept for API symmetry).
    void lang;
  }

  speak(text: string, lang: string = 'en-US'): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) { resolve(); return; }
      this.synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      this.applyVoice(utterance, lang);
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
      this.applyVoice(utterance, lang);
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
      this.applyVoice(utterance, lang);
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
