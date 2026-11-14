import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Eye, EyeOff } from 'lucide-react';
import { CharacterPose } from '../../types';
import { useExperienceStore } from '../../store/useExperienceStore';
import { guideVoiceEngine, VoiceState } from '../../audio/GuideVoiceEngine';
import { parseScriptIntoPhrases, NarrationPhrase } from '../../utils/curatorNarrative';

interface CuratorPresenter2DProps {
  script: string;
  contextTitle?: string;
  isComponent?: boolean;
  onResetComponent?: () => void;
  showControls?: boolean;
}

const POSE_IMAGES: Record<CharacterPose, string> = {
  explaining: '/characters/mae-vance/explaining.png',
  thinking: '/characters/mae-vance/thinking.png',
  excited: '/characters/mae-vance/excited.png',
  pointing_up: '/characters/mae-vance/pointing_up.png',
  pointing_sideways: '/characters/mae-vance/pointing_sideways.png',
  concluding: '/characters/mae-vance/concluding.png',
  idle: '/characters/mae-vance/idle.png',
};

/**
 * AFTERLIGHT — Floating 2D Illustrated Curator Presenter & Animated Speech Bubble
 * Featuring Dr. Mae Vance, Senior Curator of Planetary Heritage.
 * 
 * Requirements:
 * - Fixed positioning at viewport bottom-right corner.
 * - 100% transparent PNG character illustrations with waist-up presentation.
 * - Pure white (#FFFFFF) speech bubble with black (#171717) text above & slightly left of Mae.
 * - Small triangular speech pointer directed towards Mae.
 * - Phrase-by-phrase sequential animation synchronized to audio/speech engine.
 * - Context-aware pose transitions (explaining, thinking, excited, pointing_up, pointing_sideways, concluding, idle).
 * - Compact separated narration playback controls.
 */
