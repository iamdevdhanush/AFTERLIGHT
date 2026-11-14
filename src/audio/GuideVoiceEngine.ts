/**
 * AFTERLIGHT — Museum Curator Voice & Speech Synthesis Engine
 * 
 * Provides warm, mature, documentary-style female voice narration with:
 * - Reliable female English voice selection (preferring high-quality Edge/Chrome natural voices)
 * - Strict male voice exclusion (never falls back to a male voice)
 * - Transparent fallback when no female voice is available in the environment
 * - Phrase-by-phrase sequential utterance queue with natural breath pauses
 * - 1:1 real speech event synchronization for speech bubbles and character poses
 * - Viseme mouth modulation synchronized to spoken words
 */

import { soundManager } from './SoundManager';
import { parseScriptIntoPhrases, NarrationPhrase } from '../utils/curatorNarrative';
import { CharacterPose } from '../types';

export interface VoiceState {
  isSpeaking: boolean;
  isPaused: boolean;
  isMuted: boolean;
  volume: number;
  progress: number; // 0.0 to 1.0
  currentPhraseIndex: number;
  totalPhrases: number;
  currentPhraseText: string;
  currentPose: CharacterPose;
  selectedVoiceName: string;
  isFemaleVoiceActive: boolean;
  visemeSignal: number; // 0.0 to 1.0 real-time mouth opening
  hasEnded: boolean;
  currentScript: string;
  currentCharIndex: number;
  currentWord: string;
}

type VoiceListener = (state: VoiceState) => void;

// Strict male name blacklist — these voices are NEVER selected
const MALE_VOICE_BLACKLIST = [
  'christopher',
  'guy',
  'david',
  'mark',
  'daniel',
  'brian',
  'andrew',
  'eric',
  'roger',
  'steffan',
  'ryan',
  'thomas',
  'liam',
  'william',
  'connor',
  'prabhat',
  'male',
  'george',
  'alex',
  'fred',
  'oliver',
  'rishi',
  'james',
  'wayne',
  'elimu',
  'sardor',
  'ahmet',
  'ostap',
  'salman',
  'asad',
  'jean',
  'paul',
  'cosimo',
  'claude',
];

// Ranked list of preferred high-quality natural female voices
const PREFERRED_FEMALE_VOICES = [
  // Tier 1: Microsoft Natural Online voices (Edge / Windows 10/11)
  'Microsoft Jenny Online (Natural) - English (United States)',
  'Microsoft Aria Online (Natural) - English (United States)',
  'Microsoft Sonia Online (Natural) - English (United Kingdom)',
  'Microsoft Libby Online (Natural) - English (United Kingdom)',
  'Microsoft Natasha Online (Natural) - English (Australia)',
  'Microsoft Clara Online (Natural) - English (Canada)',
  'Microsoft Michelle Online (Natural) - English (United States)',
  'Microsoft Ava Online (Natural) - English (United States)',
  'Microsoft Emma Online (Natural) - English (United States)',
  'Microsoft Neerja Online (Natural) - English (India)',

  // Tier 2: Google & Apple High-Quality Natural Voices
  'Google UK English Female',
  'Google US English',
  'Samantha',
  'Karen',
  'Serena',
  'Moira',
  'Victoria',
  'Fiona',
  'Tessa',

  // Tier 3: Installed Windows SAPI Desktop Female Voices
  'Microsoft Zira Desktop - English (United States)',
  'Microsoft Zira',
  'Microsoft Hazel Desktop - English (Great Britain)',
  'Microsoft Hazel',
  'Microsoft Susan',
  'Microsoft Catherine',
];

// Patterns identifying female voices
const FEMALE_NAME_PATTERNS = [
  'jenny',
  'aria',
  'sonia',
  'libby',
  'natasha',
  'clara',
  'michelle',
  'ava',
  'emma',
  'samantha',
  'karen',
  'serena',
  'moira',
  'victoria',
  'fiona',
  'tessa',
  'zira',
  'hazel',
  'susan',
  'catherine',
  'female',
  'woman',
  'girl',
  'neerja',
  'luna',
  'stephanie',
  'amanda',
];

