// One Web Audio graph: sources -> bus (engine | sfx | music) -> master -> limiter -> analyser -> out.
// Everything is synthesized: no network audio files.
type Bus = "engine" | "sfx" | "music";

class AudioEngine {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private buses!: Record<Bus, GainNode>;
  analyser!: AnalyserNode;
  private noise!: AudioBuffer;
  private engine: {
    o1: OscillatorNode; o2: OscillatorNode; o3: OscillatorNode;
    shaper: WaveShaperNode; filter: BiquadFilterNode; gain: GainNode;
    rasp: BiquadFilterNode; raspGain: GainNode;
    turbo: OscillatorNode; turboGain: GainNode;
    screech: BiquadFilterNode; screechGain: GainNode;
    lfo: OscillatorNode; lfoGain: GainNode;
  } | null = null;
  enabled = true;
  musicOn = false;
  private musicTimer: number | null = null;
  private nextNoteTime = 0;
  private step = 0;

  /** Must be called from a user gesture. */
  ensure() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      const ctx = new Ctx();
      this.ctx = ctx;
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -8;
      limiter.ratio.value = 12;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.15;
      this.master = ctx.createGain();
      this.master.gain.value = this.enabled ? 0.9 : 0;
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.master.connect(limiter).connect(this.analyser).connect(ctx.destination);
      this.buses = {
        engine: ctx.createGain(),
        sfx: ctx.createGain(),
        music: ctx.createGain(),
      };
      this.buses.engine.gain.value = 0.8;
      this.buses.sfx.gain.value = 0.9;
      this.buses.music.gain.value = 0.32;
      Object.values(this.buses).forEach((b) => b.connect(this.master));
      const len = ctx.sampleRate * 2;
      this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      document.addEventListener("visibilitychange", () => {
        if (!this.ctx) return;
        if (document.hidden) void this.ctx.suspend();
        else if (this.enabled) void this.ctx.resume();
      });
    }
    if (this.ctx.state === "suspended" && this.enabled) void this.ctx.resume();
    return this.ctx;
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (on) this.ensure();
    if (!this.ctx) return;
    this.master.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.05);
    if (on) void this.ctx.resume();
  }

  private noiseSrc(loop = false) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = loop;
    if (!loop) src.loopStart = Math.random();
    return src;
  }

  // ---- Engine ------------------------------------------------------------
  startEngine() {
    const ctx = this.ensure();
    if (!ctx || this.engine) return;
    const o1 = ctx.createOscillator(); o1.type = "sawtooth";
    const o2 = ctx.createOscillator(); o2.type = "square";
    const o3 = ctx.createOscillator(); o3.type = "sawtooth"; o3.detune.value = 12;
    const mix = ctx.createGain(); mix.gain.value = 0.35;
    const g2 = ctx.createGain(); g2.gain.value = 0.5;
    const g3 = ctx.createGain(); g3.gain.value = 0.25;
    o1.connect(mix); o2.connect(g2).connect(mix); o3.connect(g3).connect(mix);
    const shaper = ctx.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = (i / 1023) * 2 - 1; curve[i] = Math.tanh(x * 3.2); }
    shaper.curve = curve;
    const filter = ctx.createBiquadFilter(); filter.type = "lowpass"; filter.Q.value = 3;
    // Low-rpm lope: amplitude modulation
    const am = ctx.createGain(); am.gain.value = 0.75;
    const lfo = ctx.createOscillator(); lfo.type = "triangle"; lfo.frequency.value = 12;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.25;
    lfo.connect(lfoGain).connect(am.gain);
    const gain = ctx.createGain(); gain.gain.value = 0;
    mix.connect(shaper).connect(filter).connect(am).connect(gain).connect(this.buses.engine);
    // Rasp
    const n = this.noiseSrc(true);
    const rasp = ctx.createBiquadFilter(); rasp.type = "bandpass"; rasp.Q.value = 2;
    const raspGain = ctx.createGain(); raspGain.gain.value = 0;
    n.connect(rasp).connect(raspGain).connect(this.buses.engine);
    // Turbo whistle
    const turbo = ctx.createOscillator(); turbo.type = "sine";
    const turboGain = ctx.createGain(); turboGain.gain.value = 0;
    turbo.connect(turboGain).connect(this.buses.engine);
    // Tyre screech
    const n2 = this.noiseSrc(true);
    const screech = ctx.createBiquadFilter(); screech.type = "bandpass"; screech.Q.value = 9; screech.frequency.value = 1500;
    const screechGain = ctx.createGain(); screechGain.gain.value = 0;
    n2.connect(screech).connect(screechGain).connect(this.buses.sfx);
    [o1, o2, o3, lfo, turbo].forEach((o) => o.start());
    n.start(); n2.start();
    this.engine = { o1, o2, o3, shaper, filter, gain, rasp, raspGain, turbo, turboGain, screech, screechGain, lfo, lfoGain };
  }

  stopEngine() {
    if (!this.ctx || !this.engine) return;
    const e = this.engine;
    const t = this.ctx.currentTime;
    e.gain.gain.setTargetAtTime(0, t, 0.15);
    e.raspGain.gain.setTargetAtTime(0, t, 0.1);
    e.turboGain.gain.setTargetAtTime(0, t, 0.1);
    e.screechGain.gain.setTargetAtTime(0, t, 0.05);
    this.engine = null;
    window.setTimeout(() => {
      [e.o1, e.o2, e.o3, e.lfo, e.turbo].forEach((o) => { try { o.stop(); } catch { /* already stopped */ } });
      [e.gain, e.raspGain, e.screechGain].forEach((g) => g.disconnect());
    }, 900);
  }

  get engineRunning() { return this.engine !== null; }

  updateEngine(p: { rpm: number; redline: number; throttle: number; cylinders: number; boost: number; slip: number; speed: number; bike: boolean }) {
    if (!this.ctx || !this.engine) return;
    const e = this.engine;
    const t = this.ctx.currentTime;
    const f = (p.rpm / 60) * (p.cylinders / 2) * (p.bike ? 0.5 : 0.5);
    const frac = p.rpm / p.redline;
    e.o1.frequency.setTargetAtTime(f, t, 0.02);
    e.o2.frequency.setTargetAtTime(f * 0.5, t, 0.02);
    e.o3.frequency.setTargetAtTime(f * (p.bike ? 2.01 : 1.5), t, 0.02);
    e.lfo.frequency.setTargetAtTime(Math.max(6, f * 0.25), t, 0.05);
    e.lfoGain.gain.setTargetAtTime(0.3 * (1 - frac), t, 0.05);
    e.filter.frequency.setTargetAtTime(300 + p.throttle * 2600 + frac * (p.bike ? 4200 : 2400), t, 0.03);
    e.gain.gain.setTargetAtTime(0.14 + p.throttle * 0.22 + frac * 0.12, t, 0.04);
    e.rasp.frequency.setTargetAtTime(f * 3, t, 0.03);
    e.raspGain.gain.setTargetAtTime((0.02 + p.throttle * 0.06) * (p.bike ? 1.6 : 1), t, 0.05);
    e.turbo.frequency.setTargetAtTime(2200 + p.boost * 4200, t, 0.05);
    e.turboGain.gain.setTargetAtTime(p.bike ? 0 : p.boost * p.boost * 0.035, t, 0.08);
    const sl = Math.min(1, Math.max(0, (p.slip - 0.15) * 2.2)) * Math.min(1, p.speed / 8);
    e.screech.frequency.setTargetAtTime(1300 + sl * 600 + Math.random() * 150, t, 0.03);
    e.screechGain.gain.setTargetAtTime(sl * 0.35, t, 0.05);
  }

  // ---- One-shots -----------------------------------------------------------
  private env(g: GainNode, t: number, peak: number, attack: number, decay: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  pop(intensity = 1) {
    const ctx = this.ctx; if (!ctx || !this.enabled) return;
    const t = ctx.currentTime;
    const n = this.noiseSrc();
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1200 + Math.random() * 1800;
    const g = ctx.createGain();
    this.env(g, t, 0.9 * intensity, 0.002, 0.07 + Math.random() * 0.05);
    n.connect(lp).connect(g).connect(this.buses.sfx);
    n.start(t, Math.random()); n.stop(t + 0.2);
    const o = ctx.createOscillator(); o.type = "sine";
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.09);
    const og = ctx.createGain(); this.env(og, t, 0.8 * intensity, 0.002, 0.1);
    o.connect(og).connect(this.buses.sfx); o.start(t); o.stop(t + 0.15);
  }

  blowOff() {
    const ctx = this.ctx; if (!ctx || !this.enabled) return;
    const t = ctx.currentTime;
    const n = this.noiseSrc();
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(5200, t); bp.frequency.exponentialRampToValueAtTime(1400, t + 0.5);
    const g = ctx.createGain(); this.env(g, t, 0.45, 0.01, 0.5);
    n.connect(bp).connect(g).connect(this.buses.sfx); n.start(t, Math.random()); n.stop(t + 0.6);
  }

  crash(impact: number) {
    const ctx = this.ctx; if (!ctx || !this.enabled) return;
    const t = ctx.currentTime;
    const v = Math.min(1, impact / 15);
    const n = this.noiseSrc();
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900;
    const g = ctx.createGain(); this.env(g, t, 0.2 + v * 0.7, 0.003, 0.3);
    n.connect(lp).connect(g).connect(this.buses.sfx); n.start(t, Math.random()); n.stop(t + 0.4);
    this.thud(0.5 + v * 0.5);
  }

  thud(vol = 1) {
    const ctx = this.ensure(); if (!ctx || !this.enabled) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = "sine";
    o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.25);
    const g = ctx.createGain(); this.env(g, t, 0.9 * vol, 0.004, 0.3);
    o.connect(g).connect(this.buses.sfx); o.start(t); o.stop(t + 0.4);
    const n = this.noiseSrc();
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 500;
    const ng = ctx.createGain(); this.env(ng, t, 0.4 * vol, 0.002, 0.12);
    n.connect(lp).connect(ng).connect(this.buses.sfx); n.start(t, Math.random()); n.stop(t + 0.2);
  }

  click(freq = 2400, at = 0) {
    const ctx = this.ensure(); if (!ctx || !this.enabled) return;
    const t = ctx.currentTime + at;
    const o = ctx.createOscillator(); o.type = "square"; o.frequency.value = freq;
    const g = ctx.createGain(); this.env(g, t, 0.25, 0.001, 0.03);
    o.connect(g).connect(this.buses.sfx); o.start(t); o.stop(t + 0.06);
  }

  unbuckle() { this.click(1800); this.click(2600, 0.07); this.click(1200, 0.16); }

  poof() {
    const ctx = this.ensure(); if (!ctx || !this.enabled) return;
    const t = ctx.currentTime;
    const n = this.noiseSrc();
    const bp = ctx.createBiquadFilter(); bp.type = "lowpass";
    bp.frequency.setValueAtTime(3000, t); bp.frequency.exponentialRampToValueAtTime(300, t + 0.7);
    const g = ctx.createGain(); this.env(g, t, 0.35, 0.03, 0.7);
    n.connect(bp).connect(g).connect(this.buses.sfx); n.start(t, Math.random()); n.stop(t + 0.9);
  }

  drawer() {
    const ctx = this.ensure(); if (!ctx || !this.enabled) return;
    const t = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const s = t + i * 0.09;
      const n = this.noiseSrc();
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 4;
      bp.frequency.setValueAtTime(900 + i * 200, s); bp.frequency.linearRampToValueAtTime(1600, s + 0.22);
      const g = ctx.createGain(); this.env(g, s, 0.22, 0.02, 0.22);
      n.connect(bp).connect(g).connect(this.buses.sfx); n.start(s, Math.random()); n.stop(s + 0.3);
    }
    this.click(900, 0.32); this.click(700, 0.34);
  }

  ring() {
    const ctx = this.ensure(); if (!ctx || !this.enabled) return;
    const t = ctx.currentTime;
    for (const start of [0, 1.6]) {
      const s = t + start;
      const g = ctx.createGain(); g.gain.value = 0;
      const trem = ctx.createGain(); trem.gain.value = 0;
      const lfo = ctx.createOscillator(); lfo.type = "square"; lfo.frequency.value = 20;
      const lfoG = ctx.createGain(); lfoG.gain.value = 0.5;
      lfo.connect(lfoG).connect(trem.gain);
      [440, 480].forEach((f) => {
        const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f;
        o.connect(trem); o.start(s); o.stop(s + 1.1);
      });
      trem.connect(g).connect(this.buses.sfx);
      g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.25, s + 0.02);
      g.gain.setValueAtTime(0.25, s + 1); g.gain.exponentialRampToValueAtTime(0.0001, s + 1.08);
      lfo.start(s); lfo.stop(s + 1.1);
    }
  }

  hover() { this.click(3200); }

  // ---- Music: phonk loop (808, cowbell melody, hats) ------------------------
  setMusic(on: boolean) {
    this.musicOn = on;
    const ctx = this.ensure();
    if (!ctx) return;
    if (on && this.musicTimer === null) {
      this.nextNoteTime = ctx.currentTime + 0.1;
      this.step = 0;
      this.musicTimer = window.setInterval(() => this.schedule(), 25);
    } else if (!on && this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private schedule() {
    const ctx = this.ctx; if (!ctx) return;
    const stepDur = 60 / 140 / 4;
    while (this.nextNoteTime < ctx.currentTime + 0.12) {
      this.playStep(this.step, this.nextNoteTime);
      this.nextNoteTime += stepDur;
      this.step = (this.step + 1) % 64;
    }
  }

  private playStep(step: number, t: number) {
    const ctx = this.ctx!; const out = this.buses.music;
    const s16 = step % 16;
    const bar = Math.floor(step / 16);
    // Kick
    if (s16 === 0 || s16 === 7 || s16 === 10) {
      const o = ctx.createOscillator(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      const g = ctx.createGain(); this.env(g, t, 0.9, 0.002, 0.25);
      o.connect(g).connect(out); o.start(t); o.stop(t + 0.3);
    }
    // Snare/clap on 4 and 12
    if (s16 === 4 || s16 === 12) {
      const n = this.noiseSrc(); const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1500;
      const g = ctx.createGain(); this.env(g, t, 0.45, 0.002, 0.16);
      n.connect(hp).connect(g).connect(out); n.start(t, Math.random()); n.stop(t + 0.2);
    }
    // Hats
    if (s16 % 2 === 1 || (bar === 3 && s16 > 12)) {
      const n = this.noiseSrc(); const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 8000;
      const g = ctx.createGain(); this.env(g, t, 0.12, 0.001, 0.04);
      n.connect(hp).connect(g).connect(out); n.start(t, Math.random()); n.stop(t + 0.06);
    }
    // 808 bass
    const roots = [41.2, 41.2, 49.0, 36.7]; // E1 E1 G1 D1
    if (s16 === 0 || s16 === 10) {
      const f = roots[bar] ?? 41.2;
      const o = ctx.createOscillator(); o.type = "sine"; o.frequency.setValueAtTime(f * 2, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.06);
      const sh = ctx.createWaveShaper(); const c = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 127.5 - 1; c[i] = Math.tanh(x * 2); } sh.curve = c;
      const g = ctx.createGain(); this.env(g, t, 0.7, 0.005, 0.55);
      o.connect(sh).connect(g).connect(out); o.start(t); o.stop(t + 0.65);
    }
    // Cowbell melody (the phonk signature)
    const melody = [76, -1, 79, -1, 81, 79, -1, 76, -1, 74, -1, 76, 79, -1, 74, -1];
    const note = melody[s16] ?? -1;
    if (note > 0 && bar !== 1) {
      const f = 440 * Math.pow(2, (note - 69) / 12);
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = f * 1.4; bp.Q.value = 2.5;
      const g = ctx.createGain(); this.env(g, t, 0.22, 0.001, 0.18);
      [f, f * 1.48].forEach((ff) => { const o = ctx.createOscillator(); o.type = "square"; o.frequency.value = ff; o.connect(bp); o.start(t); o.stop(t + 0.22); });
      bp.connect(g).connect(out);
    }
  }

  level() {
    if (!this.ctx) return { peak: 0 };
    const buf = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buf);
    let peak = 0; for (const v of buf) peak = Math.max(peak, Math.abs(v));
    return { peak };
  }
}

export const audio = new AudioEngine();
