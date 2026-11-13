/**
 * AFTERLIGHT — Interactive Museum Guide Voice & Speech Synthesis Engine
 * Provides voice narration with real-time speech boundary tracking,
 * viseme mouth modulation, audio progress, and browser speech synthesis.
 */

import { soundManager } from './SoundManager';

export interface VoiceState {
  isSpeaking: boolean;
  isPaused: boolean;
  isMuted: boolean;
  volume: number;
  progress: number; // 0.0 to 1.0
  currentCharIndex: number;
  currentWord: string;
  currentScript: string;
  visemeSignal: number; // 0.0 to 1.0 real-time mouth opening
  hasEnded: boolean;
}

type VoiceListener = (state: VoiceState) => void;

class GuideVoiceEngine {
  private state: VoiceState = {
    isSpeaking: false,
    isPaused: false,
    isMuted: false,
    volume: 0.85,
    progress: 0,
    currentCharIndex: 0,
    currentWord: '',
    currentScript: '',
    visemeSignal: 0,
    hasEnded: false,
  };

  private listeners = new Set<VoiceListener>();
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private animFrameId: number | null = null;
  private simulationTimerId: number | null = null;
  private lastBoundaryTime: number = 0;
  private isSimulating: boolean = false;
  private simStartTime: number = 0;
  private simDurationMs: number = 0;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return;

    // Prefer high-quality, natural/online English voices for warm documentary narration
    const preferredVoices = [
      'Microsoft Christopher Online (Natural) - English (United States)',
      'Microsoft Jenny Online (Natural) - English (United States)',
      'Microsoft Guy Online (Natural) - English (United States)',
      'Google US English',
      'Samantha',
      'Daniel',
      'Microsoft David',
      'Microsoft Mark',
      'Microsoft Zira',
    ];

    let found: SpeechSynthesisVoice | undefined;

    for (const name of preferredVoices) {
      found = voices.find((v) => v.name.toLowerCase().includes(name.toLowerCase()));
      if (found) break;
    }