class GuideVoiceEngine {
  private static getPersistedVolume(): number {
    if (typeof window === 'undefined') return 1.0;
    try {
      const saved = localStorage.getItem('afterlight_narration_volume');
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) return parsed;
      }
    } catch {}
    return 1.0; // Default to 100% full scale for clear documentary audibility
  }

  private state: VoiceState = {
    isSpeaking: false,
    isPaused: false,
    isMuted: false,
    volume: GuideVoiceEngine.getPersistedVolume(),
    progress: 0,
    currentPhraseIndex: 0,
    totalPhrases: 1,
    currentPhraseText: '',
    currentPose: 'idle',
    selectedVoiceName: 'Detecting...',
    isFemaleVoiceActive: false,
    visemeSignal: 0,
    hasEnded: false,
    currentScript: '',
    currentCharIndex: 0,
    currentWord: '',
  };

  private listeners = new Set<VoiceListener>();
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  // Queue of storytelling phrases for the active script
  private phraseQueue: NarrationPhrase[] = [];
  private activePhraseIdx: number = 0;
  private nextPhraseTimerId: number | null = null;

  // Viseme mouth animation frame
  private animFrameId: number | null = null;
  private lastBoundaryTime: number = 0;

  // Simulation mode fallback
  private isSimulating: boolean = false;
  private simulationTimerId: number | null = null;
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

  /**
   * Discovers and selects the best available natural female English voice.
   * Guarantees that male voices are never selected.
   */
  public initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.state.selectedVoiceName = 'SpeechSynthesis Not Supported';
      this.state.isFemaleVoiceActive = false;
      this.notify();
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return;

    const femaleVoice = this.findBestFemaleVoice(voices);

    if (femaleVoice) {
      this.selectedVoice = femaleVoice;
      this.state.selectedVoiceName = femaleVoice.name;
      this.state.isFemaleVoiceActive = true;
    } else {
      // Transparency: if no female voice exists, NEVER pick a male voice
      this.selectedVoice = null;
      this.state.selectedVoiceName = 'Ambient Acoustic Simulation (No Female Voice Available)';
      this.state.isFemaleVoiceActive = false;
      console.warn(
        '[AFTERLIGHT GuideVoiceEngine] No verified female English voice detected. To preserve Dr. Mae Vance\'s curatorial identity, narration will run in ambient simulated mode rather than using a male voice.'
      );
    }

    this.notify();
  }

  /**
   * Helper that evaluates available voices against female quality criteria and male exclusions.
   */
  private findBestFemaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    const isMale = (v: SpeechSynthesisVoice) => {
      const name = v.name.toLowerCase();
      return MALE_VOICE_BLACKLIST.some((m) => name.includes(m));
    };

    const isEnglish = (v: SpeechSynthesisVoice) => {
      return v.lang.toLowerCase().startsWith('en');
    };

    // Filter to English voices that are NOT on the male blacklist
    const nonMaleEnglish = voices.filter((v) => isEnglish(v) && !isMale(v));

    // 1. Check against prioritized preferred female voice names
    for (const pref of PREFERRED_FEMALE_VOICES) {
      const match = nonMaleEnglish.find((v) =>
        v.name.toLowerCase().includes(pref.toLowerCase())
      );
      if (match) return match;
    }

    // 2. Check for any natural/neural English voice matching female name patterns
    const naturalFemale = nonMaleEnglish.find((v) => {
      const name = v.name.toLowerCase();
      const isNatural = name.includes('natural') || name.includes('neural') || name.includes('online');
      const matchesFemalePattern = FEMALE_NAME_PATTERNS.some((p) => name.includes(p));
      return isNatural && matchesFemalePattern;
    });
    if (naturalFemale) return naturalFemale;

    // 3. Check for any English voice matching female name patterns
    const anyFemalePattern = nonMaleEnglish.find((v) => {
      const name = v.name.toLowerCase();
      return FEMALE_NAME_PATTERNS.some((p) => name.includes(p));
    });
    if (anyFemalePattern) return anyFemalePattern;

    // 4. Check for any English voice containing 'female' in name
    const explicitFemale = nonMaleEnglish.find((v) => v.name.toLowerCase().includes('female'));
    if (explicitFemale) return explicitFemale;

    // Do NOT fall back to any voice — returning null ensures a male voice is never chosen
    return null;
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

  /**
   * Primary playback entry point.
   * Splits script into documentary phrases and executes sequential playback.
   */
  public play(script: string, autoStartBeep: boolean = true) {
    if (!script || !script.trim()) return;

    this.stop(false);

    // Refresh voice list in case it loaded lazily
    if (!this.selectedVoice) {
      this.initVoices();
    }

    const phrases = parseScriptIntoPhrases(script);
    if (phrases.length === 0) return;

    this.phraseQueue = phrases;
    this.activePhraseIdx = 0;

    this.state.currentScript = script;
    this.state.totalPhrases = phrases.length;
    this.state.currentPhraseIndex = 0;
    this.state.currentPhraseText = phrases[0].text;
    this.state.currentPose = phrases[0].pose;
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

    if (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      this.selectedVoice
    ) {
      this.speakActivePhrase();
    } else {
      // Run in simulated narration mode if SpeechSynthesis is unavailable or no female voice exists
      this.startSimulationForActivePhrase();
    }

    this.startVisemeLoop();
    this.notify();
  }

  /**
   * Speaks the current phrase in the queue using SpeechSynthesisUtterance.
   */
  private speakActivePhrase() {
    if (this.activePhraseIdx >= this.phraseQueue.length) {
      this.finishNarration();
      return;
    }

    const phrase = this.phraseQueue[this.activePhraseIdx];
    this.state.currentPhraseIndex = this.activePhraseIdx;
    this.state.currentPhraseText = phrase.text;
    this.state.currentPose = phrase.pose;
    this.state.currentCharIndex = phrase.startChar;
    this.state.progress = this.activePhraseIdx / Math.max(1, this.phraseQueue.length);

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(phrase.text);
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }

      // Calm, warm, articulate documentary storytelling delivery
      utterance.rate = 0.92;
      utterance.pitch = 1.0;
      utterance.volume = this.state.isMuted ? 0 : this.state.volume;

      utterance.onstart = () => {
        if (!this.state.isSpeaking) return;
        this.state.isPaused = false;
        soundManager.duckForNarration(true);
        this.lastBoundaryTime = performance.now();
        this.notify();
      };

      utterance.onboundary = (event) => {
        if (!this.state.isSpeaking) return;
        this.lastBoundaryTime = performance.now();
        const charIdx = event.charIndex;
        this.state.currentCharIndex = phrase.startChar + charIdx;

        // Calculate fine-grained progress across total phrases
        const phraseFrac = Math.min(0.99, charIdx / Math.max(1, phrase.text.length));
        this.state.progress = Math.min(
          0.99,
          (this.activePhraseIdx + phraseFrac) / Math.max(1, this.phraseQueue.length)
        );

        // Spoken word tracking
        const remainder = phrase.text.slice(charIdx);
        const match = remainder.match(/^[\w’']+/);
        if (match) {
          this.state.currentWord = match[0];
        }

        // Syllable impulse for mouth opening
        this.state.visemeSignal = 0.72 + Math.random() * 0.28;
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
        if (!this.state.isSpeaking) return;

        // Phrase completed — reset mouth signal
        this.state.visemeSignal = 0;
        this.notify();

        // Advance to next phrase after a natural documentary breath pause
        const pauseDuration = phrase.pauseAfterMs || 340;
        this.activePhraseIdx++;

        if (this.activePhraseIdx < this.phraseQueue.length) {
          this.nextPhraseTimerId = window.setTimeout(() => {
            if (this.state.isSpeaking && !this.state.isPaused) {
              this.speakActivePhrase();
            }
          }, pauseDuration);
        } else {
          this.finishNarration();
        }
      };

      utterance.onerror = (e) => {
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          // If browser speech was blocked or encountered an issue, fallback to simulation
          this.startSimulationForActivePhrase();
        } else {
          this.state.visemeSignal = 0;
          this.notify();
        }
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch {
      this.startSimulationForActivePhrase();
    }

    this.notify();
  }

  /**
   * Simulation fallback when SpeechSynthesis is unavailable or no female voice is present.
   */
  private startSimulationForActivePhrase() {
    if (this.activePhraseIdx >= this.phraseQueue.length) {
      this.finishNarration();
      return;
    }

    const phrase = this.phraseQueue[this.activePhraseIdx];
    this.isSimulating = true;
    soundManager.duckForNarration(true);
    this.state.currentPhraseIndex = this.activePhraseIdx;
    this.state.currentPhraseText = phrase.text;
    this.state.currentPose = phrase.pose;
    this.state.currentCharIndex = phrase.startChar;

    const words = phrase.text.split(/\s+/).filter(Boolean);
    // ~135 words per minute cadence
    this.simDurationMs = Math.max(1200, (words.length / 135) * 60 * 1000);
    this.simStartTime = performance.now();

    const step = () => {
      if (!this.state.isSpeaking || this.state.isPaused) return;

      const elapsed = performance.now() - this.simStartTime;
      const t = Math.min(1.0, elapsed / this.simDurationMs);

      const phraseFrac = t;
      this.state.progress = Math.min(
        0.99,
        (this.activePhraseIdx + phraseFrac) / Math.max(1, this.phraseQueue.length)
      );

      // Syllable oscillation for mouth animation
      const syllable = Math.sin(elapsed * 0.018);
      this.state.visemeSignal = Math.max(0, syllable * 0.82);

      this.notify();

      if (t >= 1.0) {
        this.state.visemeSignal = 0;
        this.notify();

        this.activePhraseIdx++;
        if (this.activePhraseIdx < this.phraseQueue.length) {
          const pause = phrase.pauseAfterMs || 340;
          this.nextPhraseTimerId = window.setTimeout(() => {
            if (this.state.isSpeaking && !this.state.isPaused) {
              this.startSimulationForActivePhrase();
            }
          }, pause);
        } else {
          this.finishNarration();
        }
      } else {
        this.simulationTimerId = window.setTimeout(step, 60);
      }
    };

    step();
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
        const timeSinceWord = performance.now() - this.lastBoundaryTime;
        if (timeSinceWord > 260) {
          this.state.visemeSignal = Math.max(0, this.state.visemeSignal - 0.08);
        } else {
          const bounce = Math.sin(timeSinceWord * 0.032) * 0.22;
          this.state.visemeSignal = Math.max(0, Math.min(1.0, this.state.visemeSignal + bounce));
        }
      }

      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  private finishNarration() {
    soundManager.duckForNarration(false);
    this.state.isSpeaking = false;
    this.state.isPaused = false;
    this.state.progress = 1.0;
    this.state.visemeSignal = 0;
    this.state.hasEnded = true;
    this.state.currentPose = 'concluding';
    this.isSimulating = false;

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.simulationTimerId) {
      clearTimeout(this.simulationTimerId);
      this.simulationTimerId = null;
    }
    if (this.nextPhraseTimerId) {
      clearTimeout(this.nextPhraseTimerId);
      this.nextPhraseTimerId = null;
    }

    this.notify();
  }

  public pause() {
    if (!this.state.isSpeaking || this.state.isPaused) return;
    this.state.isPaused = true;
    this.state.visemeSignal = 0;
    soundManager.duckForNarration(false);

    if (this.nextPhraseTimerId) {
      clearTimeout(this.nextPhraseTimerId);
      this.nextPhraseTimerId = null;
    }

    if (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      !this.isSimulating
    ) {
      window.speechSynthesis.pause();
    }
    this.notify();
  }

  public resume() {
    if (!this.state.isSpeaking || !this.state.isPaused) return;
    this.state.isPaused = false;
    this.lastBoundaryTime = performance.now();
    soundManager.duckForNarration(true);

    if (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      !this.isSimulating
    ) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else {
        // Resume by speaking the active phrase if interrupted
        this.speakActivePhrase();
      }
    } else if (this.isSimulating) {
      this.startSimulationForActivePhrase();
    }
    this.notify();
  }

  public replay() {
    if (!this.state.currentScript) return;
    this.play(this.state.currentScript, true);
  }

  public stop(notify: boolean = true) {
    soundManager.duckForNarration(false);
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.simulationTimerId) {
      clearTimeout(this.simulationTimerId);
      this.simulationTimerId = null;
    }
    if (this.nextPhraseTimerId) {
      clearTimeout(this.nextPhraseTimerId);
      this.nextPhraseTimerId = null;
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
    this.activePhraseIdx = 0;

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
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('afterlight_narration_volume', String(clamped));
      }
    } catch {}
    if (this.currentUtterance && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.currentUtterance.volume = this.state.isMuted ? 0 : clamped;
    }
    this.notify();
  }

  public seekProgress(progress: number) {
    if (this.phraseQueue.length === 0) return;
    const clamped = Math.max(0, Math.min(1, progress));
    const targetIdx = Math.min(
      this.phraseQueue.length - 1,
      Math.floor(clamped * this.phraseQueue.length)
    );
    this.activePhraseIdx = targetIdx;
    if (this.state.isSpeaking && !this.state.isPaused) {
      if (this.selectedVoice && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        this.speakActivePhrase();
      } else {
        this.startSimulationForActivePhrase();
      }
    } else {
      const phrase = this.phraseQueue[targetIdx];
      this.state.currentPhraseIndex = targetIdx;
      this.state.currentPhraseText = phrase.text;
      this.state.currentPose = phrase.pose;
      this.state.progress = clamped;
      this.notify();
    }
  }
}

export const guideVoiceEngine = new GuideVoiceEngine();

if (typeof window !== 'undefined') {
  (window as unknown as { __GUIDE_VOICE_ENGINE__?: GuideVoiceEngine }).__GUIDE_VOICE_ENGINE__ = guideVoiceEngine;
}
