class SoundEngine {
  private ctx: AudioContext | null = null;
  private humGain: GainNode | null = null;
  muted = false;

  private ensureCtx(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => undefined);
    }
    return this.ctx;
  }

  private beep(freq: number, durSec: number, type: OscillatorType = 'sine', gainVal = 0.08): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durSec);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durSec);
  }

  click(): void {
    this.beep(580, 0.06, 'triangle', 0.05);
  }

  build(): void {
    this.beep(320, 0.09, 'square', 0.05);
    window.setTimeout(() => this.beep(480, 0.12, 'triangle', 0.06), 70);
  }

  alert(): void {
    this.beep(720, 0.14, 'sawtooth', 0.06);
    window.setTimeout(() => this.beep(520, 0.16, 'sawtooth', 0.06), 160);
  }

  success(): void {
    this.beep(523, 0.1, 'triangle', 0.07);
    window.setTimeout(() => this.beep(659, 0.1, 'triangle', 0.07), 90);
    window.setTimeout(() => this.beep(784, 0.18, 'triangle', 0.08), 180);
  }

  // Zumbido ambiente lunar (drone suave de base espacial)
  startAmbientHum(): void {
    const ctx = this.ensureCtx();
    if (!ctx || this.humGain) return;
    try {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      this.humGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(55, ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(110, ctx.currentTime);

      this.humGain.gain.setValueAtTime(0.015, ctx.currentTime);

      osc.connect(filter);
      filter.connect(this.humGain);
      this.humGain.connect(ctx.destination);
      osc.start();
    } catch {
      // AudioContext restrito antes de clique do usuario
    }
  }

  // Estalo agil de coleta de recursos (Chirp agudo agradavel)
  harvestPop(type: 'oxygen' | 'regolith' = 'oxygen'): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startFreq = type === 'oxygen' ? 520 : 380;
    const endFreq = type === 'oxygen' ? 880 : 640;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  // Sirene de tempestade solar (modulacao de alerta espacial)
  crisisSiren(): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    for (let i = 0; i < 3; i++) {
      window.setTimeout(() => {
        if (!this.ctx || this.muted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(740, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(440, this.ctx.currentTime + 0.22);
        gain.gain.setValueAtTime(0.09, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.22);
      }, i * 260);
    }
  }

  // Fanfarra triunfal de vitoria / medalhas / subida de rank / evolucao
  fanfare(): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const notes = [
      { f: 523.25, d: 0.12, t: 0 },
      { f: 659.25, d: 0.12, t: 110 },
      { f: 783.99, d: 0.14, t: 220 },
      { f: 1046.5, d: 0.35, t: 340 },
    ];
    notes.forEach((n) => {
      window.setTimeout(() => {
        if (!this.ctx || this.muted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + n.d);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + n.d);
      }, n.t);
    });
  }

  // Zumbido grave de acao bloqueada / falta de recurso
  errorBuzz(): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }
}

export const sfx = new SoundEngine();
