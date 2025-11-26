
export class AudioService {
  private context: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  
  // Rhythm & Scheduler Variables
  private isPlaying: boolean = false;
  private nextNoteTime: number = 0;
  private currentBeat: number = 0; // 16th note counter
  private timerID: number | null = null;
  private tempo: number = 105; // BPM - Light and upbeat
  private lookahead: number = 25.0; // ms
  private scheduleAheadTime: number = 0.1; // s

  // Ambient Texture
  private rumbleNode: AudioBufferSourceNode | null = null;
  private reverbNode: ConvolverNode | null = null;

  // Pentatonic Scale (C Major: C, D, E, G, A) - Happy & Bright
  private melodyScale = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50]; 

  constructor() {
    if (typeof window !== 'undefined') {
      this.isMuted = localStorage.getItem('goldfish_muted') === 'true';
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    
    if (!this.context) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.context = new AudioContextClass();
      
      // Master Gain
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);
      
      // BGM Gain - Set low as requested ("細細聲")
      this.bgmGain = this.context.createGain();
      this.bgmGain.connect(this.masterGain);
      this.bgmGain.gain.value = 0.12; 

      // Reverb for underwater spaciousness
      this.reverbNode = this.context.createConvolver();
      this.reverbNode.buffer = this.createImpulseResponse(2.0, 2.0);
      this.reverbNode.connect(this.masterGain);

      this.updateMuteState();
    }
    return this.context;
  }

  private createImpulseResponse(duration: number, decay: number): AudioBuffer {
    const ctx = this.context!;
    const length = ctx.sampleRate * duration;
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      const val = (Math.random() * 2 - 1) * Math.pow(1 - n, decay);
      left[i] = val;
      right[i] = val;
    }
    return impulse;
  }

  private updateMuteState() {
    if (this.masterGain && this.context) {
      const currentTime = this.context.currentTime;
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 1.0, currentTime, 0.2);
    }

    if (this.isMuted) {
      this.stopBGM();
    } else if (this.context && this.context.state === 'running') {
      this.startBGM();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('goldfish_muted', String(this.isMuted));
    
    if (!this.context) this.getContext();
    this.updateMuteState();
    
    if (!this.isMuted) {
      if (this.context?.state === 'suspended') {
        this.context.resume().then(() => this.startBGM());
      } else {
        this.startBGM();
      }
    }
    return this.isMuted;
  }

  public getMuteState(): boolean {
    return this.isMuted;
  }

  public async initAudio() {
    const ctx = this.getContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') await ctx.resume();
    if (!this.isMuted) this.startBGM();
  }

  // --- Rhythmic BGM Scheduler ---

  public startBGM() {
    if (this.isPlaying || !this.context) return;
    
    this.isPlaying = true;
    
    // 1. Base Layer: Water Rumble
    this.startRumble();

    // 2. Rhythmic Layer
    this.nextNoteTime = this.context.currentTime + 0.1;
    this.currentBeat = 0;
    this.scheduler();
  }

  public stopBGM() {
    this.isPlaying = false;
    if (this.timerID) window.clearTimeout(this.timerID);
    this.stopRumble();
  }

  private scheduler() {
    if (!this.isPlaying || !this.context) return;

    // Schedule notes ahead of time
    while (this.nextNoteTime < this.context.currentTime + this.scheduleAheadTime) {
      this.scheduleBeat(this.currentBeat, this.nextNoteTime);
      this.nextBeat();
    }
    
    this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
  }

  private nextBeat() {
    const secondsPerBeat = 60.0 / this.tempo;
    // We are scheduling 8th notes (2 notes per beat)
    this.nextNoteTime += 0.5 * secondsPerBeat; 
    this.currentBeat = (this.currentBeat + 1) % 16; // Loop every 8 beats (2 bars)
  }

  private scheduleBeat(beat: number, time: number) {
    if (!this.bgmGain) return;

    // --- Rhythm Section ---
    
    // Soft Shaker (Every 8th note, upbeat emphasis)
    if (beat % 2 === 0) {
      this.playShaker(time, 0.04); // Downbeat
    } else {
      this.playShaker(time, 0.03); // Upbeat
    }

    // Soft Kick (On beat 0, 4, 8, 12 - Classic 4/4)
    if (beat % 4 === 0) {
      this.playSoftKick(time);
    }

    // --- Melody Section (Marimba) ---
    // Randomly play notes from pentatonic scale to create a "noodling" feel
    // Higher chance on off-beats for syncopation (Lounge feel)
    const chance = (beat % 2 === 0) ? 0.3 : 0.6;
    
    if (Math.random() < chance) {
      const note = this.melodyScale[Math.floor(Math.random() * this.melodyScale.length)];
      this.playMarimba(time, note);
    }

    // Occasional Bubble Effect
    if (Math.random() > 0.95) {
      this.playBubble(time);
    }
  }

  // --- Synthesizers ---

  private startRumble() {
    if (!this.context || !this.bgmGain) return;
    if (this.rumbleNode) return;

    const bufferSize = this.context.sampleRate * 2;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }

    this.rumbleNode = this.context.createBufferSource();
    this.rumbleNode.buffer = buffer;
    this.rumbleNode.loop = true;

    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200; // Deeper rumble so it doesn't clash with music
    
    const rumbleGain = this.context.createGain();
    rumbleGain.gain.value = 0.4;

    this.rumbleNode.connect(filter);
    filter.connect(rumbleGain);
    rumbleGain.connect(this.bgmGain);
    
    this.rumbleNode.start();
  }

  private stopRumble() {
    if (this.rumbleNode) {
      try { this.rumbleNode.stop(); } catch(e) {}
      this.rumbleNode = null;
    }
  }

  private playShaker(time: number, vol: number) {
    if (!this.context || !this.bgmGain) return;
    
    const osc = this.context.createOscillator(); // Use noise buffer ideally, but random freq osc works for simple shaker
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();

    // White noise approximation using high freq random
    // For simplicity without buffer, we use a high triangle wave + rapid freq modulation or just a buffer
    // Let's create a tiny noise buffer on the fly or reuse one? 
    // Creating buffer is cheap for short sounds
    const bufferSize = this.context.sampleRate * 0.05;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const noise = this.context.createBufferSource();
    noise.buffer = buffer;

    filter.type = 'highpass';
    filter.frequency.value = 5000;

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);
    
    noise.start(time);
  }

  private playSoftKick(time: number) {
    if (!this.context || !this.bgmGain) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.3);

    gain.gain.setValueAtTime(0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

    osc.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc.stop(time + 0.3);
  }

  private playMarimba(time: number, freq: number) {
    if (!this.context || !this.bgmGain) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine'; // Sine is woody enough
    osc.frequency.setValueAtTime(freq, time);

    // Percussive envelope
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.4, time + 0.01); // Fast attack
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4); // Medium decay

    osc.connect(gain);
    gain.connect(this.bgmGain);
    
    if (this.reverbNode) {
        gain.connect(this.reverbNode); // Send to reverb for atmosphere
    }

    osc.start(time);
    osc.stop(time + 0.5);
  }

  private playBubble(time: number) {
    if (!this.context || !this.bgmGain) return;
    
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.type = 'sine';
    const startFreq = 400 + Math.random() * 400;
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(startFreq + 300, time + 0.1);
    
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.3, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

    osc.connect(gain);
    gain.connect(this.bgmGain);
    
    osc.start(time);
    osc.stop(time + 0.15);
  }

  // --- SFX (Foreground sounds - Keep unchanged) ---

  private playTone(freq: number, type: OscillatorType, duration: number, startTimeOffset: number = 0, slideFreq: number | null = null) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startTimeOffset);
    if (slideFreq) {
      osc.frequency.linearRampToValueAtTime(slideFreq, ctx.currentTime + startTimeOffset + duration);
    }
    
    gain.gain.setValueAtTime(0, ctx.currentTime + startTimeOffset);
    gain.gain.linearRampToValueAtTime(1, ctx.currentTime + startTimeOffset + (duration * 0.1));
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTimeOffset + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(ctx.currentTime + startTimeOffset);
    osc.stop(ctx.currentTime + startTimeOffset + duration);
  }

  public playClick() {
    if (this.isMuted || !this.context || !this.masterGain) return;
    const t = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.1);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  public playCorrect() {
    this.playTone(523.25, 'sine', 0.2, 0);
    this.playTone(659.25, 'sine', 0.2, 0.1);
    this.playTone(783.99, 'sine', 0.4, 0.2);
  }

  public playIncorrect() {
    this.playTone(150, 'sawtooth', 0.3, 0, 80);
    this.playTone(100, 'sawtooth', 0.3, 0.15, 50);
  }

  public playGameStart() {
    const notes = [440, 554, 659, 880, 1108]; 
    notes.forEach((freq, i) => this.playTone(freq, 'sine', 0.4, i * 0.1));
  }

  public playGameEnd() {
    this.playTone(523.25, 'triangle', 0.2, 0);
    this.playTone(523.25, 'triangle', 0.2, 0.15);
    this.playTone(523.25, 'triangle', 0.2, 0.30);
    this.playTone(659.25, 'triangle', 0.6, 0.45);
    this.playTone(783.99, 'triangle', 0.8, 0.45);
    this.playTone(1046.50, 'triangle', 1.0, 0.45);
  }
}

export const audioService = new AudioService();
