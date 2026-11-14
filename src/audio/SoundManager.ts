/**
 * AFTERLIGHT — Cinematic Audio Synthesizer Engine
 * Uses Web Audio API to synthesize photorealistic planetary ambient soundscapes,
 * atmospheric winds, telemetry pulses, and cinematic tonal cues without external audio files.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isSfxMuted: boolean = SoundManager.getPersistedSfxMuted();
  private masterGain: GainNode | null = null;
  private transitionGain: GainNode | null = null;
  private currentAmbienceType: string | null = null;
  private ambienceNodes: {
    sources: (AudioNode | OscillatorNode | AudioBufferSourceNode)[];
    gain: GainNode;
  } | null = null;
  private isDucked: boolean = false;
  private readonly NORMAL_AMBIENCE_GAIN = 0.30;
  private readonly DUCKED_AMBIENCE_GAIN = 0.07;

  // Dedicated transition management for zero-overlap and rate-limiting
  private activeTransitionNodes: (AudioNode | OscillatorNode | AudioBufferSourceNode)[] = [];
  private lastTransitionTime: number = 0;

  private static getPersistedSfxMuted(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('afterlight_sfx_muted') === 'true';
    } catch {
      return false;
    }
  }

  private initContext() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // Dedicated transition audio bus for navigation sound effects
        this.transitionGain = this.ctx.createGain();
        this.transitionGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
        this.transitionGain.connect(this.masterGain);
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch {
      // Safely ignore audio context errors in headless test environments
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      const targetGain = muted ? 0 : 0.4;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.2);
    }
  }

  public setSfxMuted(muted: boolean) {
    this.isSfxMuted = muted;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('afterlight_sfx_muted', String(muted));
      }
    } catch {}
  }

  public isSoundEffectsMuted(): boolean {
    return this.isSfxMuted;
  }

  public toggleSfx(): boolean {
    const next = !this.isSfxMuted;
    this.setSfxMuted(next);
    return next;
  }

  public isMasterMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime, 0.1);
    }
  }

  /**
   * Audio ducking: attenuates ambient soundscapes smoothly when the curator is speaking
   * to provide clear vocal dominance without masking speech frequencies.
   */
  public duckForNarration(duck: boolean) {
    this.isDucked = duck;
    if (!this.ctx || !this.ambienceNodes) return;

    const targetGain = duck ? this.DUCKED_AMBIENCE_GAIN : this.NORMAL_AMBIENCE_GAIN;
    const timeConstant = duck ? 0.2 : 0.5;

    try {
      this.ambienceNodes.gain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, timeConstant);
    } catch {
      // Ignore transition timing error if AudioContext is state-locked
    }
  }

  public isAudioDucked(): boolean {
    return this.isDucked;
  }

  // Create pink / brownian noise buffer for natural atmospheric wind
  private createNoiseBuffer(type: 'brown' | 'pink'): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 5; // 5 seconds loop
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'brown') {
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; // boost gain
      }
    } else {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        data[i] *= 0.11;
        b6 = white * 0.115926;
      }
    }
    return buffer;
  }

  public playAmbience(type: 'lunar_vacuum' | 'martian_wind' | 'deep_telemetry') {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    if (this.currentAmbienceType === type && this.ambienceNodes) return;

    this.stopAmbience();
    this.currentAmbienceType = type;

    const ambienceGain = this.ctx.createGain();
    const targetGain = this.isDucked ? this.DUCKED_AMBIENCE_GAIN : this.NORMAL_AMBIENCE_GAIN;
    ambienceGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    ambienceGain.gain.exponentialRampToValueAtTime(targetGain, this.ctx.currentTime + 2.5);
    ambienceGain.connect(this.masterGain);

    const activeNodes: (AudioNode | OscillatorNode | AudioBufferSourceNode)[] = [];

    if (type === 'martian_wind') {
      // Martian wind: brownian noise + resonant bandpass filter + slow LFO gust
      const buffer = this.createNoiseBuffer('brown');
      if (buffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(280, this.ctx.currentTime);
        filter.Q.setValueAtTime(1.8, this.ctx.currentTime);

        // LFO for slow gusting
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime); // 0.15 Hz slow breath
        lfoGain.gain.setValueAtTime(140, this.ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        // Low drone for Martian core mass
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(55, this.ctx.currentTime);
        subGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        subOsc.connect(subGain);
        subGain.connect(ambienceGain);

        noise.connect(filter);
        filter.connect(ambienceGain);

        noise.start();
        lfo.start();
        subOsc.start();

        activeNodes.push(noise, filter, lfo, lfoGain, subOsc, subGain);
      }
    } else if (type === 'lunar_vacuum') {
      // Lunar vacuum: subtle suit air circulation hum + high frequency silence shimmer
      const humOsc1 = this.ctx.createOscillator();
      const humOsc2 = this.ctx.createOscillator();
      const humFilter = this.ctx.createBiquadFilter();
      const humGain = this.ctx.createGain();

      humOsc1.type = 'triangle';
      humOsc1.frequency.setValueAtTime(60, this.ctx.currentTime); // 60 Hz hum
      humOsc2.type = 'sine';
      humOsc2.frequency.setValueAtTime(120.5, this.ctx.currentTime); // detuned second harmonic

      humFilter.type = 'lowpass';
      humFilter.frequency.setValueAtTime(180, this.ctx.currentTime);
      humGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

      humOsc1.connect(humFilter);
      humOsc2.connect(humFilter);
      humFilter.connect(humGain);
      humGain.connect(ambienceGain);

      humOsc1.start();
      humOsc2.start();
      activeNodes.push(humOsc1, humOsc2, humFilter, humGain);
    } else if (type === 'deep_telemetry') {
      // Deep space: cosmic sub-bass drone + distant micro pulsar frequency
      const drone = this.ctx.createOscillator();
      const droneFilter = this.ctx.createBiquadFilter();
      const droneGain = this.ctx.createGain();

      drone.type = 'sawtooth';
      drone.frequency.setValueAtTime(43.65, this.ctx.currentTime); // F1 sub
      droneFilter.type = 'lowpass';
      droneFilter.frequency.setValueAtTime(80, this.ctx.currentTime);
      droneGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

      drone.connect(droneFilter);
      droneFilter.connect(droneGain);
      droneGain.connect(ambienceGain);
      drone.start();

      activeNodes.push(drone, droneFilter, droneGain);
    }

    this.ambienceNodes = {
      sources: activeNodes,
      gain: ambienceGain,
    };
  }

  public stopAmbience() {
    this.isDucked = false;
    if (this.ambienceNodes && this.ctx) {
      const { sources, gain } = this.ambienceNodes;
      gain.gain.setValueAtTime(gain.gain.value, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.2);
      setTimeout(() => {
        sources.forEach((node) => {
          try {
            if ('stop' in node && typeof (node as OscillatorNode).stop === 'function') {
              (node as OscillatorNode).stop();
            }
            node.disconnect();
          } catch {
            // Ignore already stopped
          }
        });
        gain.disconnect();
      }, 1300);
      this.ambienceNodes = null;
    }
    this.currentAmbienceType = null;
  }

  // =========================================================================
  // CINEMATIC NAVIGATION SOUND DESIGN ENGINE
  // =========================================================================

  /**
   * Prepares transition audio bus: checks mute/sfx states, enforces anti-stacking
   * rate-limiting (min 60ms), and applies voice-stealing to previous transition nodes.
   */
  private prepareTransition(minIntervalMs: number = 60): { ctx: AudioContext; dest: GainNode } | null {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted || this.isSfxMuted) return null;

    const nowMs = performance.now();
    if (nowMs - this.lastTransitionTime < minIntervalMs) {
      return null;
    }
    this.lastTransitionTime = nowMs;

    // Gracefully fade/stop previous transition voices to prevent sound overlap/stacking
    if (this.activeTransitionNodes.length > 0) {
      const stopTime = this.ctx.currentTime + 0.02;
      this.activeTransitionNodes.forEach((node) => {
        try {
          if ('stop' in node && typeof (node as OscillatorNode).stop === 'function') {
            (node as OscillatorNode).stop(stopTime);
          }
        } catch {}
      });
      this.activeTransitionNodes = [];
    }

    return { ctx: this.ctx, dest: this.transitionGain || this.masterGain };
  }

  private registerTransitionNodes(...nodes: (AudioNode | OscillatorNode | AudioBufferSourceNode)[]) {
    this.activeTransitionNodes.push(...nodes);
  }

  /**
   * Calculates effective SFX gain: when curator Dr. Mae Vance is speaking,
   * navigation sound effects are ducked by 50% (-6 dB) to guarantee vocal dominance.
   */
  private getEffectiveSfxGain(nominalGain: number): number {
    return this.isDucked ? nominalGain * 0.5 : nominalGain;
  }

  /**
   * 1. Arrival -> Destination Selection
   * Low resonant swell with gentle rising celestial overtone.
   */
  public playNavArrivalToDestinations() {
    const ready = this.prepareTransition(100);
    if (!ready) return;
    const { ctx, dest } = ready;
    const now = ctx.currentTime;
    const peakGain = this.getEffectiveSfxGain(0.12);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(130.81, now); // C3
    osc1.frequency.exponentialRampToValueAtTime(196.00, now + 0.65); // G3

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(261.63, now); // C4
    osc2.frequency.exponentialRampToValueAtTime(392.00, now + 0.65); // G4

    sub.type = 'sine';
    sub.frequency.setValueAtTime(65.41, now); // C2

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, now);
    filter.frequency.exponentialRampToValueAtTime(850, now + 0.5);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);

    osc1.connect(filter);
    osc2.connect(filter);
    sub.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc1.start(now);
    osc2.start(now);
    sub.start(now);
    osc1.stop(now + 0.8);
    osc2.stop(now + 0.8);
    sub.stop(now + 0.8);

    this.registerTransitionNodes(osc1, osc2, sub, filter, gain);
  }

  /**
   * 2. Moon Selection
   * Cold silver lunar clarity, crystalline vacuum chime.
   */
  public playNavMoonSelected() {
    const ready = this.prepareTransition(80);
    if (!ready) return;
    const { ctx, dest } = ready;
    const now = ctx.currentTime;
    const peakGain = this.getEffectiveSfxGain(0.09);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now); // E5
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.51, now); // E6
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1975.53, now); // B6 delicate high overtone

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(1.0, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);

    osc1.connect(filter);
    osc2.connect(filter);
    osc3.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    osc1.stop(now + 1.4);
    osc2.stop(now + 1.4);
    osc3.stop(now + 1.4);

    this.registerTransitionNodes(osc1, osc2, osc3, filter, gain);
  }

  /**
   * 3. Mars Selection
   * Warm amber resonant pulse, dry iron atmospheric acoustic mass.
   */
  public playNavMarsSelected() {
    const ready = this.prepareTransition(80);
    if (!ready) return;
    const { ctx, dest } = ready;
    const now = ctx.currentTime;
    const peakGain = this.getEffectiveSfxGain(0.11);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(174.61, now); // F3
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(261.63, now); // C4
    sub.type = 'sine';
    sub.frequency.setValueAtTime(87.31, now); // F2

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(520, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + 0.6);
    filter.Q.setValueAtTime(1.8, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

    osc1.connect(filter);
    osc2.connect(filter);
    sub.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc1.start(now);
    osc2.start(now);
    sub.start(now);
    osc1.stop(now + 0.9);
    osc2.stop(now + 0.9);
    sub.stop(now + 0.9);

    this.registerTransitionNodes(osc1, osc2, sub, filter, gain);
  }

  /**
   * 4. Environment Loading Start
   * Orbital entry deceleration glide.
   */
  public playNavLoadingStart() {
    const ready = this.prepareTransition(100);
    if (!ready) return;
    const { ctx, dest } = ready;
    const now = ctx.currentTime;
    const peakGain = this.getEffectiveSfxGain(0.10);

    const osc = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220.00, now); // A3
    osc.frequency.exponentialRampToValueAtTime(73.42, now + 1.0); // D2

    sub.type = 'sine';
    sub.frequency.setValueAtTime(48.00, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

    osc.connect(filter);
    sub.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(now);
    sub.start(now);
    osc.stop(now + 1.15);
    sub.stop(now + 1.15);

    this.registerTransitionNodes(osc, sub, filter, gain);
  }

  /**
   * 5. Environment Loading Complete
   * Orbital stabilization & landing confirmation chord.
   */
  public playNavLoadingComplete() {
    const ready = this.prepareTransition(100);
    if (!ready) return;
    const { ctx, dest } = ready;
    const now = ctx.currentTime;
    const peakGain = this.getEffectiveSfxGain(0.09);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    const microPing = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(293.66, now); // D4
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(440.00, now); // A4
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(587.33, now); // D5

    microPing.type = 'sine';
    microPing.frequency.setValueAtTime(1174.66, now); // D6 micro telemetry confirm

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(950, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.45);

    osc1.connect(filter);
    osc2.connect(filter);
    osc3.connect(filter);
    microPing.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    microPing.start(now);
    microPing.stop(now + 0.04);
    osc1.stop(now + 1.5);
    osc2.stop(now + 1.5);
    osc3.stop(now + 1.5);

    this.registerTransitionNodes(osc1, osc2, osc3, microPing, filter, gain);
  }

  /**
   * 6. Exhibition Entry
   * Spacious museum hall architectural presence cue.
   */
  public playNavExhibitionEntry() {
    const ready = this.prepareTransition(100);
    if (!ready) return;
    const { ctx, dest } = ready;
    const now = ctx.currentTime;
    const peakGain = this.getEffectiveSfxGain(0.08);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(220.00, now); // A3
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(293.66, now); // D4
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(440.00, now); // A4

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, now);
    filter.frequency.exponentialRampToValueAtTime(750, now + 0.7);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.55);

    osc1.connect(filter);
    osc2.connect(filter);
    osc3.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    osc1.stop(now + 1.6);
    osc2.stop(now + 1.6);
    osc3.stop(now + 1.6);

    this.registerTransitionNodes(osc1, osc2, osc3, filter, gain);
  }

  /**
   * 7. Artifact Selection
   * Precise, understated glass/hardware card touch ping.
   */
  public playNavArtifactSelect() {
    const ready = this.prepareTransition(40);
    if (!ready) return;
    const { ctx, dest } = ready;
    const now = ctx.currentTime;
    const peakGain = this.getEffectiveSfxGain(0.07);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, now); // A5

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(dest);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.28);
    osc2.stop(now + 0.28);

    this.registerTransitionNodes(osc1, osc2, gain);
  }

  /**
   * 8. Artifact Details Opening
   * Mechanical aperture glide into artifact telemetry record.
   */
  public playNavArtifactDetailsOpen() {
    const ready = this.prepareTransition(80);
    if (!ready) return;
    const { ctx, dest } = ready;
    const now = ctx.currentTime;
    const peakGain = this.getEffectiveSfxGain(0.09);

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(349.23, now); // F4
    osc.frequency.setValueAtTime(523.25, now + 0.06); // C5

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(1300, now + 0.4);
    filter.Q.setValueAtTime(1.5, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + 0.7);

    this.registerTransitionNodes(osc, filter, gain);
  }

  /**
   * 9. Documentary Opening
   * Cinematic documentary prologue swell.
   */
  public playNavDocumentaryOpen() {
    const ready = this.prepareTransition(100);
    if (!ready) return;
    const { ctx, dest } = ready;
    const now = ctx.currentTime;
    const peakGain = this.getEffectiveSfxGain(0.10);

    const oscSub = ctx.createOscillator();
    const oscMid = ctx.createOscillator();
    const oscChime = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    oscSub.type = 'sine';
    oscSub.frequency.setValueAtTime(98.00, now); // G2
    oscMid.type = 'sine';
    oscMid.frequency.setValueAtTime(196.00, now); // G3
    oscChime.type = 'sine';
    oscChime.frequency.setValueAtTime(783.99, now); // G5 celestial overtone

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(360, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

    oscSub.connect(filter);
    oscMid.connect(filter);
    oscChime.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    oscSub.start(now);
    oscMid.start(now);
    oscChime.start(now);
    oscSub.stop(now + 2.1);
    oscMid.stop(now + 2.1);
    oscChime.stop(now + 2.1);

    this.registerTransitionNodes(oscSub, oscMid, oscChime, filter, gain);
  }

  /**
   * 10. Story Chapter Next
   * Forward narrative progression tone (ascending major third).
   */
  public playNavStoryChapterNext() {
    const ready = this.prepareTransition(60);
    if (!ready) return;
    const { ctx, dest } = ready;
    const now = ctx.currentTime;
    const peakGain = this.getEffectiveSfxGain(0.07);

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440.00, now); // A4
    osc.frequency.setValueAtTime(554.37, now + 0.05); // C#5

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(850, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + 0.42);

    this.registerTransitionNodes(osc, filter, gain);
  }

  /**
   * 11. Story Chapter Previous
   * Backward narrative progression tone (descending major third).
   */
  public playNavStoryChapterPrev() {
    const ready = this.prepareTransition(60);
    if (!ready) return;
    const { ctx, dest } = ready;
    const now = ctx.currentTime;
    const peakGain = this.getEffectiveSfxGain(0.07);

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(554.37, now); // C#5
    osc.frequency.setValueAtTime(440.00, now + 0.05); // A4

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(850, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + 0.42);

    this.registerTransitionNodes(osc, filter, gain);
  }

  /**
   * 12. Legacy View Opening
   * Contemplative memorial conclusion tone (open 5th chord).
   */
  public playNavLegacyOpen() {
    const ready = this.prepareTransition(100);
    if (!ready) return;
    const { ctx, dest } = ready;
    const now = ctx.currentTime;
    const peakGain = this.getEffectiveSfxGain(0.10);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(130.81, now); // C3
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(196.00, now); // G3
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(392.00, now); // G4

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.3);

    osc1.connect(filter);
    osc2.connect(filter);
    osc3.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    osc1.stop(now + 2.4);
    osc2.stop(now + 2.4);
    osc3.stop(now + 2.4);

    this.registerTransitionNodes(osc1, osc2, osc3, filter, gain);
  }

  /**
   * 13. Return to Exhibition
   * Receding transition sweep back into the gallery hall.
   */
  public playNavReturnToExhibition() {
    const ready = this.prepareTransition(80);
    if (!ready) return;
    const { ctx, dest } = ready;
    const now = ctx.currentTime;
    const peakGain = this.getEffectiveSfxGain(0.08);

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440.00, now); // A4
    osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.45); // C4

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(220, now + 0.45);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.50);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + 0.55);

    this.registerTransitionNodes(osc, filter, gain);
  }

  /**
   * 14. Browser Back Navigation
   * Unobtrusive descending electronic harmonic.
   */
  public playNavBrowserBack() {
    const ready = this.prepareTransition(60);
    if (!ready) return;
    const { ctx, dest } = ready;
    const now = ctx.currentTime;
    const peakGain = this.getEffectiveSfxGain(0.07);

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(493.88, now); // B4
    osc.frequency.setValueAtTime(392.00, now + 0.04); // G4

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(950, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + 0.35);

    this.registerTransitionNodes(osc, filter, gain);
  }

  /**
   * 15. Browser Forward Navigation
   * Unobtrusive ascending electronic harmonic.
   */
  public playNavBrowserForward() {
    const ready = this.prepareTransition(60);
    if (!ready) return;
    const { ctx, dest } = ready;
    const now = ctx.currentTime;
    const peakGain = this.getEffectiveSfxGain(0.07);

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(392.00, now); // G4
    osc.frequency.setValueAtTime(493.88, now + 0.04); // B4

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(950, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + 0.35);

    this.registerTransitionNodes(osc, filter, gain);
  }

  /**
   * 16. Modal Open & Modal Close
   * Soft acoustic focus and defocus pings.
   */
  public playNavModalOpen() {
    const ready = this.prepareTransition(60);
    if (!ready) return;
    const { ctx, dest } = ready;
    const now = ctx.currentTime;
    const peakGain = this.getEffectiveSfxGain(0.06);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(783.99, now + 0.04); // G5

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + 0.26);

    this.registerTransitionNodes(osc, gain);
  }

  public playNavModalClose() {
    const ready = this.prepareTransition(60);
    if (!ready) return;
    const { ctx, dest } = ready;
    const now = ctx.currentTime;
    const peakGain = this.getEffectiveSfxGain(0.06);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(392.00, now); // G4
    osc.frequency.setValueAtTime(329.63, now + 0.04); // E4

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.20);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + 0.22);

    this.registerTransitionNodes(osc, gain);
  }

  /**
   * 17. Free Exploration / Map Entry and Exit
   * Surface map coordinate grid lock & disengage pulses.
   */
  public playNavExplorationEnter() {
    const ready = this.prepareTransition(80);
    if (!ready) return;
    const { ctx, dest } = ready;
    const now = ctx.currentTime;
    const peakGain = this.getEffectiveSfxGain(0.08);

    const osc = ctx.createOscillator();
    const ping = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220.00, now);
    osc.frequency.exponentialRampToValueAtTime(440.00, now + 0.4);

    ping.type = 'sine';
    ping.frequency.setValueAtTime(880.00, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(700, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);

    osc.connect(filter);
    ping.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(now);
    ping.start(now);
    ping.stop(now + 0.05);
    osc.stop(now + 0.52);

    this.registerTransitionNodes(osc, ping, filter, gain);
  }

  public playNavExplorationExit() {
    const ready = this.prepareTransition(80);
    if (!ready) return;
    const { ctx, dest } = ready;
    const now = ctx.currentTime;
    const peakGain = this.getEffectiveSfxGain(0.08);

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440.00, now);
    osc.frequency.exponentialRampToValueAtTime(220.00, now + 0.3);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + 0.38);

    this.registerTransitionNodes(osc, filter, gain);
  }

  // Play cinematic interaction cues
  public playTransitionSwoosh() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.8);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.8);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.85);
  }

  public playArtifactChime(freq: number = 523.25) {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 1.5, now); // perfect fifth harmonic

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 2.3);
    osc2.stop(now + 2.3);
  }

  public playTelemetryBeep() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.setValueAtTime(2400, now + 0.04);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playClick() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(480, now);
    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }
}

export const soundManager = new SoundManager();

if (typeof window !== 'undefined') {
  (window as any).__AFTERLIGHT_SOUND__ = soundManager;
}