    if (!found) {
      // Find any natural / neural English voice
      found = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Online'))
      );
    }

    if (!found) {
      // Fallback to any English voice
      found = voices.find((v) => v.lang.startsWith('en-US')) || voices.find((v) => v.lang.startsWith('en'));
    }

    this.selectedVoice = found || voices[0] || null;
  }

  public subscribe(listener: VoiceListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const copy = { ...this.state };
    this.listeners.forEach((l) => l(copy));
  }

  public getState(): VoiceState {
    return { ...this.state };
  }

  public getVisemeSignal(): number {
    return this.state.visemeSignal;
  }

  public play(script: string, autoStartBeep: boolean = true) {
    if (!script) return;
    this.stop(false);

    this.state.currentScript = script;
    this.state.currentCharIndex = 0;
    this.state.currentWord = '';
    this.state.progress = 0;
    this.state.isSpeaking = true;
    this.state.isPaused = false;
    this.state.hasEnded = false;
    this.lastBoundaryTime = performance.now();

    if (autoStartBeep && !this.state.isMuted) {
      soundManager.playTelemetryBeep();
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(script);
        if (this.selectedVoice) {
          utterance.voice = this.selectedVoice;
        }

        utterance.rate = 0.94; // Calm, clear museum documentary cadence
        utterance.pitch = 0.98; // Warm, natural vocal pitch
        utterance.volume = this.state.isMuted ? 0 : this.state.volume;

        utterance.onstart = () => {
          this.state.isSpeaking = true;
          this.state.isPaused = false;
          this.startVisemeLoop();
          this.notify();
        };

        utterance.onboundary = (event) => {
          if (!this.state.isSpeaking) return;
          this.lastBoundaryTime = performance.now();
          const charIdx = event.charIndex;
          this.state.currentCharIndex = charIdx;
          this.state.progress = Math.min(0.99, charIdx / Math.max(1, script.length));

          // Extract current spoken word
          const remainder = script.slice(charIdx);
          const match = remainder.match(/^[\w’']+/);
          if (match) {
            this.state.currentWord = match[0];
          }

          // Trigger real-time mouth opening pulse on word boundaries
          this.state.visemeSignal = 0.75 + Math.random() * 0.25;
          this.notify();
        };

        utterance.onpause = () => {
          this.state.isPaused = true;
          this.state.visemeSignal = 0;
          this.notify();
        };

        utterance.onresume = () => {
          this.state.isPaused = false;
          this.lastBoundaryTime = performance.now();
          this.notify();
        };

        utterance.onend = () => {
          this.finishNarration();
        };

        utterance.onerror = (e) => {
          // If browser speech was cancelled or failed, handle cleanly
          if (e.error !== 'canceled' && e.error !== 'interrupted') {
            this.startSimulationFallback(script);
          } else {
            this.state.isSpeaking = false;
            this.state.visemeSignal = 0;
            this.notify();
          }
        };

        this.currentUtterance = utterance;
        window.speechSynthesis.speak(utterance);
        this.startVisemeLoop();
        this.notify();
        return;
      } catch {
        // Fallback to simulation if speech synthesis failed
      }
    }

    // Fallback if browser SpeechSynthesis is unavailable
    this.startSimulationFallback(script);
  }

  private startSimulationFallback(script: string) {
    this.isSimulating = true;
    this.simStartTime = performance.now();
    // Human narration speed: ~135 words per minute
    const wordCount = script.split(/\s+/).length;
    this.simDurationMs = (wordCount / 135) * 60 * 1000;

    const words = script.split(/(\s+)/);
    let cumulative = 0;
    const wordPositions = words.map((w) => {
      const pos = cumulative;
      cumulative += w.length;
      return { word: w, pos };
    });

    const stepSimulation = () => {
      if (!this.state.isSpeaking || this.state.isPaused) return;

      const elapsed = performance.now() - this.simStartTime;
      const t = Math.min(1.0, elapsed / Math.max(1000, this.simDurationMs));
      this.state.progress = t;

      const targetChar = Math.floor(t * script.length);
      this.state.currentCharIndex = targetChar;

      const currentWordItem = wordPositions.find(
        (wp, i) =>
          wp.pos <= targetChar &&
          (i === wordPositions.length - 1 || wordPositions[i + 1].pos > targetChar)
      );

      if (currentWordItem && currentWordItem.word.trim()) {
        this.state.currentWord = currentWordItem.word.trim();
        // Syllable oscillation for simulated mouth movement
        const syllable = Math.sin(elapsed * 0.016);
        this.state.visemeSignal = Math.max(0, syllable * 0.85);
      } else {
        this.state.visemeSignal = 0;
      }

      this.notify();

      if (t >= 1.0) {
        this.finishNarration();
      } else {
        this.simulationTimerId = window.setTimeout(stepSimulation, 80);
      }
    };

    stepSimulation();
    this.startVisemeLoop();
    this.notify();
  }

  private startVisemeLoop() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

    const tick = () => {
      if (!this.state.isSpeaking) {
        this.state.visemeSignal = 0;
        return;
      }

      if (this.state.isPaused) {
        this.state.visemeSignal = 0;
      } else if (!this.isSimulating) {
        // Decay viseme mouth signal naturally between words
        const timeSinceWord = performance.now() - this.lastBoundaryTime;
        if (timeSinceWord > 280) {
          this.state.visemeSignal = Math.max(0, this.state.visemeSignal - 0.08);
        } else {
          // Micro-syllable bounce while word is active
          const bounce = Math.sin(timeSinceWord * 0.035) * 0.25;
          this.state.visemeSignal = Math.max(0, Math.min(1.0, this.state.visemeSignal + bounce));
        }
      }

      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  private finishNarration() {
    this.state.isSpeaking = false;
    this.state.isPaused = false;
    this.state.progress = 1.0;
    this.state.visemeSignal = 0;
    this.state.hasEnded = true;
    this.isSimulating = false;

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.simulationTimerId) {
      clearTimeout(this.simulationTimerId);
      this.simulationTimerId = null;
    }

    this.notify();
  }

  public pause() {
    if (!this.state.isSpeaking || this.state.isPaused) return;
    this.state.isPaused = true;
    this.state.visemeSignal = 0;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window && !this.isSimulating) {
      window.speechSynthesis.pause();
    }
    this.notify();
  }

  public resume() {
    if (!this.state.isSpeaking || !this.state.isPaused) return;
    this.state.isPaused = false;
    this.lastBoundaryTime = performance.now();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window && !this.isSimulating) {
      window.speechSynthesis.resume();
    } else if (this.isSimulating) {
      this.simStartTime = performance.now() - this.state.progress * this.simDurationMs;
    }
    this.notify();
  }

  public replay() {
    if (!this.state.currentScript) return;
    this.play(this.state.currentScript, true);
  }

  public stop(notify: boolean = true) {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.simulationTimerId) {
      clearTimeout(this.simulationTimerId);
      this.simulationTimerId = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    this.currentUtterance = null;
    this.isSimulating = false;
    this.state.isSpeaking = false;
    this.state.isPaused = false;
    this.state.progress = 0;
    this.state.visemeSignal = 0;
    this.state.currentWord = '';
    this.state.currentCharIndex = 0;

    if (notify) this.notify();
  }

  public setMuted(muted: boolean) {
    this.state.isMuted = muted;
    if (this.currentUtterance && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.currentUtterance.volume = muted ? 0 : this.state.volume;
    }
    this.notify();
  }

  public setVolume(volume: number) {
    const clamped = Math.max(0, Math.min(1, volume));
    this.state.volume = clamped;
    if (this.currentUtterance && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.currentUtterance.volume = this.state.isMuted ? 0 : clamped;
    }
    this.notify();
  }

  public seekProgress(progress: number) {
    const clamped = Math.max(0, Math.min(1, progress));
    this.state.progress = clamped;
    if (this.state.currentScript) {
      this.state.currentCharIndex = Math.floor(clamped * this.state.currentScript.length);
    }
    this.notify();
  }
}

export const guideVoiceEngine = new GuideVoiceEngine();

