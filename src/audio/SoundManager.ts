/**
 * AFTERLIGHT — Cinematic Audio Synthesizer Engine
 * Uses Web Audio API to synthesize photorealistic planetary ambient soundscapes,
 * atmospheric winds, telemetry pulses, and cinematic tonal cues without external audio files.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private currentAmbienceType: string | null = null;
  private ambienceNodes: {
    sources: (AudioNode | OscillatorNode | AudioBufferSourceNode)[];
    gain: GainNode;
  } | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      const targetGain = muted ? 0 : 0.4;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.2);
    }
  }

  public setVolume(vol: number) {
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime, 0.1);
    }
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
    ambienceGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    ambienceGain.gain.exponentialRampToValueAtTime(0.35, this.ctx.currentTime + 3.0);
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