export const CuratorPresenter2D: React.FC<CuratorPresenter2DProps> = ({
  script,
  contextTitle,
  isComponent = false,
  onResetComponent,
  showControls = true,
}) => {
  const isAudioMuted = useExperienceStore((s) => s.isAudioMuted);
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);

  const [voiceState, setVoiceState] = useState<VoiceState>(guideVoiceEngine.getState());
  const [showCaptions, setShowCaptions] = useState(true);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Subscribe to real-time voice engine updates
  useEffect(() => {
    const unsubscribe = guideVoiceEngine.subscribe((next) => {
      setVoiceState(next);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Parse narrative script into discrete, readable storytelling phrases
  const phrases = useMemo(() => {
    return parseScriptIntoPhrases(script, isComponent);
  }, [script, isComponent]);

  // Synchronize active script with the voice engine
  useEffect(() => {
    if (!script) return;
    guideVoiceEngine.setMuted(isAudioMuted);

    const timer = setTimeout(() => {
      guideVoiceEngine.play(script, true);
    }, 400);

    return () => {
      clearTimeout(timer);
      guideVoiceEngine.stop(false);
    };
  }, [script, isAudioMuted]);

  // Identify active phrase based on voice engine character progress
  const activePhraseIndex = useMemo(() => {
    if (phrases.length === 0) return 0;
    if (voiceState.progress >= 0.99 || voiceState.hasEnded) {
      return phrases.length - 1;
    }

    const charIdx = voiceState.currentCharIndex;
    const foundIdx = phrases.findIndex(
      (p, i) => charIdx >= p.startChar && (i === phrases.length - 1 || charIdx < phrases[i + 1].startChar)
    );

    return foundIdx >= 0 ? foundIdx : 0;
  }, [phrases, voiceState.currentCharIndex, voiceState.progress, voiceState.hasEnded]);

  const activePhrase: NarrationPhrase | undefined = phrases[activePhraseIndex] || phrases[0];

  // Dynamic context-aware pose determination
  const currentPose: CharacterPose = useMemo(() => {
    if (!voiceState.isSpeaking || voiceState.isPaused) {
      return 'idle';
    }
    if (voiceState.hasEnded) {
      return 'concluding';
    }
    return activePhrase?.pose || 'explaining';
  }, [voiceState.isSpeaking, voiceState.isPaused, voiceState.hasEnded, activePhrase]);

  // Telemetry duration display (~135 wpm cadence)
  const timeDisplay = useMemo(() => {
    if (!script) return { current: '0:00', total: '0:00' };
    const wordCount = script.split(/\s+/).filter(Boolean).length;
    const totalSeconds = Math.max(18, Math.round((wordCount / 135) * 60));
    const elapsedSeconds = Math.min(
      totalSeconds,
      Math.round(voiceState.progress * totalSeconds)
    );

    const format = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return {
      current: format(elapsedSeconds),
      total: format(totalSeconds),
    };
  }, [script, voiceState.progress]);

  // Playback handlers
  const handleTogglePlayPause = () => {
    if (voiceState.isSpeaking && !voiceState.isPaused) {
      guideVoiceEngine.pause();
    } else if (voiceState.isPaused) {
      guideVoiceEngine.resume();
    } else {
      guideVoiceEngine.play(script, true);
    }
  };

  const handleReplay = () => {
    guideVoiceEngine.replay();
  };

  const handleToggleMute = () => {
    guideVoiceEngine.setMuted(!voiceState.isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    guideVoiceEngine.setVolume(parseFloat(e.target.value));
  };

  return (
    <div
      aria-label="AFTERLIGHT 2D Museum Curator Presenter"
      className="fixed bottom-0 right-2 sm:right-6 md:right-8 lg:right-10 z-50 flex flex-col items-end pointer-events-none select-none"
    >
      {/* 1. SEPARATE COMPACT PLAYBACK CONTROLS (Floating pill above speech bubble) */}
      {showControls && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="pointer-events-auto mb-2 mr-6 sm:mr-12 md:mr-20 bg-obsidian/90 backdrop-blur-md border border-meteorite/80 rounded-full px-3.5 py-1.5 flex items-center space-x-3 shadow-xl"
        >
          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={handleTogglePlayPause}
            title={voiceState.isSpeaking && !voiceState.isPaused ? 'Pause Narration' : 'Play Narration'}
            aria-label={voiceState.isSpeaking && !voiceState.isPaused ? 'Pause Narration' : 'Play Narration'}
            className="w-7 h-7 rounded-full border border-[#DEB275] flex items-center justify-center text-[#DEB275] hover:bg-white/10 transition-colors"
          >
            {voiceState.isSpeaking && !voiceState.isPaused ? (
              <Pause className="w-3 h-3 fill-current" />
            ) : (
              <Play className="w-3 h-3 fill-current ml-0.5" />
            )}
          </button>

          {/* Time Counter */}
          <span className="font-mono text-[11px] tracking-wider text-stone-secondary">
            {timeDisplay.current} / {timeDisplay.total}
          </span>

          {/* Scrubber Progress Bar */}
          <div
            className="w-20 sm:w-28 h-[3px] bg-[#22282C] rounded-full relative cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickPos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              guideVoiceEngine.seekProgress(clickPos);
            }}
          >
            <div
              className="h-full rounded-full bg-[#DEB275]"
              style={{ width: `${Math.round(voiceState.progress * 100)}%` }}
            />
          </div>

          {/* Captions Toggle */}
          <button
            type="button"
            onClick={() => setShowCaptions((v) => !v)}
            title={showCaptions ? 'Hide Speech Bubble' : 'Show Speech Bubble'}
            aria-label={showCaptions ? 'Hide Speech Bubble' : 'Show Speech Bubble'}
            className={`p-1 transition-colors ${
              showCaptions ? 'text-[#DEB275]' : 'text-stone-muted hover:text-bone'
            }`}
          >
            {showCaptions ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          {/* Volume Control */}
          <div
            className="relative flex items-center"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <button
              type="button"
              onClick={handleToggleMute}
              title={voiceState.isMuted ? 'Unmute' : 'Mute'}
              className="p-1 text-stone-secondary hover:text-bone transition-colors"
            >
              {voiceState.isMuted || voiceState.volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-stone-muted" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>

            {showVolumeSlider && (
              <div className="absolute bottom-full right-0 mb-2 p-2 bg-obsidian border border-meteorite rounded-lg shadow-xl z-50">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={voiceState.isMuted ? 0 : voiceState.volume}
                  onChange={handleVolumeChange}
                  className="w-16 accent-[#DEB275] cursor-pointer"
                  aria-label="Curator Volume Slider"
                />
              </div>
            )}
          </div>

          {/* Replay */}
          <button
            type="button"
            onClick={handleReplay}
            title="Replay from beginning"
            className="p-1 text-stone-secondary hover:text-bone transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </motion.div>
      )}

      {/* 2. SIGNATURE WHITE SPEECH BUBBLE WITH BLACK TEXT (Above & slightly left of Mae) */}
      <AnimatePresence>
        {showCaptions && activePhrase && (
          <motion.div
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative pointer-events-auto mb-2 sm:mb-3 mr-2 sm:mr-10 md:mr-16 lg:mr-20 max-w-[290px] sm:max-w-[340px] md:max-w-[400px] lg:max-w-[440px]"
          >
            {/* Pure White Bubble Container */}
            <div className="relative bg-[#FFFFFF] text-[#171717] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_16px_48px_rgba(0,0,0,0.36)] border border-black/5">
              {/* Header context inside speech bubble */}
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-black/10">
                <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.2em] uppercase font-bold text-black/70 flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal animate-pulse" />
                  <span>DR. MAE VANCE</span>
                  {contextTitle && (
                    <>
                      <span className="text-black/30">·</span>
                      <span className="truncate max-w-[140px] text-black/50">{contextTitle}</span>
                    </>
                  )}
                </span>

                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[9px] tracking-wider text-black/40">
                    {activePhraseIndex + 1}/{phrases.length}
                  </span>
                  {isComponent && onResetComponent && (
                    <button
                      type="button"
                      onClick={onResetComponent}
                      className="text-[9px] font-mono tracking-wider uppercase text-signal hover:underline"
                    >
                      OVERVIEW
                    </button>
                  )}
                </div>
              </div>

              {/* Animated Spoken Phrase */}
              <div className="min-h-[46px] sm:min-h-[54px] flex items-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={activePhrase.id}
                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="font-sans text-sm sm:text-base md:text-[16px] font-normal leading-relaxed text-[#171717]"
                  >
                    "{activePhrase.text}"
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Small Triangular Speech Pointer Directed Towards Mae */}
              <div
                className="absolute -bottom-2 right-8 sm:right-14 w-4 h-4 bg-[#FFFFFF] rotate-45 border-r border-b border-black/10 shadow-[2px_2px_4px_rgba(0,0,0,0.06)]"
                aria-hidden="true"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. FLOATING 2D ILLUSTRATED CHARACTER PRESENTER (Waist-Up, Transparent Background) */}
      <div className="relative w-[210px] sm:w-[280px] md:w-[350px] lg:w-[410px] xl:w-[460px] aspect-[1672/940]">
        <AnimatePresence mode="sync">
          <motion.img
            key={currentPose}
            src={POSE_IMAGES[currentPose] || POSE_IMAGES.explaining}
            alt={`Dr. Mae Vance - ${currentPose}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="absolute bottom-0 right-0 w-full h-full object-contain object-bottom select-none pointer-events-none drop-shadow-[0_16px_36px_rgba(0,0,0,0.55)]"
          />
        </AnimatePresence>
      </div>
    </div>
  );
};
