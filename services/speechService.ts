

export type VoiceStyle = 'gentle' | 'aggressive' | 'neutral';

export class SpeechService {
  private synthesis: SpeechSynthesis;
  private femaleVoice: SpeechSynthesisVoice | null = null;
  private maleVoice: SpeechSynthesisVoice | null = null;
  private defaultVoice: SpeechSynthesisVoice | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Check if browser supports speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      
      // Attempt to load voices immediately
      this.loadVoices();
      
      // Some browsers load voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.loadVoices();
        };
      }
      
      // Sync mute state from localStorage
      this.isMuted = localStorage.getItem('goldfish_muted') === 'true';
    } else {
      console.warn("Text-to-speech not supported in this browser.");
      this.synthesis = {
        speak: () => {},
        cancel: () => {},
        getVoices: () => [],
        paused: false,
        pending: false,
        speaking: false,
        pause: () => {},
        resume: () => {},
        onvoiceschanged: null
      } as unknown as SpeechSynthesis;
    }
  }

  private loadVoices() {
    const voices = this.synthesis.getVoices();
    const cantoneseVoices = voices.filter(v => v.lang === 'zh-HK');
    
    // 1. Identify Female Voice (Sin-ji, Tracy, or just the first one usually)
    this.femaleVoice = cantoneseVoices.find(v => v.name.includes('Sin-ji') || v.name.includes('Tracy') || v.name.includes('Female')) || cantoneseVoices[0] || null;

    // 2. Identify Male Voice (Danny, or explicitly named Male)
    this.maleVoice = cantoneseVoices.find(v => v.name.includes('Danny') || v.name.includes('Male')) || null;

    // Debug
    // console.log("Voices Loaded. Female:", this.femaleVoice?.name, "Male:", this.maleVoice?.name);
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.cancel();
    }
  }

  public speak(text: string, style: VoiceStyle = 'neutral', priority: boolean = true) {
    if (this.isMuted) return;

    if (priority) {
      this.cancel(); // Stop current speech to say new thing
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-HK';
    utterance.volume = 1.0;

    let targetVoice = this.femaleVoice;
    let pitch = 1.0;
    let rate = 1.0;

    if (style === 'aggressive') {
      // 答錯：男人、粗魯、惡、快
      if (this.maleVoice) {
        targetVoice = this.maleVoice;
        pitch = 0.8; // Lower pitch for authority/anger
        rate = 1.4;  // Much Faster, impatient
      } else {
        // No male voice found? Pitch shift the female voice WAY down to sound scary/weird
        targetVoice = this.femaleVoice;
        pitch = 0.5; // Deep "monster" voice
        rate = 1.4; // Fast
      }
    } else if (style === 'gentle') {
      // 答啱：女人、溫柔
      targetVoice = this.femaleVoice;
      pitch = 1.1; // Slightly higher for sweetness
      rate = 0.9;  // Slightly slower/calmer
    } else {
      // Neutral / Question
      targetVoice = this.femaleVoice;
      pitch = 1.0;
      rate = 1.0;
    }

    if (targetVoice) {
      utterance.voice = targetVoice;
    }

    utterance.pitch = pitch;
    utterance.rate = rate;

    this.synthesis.speak(utterance);
  }

  public cancel() {
    this.synthesis.cancel();
  }
}

export const speechService = new SpeechService();
