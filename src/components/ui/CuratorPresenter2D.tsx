import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Eye, EyeOff } from 'lucide-react';
import { CharacterPose } from '../../types';
import { useExperienceStore } from '../../store/useExperienceStore';
import { guideVoiceEngine, VoiceState } from '../../audio/GuideVoiceEngine';
import { parseScriptIntoPhrases } from '../../utils/curatorNarrative';

export interface CuratorPresenter2DProps {
  script: string;
  contextTitle?: string;
  isComponent?: boolean;
  onResetComponent?: () => void;
  showControls?: boolean;
  showCaptions?: boolean;
  variant?: 'panel' | 'overlay';
  className?: string;
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
 * AFTERLIGHT — 2D Illustrated Curator Presenter & Animated Speech Bubble
 * Featuring Dr. Mae Vance, Senior Curator of Planetary Heritage.
 * 
 * Supports two distinct presentation modes:
 * - 'panel' (default for Artifact Details): Cleanly integrated inside the curatorial
 *   column layout flow without obscuring navigation buttons or viewport content.
 * - 'overlay' (for Documentary Chapters): Positioned in fullscreen cinematic mode
 *   with strict vertical clearance above bottom controls and the Next Chapter CTA.
 */
export const CuratorPresenter2D: React.FC<CuratorPresenter2DProps> = ({
  script,
  contextTitle,
  isComponent = false,
  onResetComponent,
  showControls = true,
  showCaptions: controlledShowCaptions,
  variant = 'panel',
  className = '',
}) => {
  const isAudioMuted = useExperienceStore((s) => s.isAudioMuted);
  const setNarrationVolume = useExperienceStore((s) => s.setNarrationVolume);
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);

  const [voiceState, setVoiceState] = useState<VoiceState>(guideVoiceEngine.getState());
  const [internalCaptions, setInternalCaptions] = useState(true);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const showCaptions = controlledShowCaptions !== undefined ? controlledShowCaptions : internalCaptions;

  // Subscribe to real-time voice engine updates
  useEffect(() => {
    const unsubscribe = guideVoiceEngine.subscribe((next) => {
      setVoiceState(next);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Pre-parse narrative script to determine initial state before playback
  const staticPhrases = useMemo(() => {
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

  // Real-time phrase text and indices driven directly by actual speech events
  const displayedPhraseText = useMemo(() => {
    if (voiceState.currentPhraseText && voiceState.currentPhraseText.trim()) {
      return voiceState.currentPhraseText;
    }
    return staticPhrases[0]?.text || '';
  }, [voiceState.currentPhraseText, staticPhrases]);

  const activePhraseNum = Math.min(
    Math.max(1, voiceState.currentPhraseIndex + 1),
    Math.max(1, voiceState.totalPhrases || staticPhrases.length)
  );

  const totalPhrasesCount = Math.max(1, voiceState.totalPhrases || staticPhrases.length);

  // Dynamic context-aware pose determination directly from voice engine
  const currentPose: CharacterPose = useMemo(() => {
    if (!voiceState.isSpeaking || voiceState.isPaused) {
      return 'idle';
    }
    if (voiceState.hasEnded) {
      return 'concluding';
    }
    return voiceState.currentPose || 'explaining';
  }, [voiceState.isSpeaking, voiceState.isPaused, voiceState.hasEnded, voiceState.currentPose]);

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
    const val = parseFloat(e.target.value);
    setNarrationVolume(val);
  };

  // =========================================================================
  // SHARED SPEECH BUBBLE COMPONENT
  // Signature pure white container, black typography, animated phrase & tail
  // =========================================================================
  const renderSpeechBubble = (isOverlayMode: boolean) => {
    if (!showCaptions || !displayedPhraseText) return null;

    return (
      <motion.div
        key="speech-bubble"
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={`relative pointer-events-auto z-10 w-full ${
          isOverlayMode
            ? 'mb-2 sm:mb-3 max-w-[280px] sm:max-w-[340px] md:max-w-[400px] lg:max-w-[440px]'
            : 'mb-3 max-w-[440px]'
        }`}
      >
        <div className="relative bg-[#FFFFFF] text-[#171717] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[0_16px_40px_rgba(0,0,0,0.35)] border border-black/5">
          {/* Header context inside speech bubble */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/10">
            <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.2em] uppercase font-bold text-black/70 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-signal animate-pulse" />
              <span>DR. MAE VANCE</span>
              {contextTitle && (
                <>
                  <span className="text-black/30">·</span>
                  <span className="truncate max-w-[130px] sm:max-w-[180px] text-black/50">
                    {contextTitle}
                  </span>
                </>
              )}
            </span>

            <div className="flex items-center space-x-2">
              <span className="font-mono text-[9px] tracking-wider text-black/40">
                {activePhraseNum}/{totalPhrasesCount}
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

          {/* Spoken Phrase Content - Stable min-height prevents layout shifts */}
          <div className="min-h-[48px] sm:min-h-[56px] flex items-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={`${voiceState.currentPhraseIndex}-${displayedPhraseText}`}
                initial={{ opacity: 0, y: 3, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -3, scale: 0.99 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="font-sans text-xs sm:text-sm md:text-[15px] font-normal leading-relaxed text-[#171717]"
              >
                "{displayedPhraseText}"
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Triangular Tail pointing accurately toward Dr. Mae Vance */}
          <div
            className={`absolute -bottom-2 w-4 h-4 bg-[#FFFFFF] rotate-45 border-r border-b border-black/10 shadow-[2px_2px_4px_rgba(0,0,0,0.06)] ${
              isOverlayMode
                ? 'right-16 sm:right-24 md:right-32'
                : 'left-1/2 -translate-x-1/2'
            }`}
            aria-hidden="true"
          />
        </div>
      </motion.div>
    );
  };

  // =========================================================================
  // SHARED PLAYBACK CONTROLS
  // =========================================================================
  const renderControls = () => {
    if (!showControls) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="pointer-events-auto mb-2 bg-obsidian/95 backdrop-blur-md border border-meteorite/80 rounded-full px-3 py-1.5 flex items-center space-x-3 shadow-xl"
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
          onClick={() => setInternalCaptions((v) => !v)}
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
            <div className="absolute bottom-full right-0 mb-2 p-2.5 bg-obsidian border border-meteorite rounded-lg shadow-xl z-50 flex flex-col items-center space-y-1.5 min-w-[110px]">
              <div className="flex items-center justify-between w-full font-mono text-[9px] tracking-wider text-stone-muted">
                <span>VOICE</span>
                <span className="text-[#DEB275] font-semibold">
                  {voiceState.isMuted ? 'MUTED' : `${Math.round(voiceState.volume * 100)}%`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={voiceState.isMuted ? 0 : voiceState.volume}
                onChange={handleVolumeChange}
                className="w-20 accent-[#DEB275] cursor-pointer"
                aria-label="Curator Narration Volume Slider"
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
    );
  };

  // =========================================================================
  // 1. PANEL VARIANT (Integrated in Artifact Details Curatorial Column)
  // =========================================================================
  if (variant === 'panel') {
    return (
      <div className={`relative w-full flex flex-col items-center select-none pt-2 ${className}`}>
        {renderControls()}

        <AnimatePresence>
          {renderSpeechBubble(false)}
        </AnimatePresence>

        {/* Anchored Waist-Up 2D Illustrated Character Presenter */}
        <div className="relative w-full max-w-[260px] sm:max-w-[320px] md:max-w-[360px] lg:max-w-[400px] aspect-[1672/940] flex items-end justify-center">
          {/* Subtle curatorial stage ambient ground glow */}
          <div className="absolute bottom-0 w-3/4 h-2 bg-gradient-to-t from-[#DEB275]/15 to-transparent rounded-full blur-sm pointer-events-none" />

          <AnimatePresence mode="sync">
            <motion.img
              key={currentPose}
              src={POSE_IMAGES[currentPose] || POSE_IMAGES.explaining}
              alt={`Dr. Mae Vance - ${currentPose}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="absolute bottom-0 w-full h-full object-contain object-bottom select-none pointer-events-none drop-shadow-[0_16px_32px_rgba(0,0,0,0.45)]"
            />
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. OVERLAY VARIANT (Floating in Documentary Chapters with strict clearance)
  // Positioned at bottom-[180px] to sit strictly ABOVE bottom chapter controls
  // =========================================================================
  return (
    <div
      className={`fixed bottom-[180px] sm:bottom-[188px] md:bottom-[180px] right-4 sm:right-8 md:right-12 lg:right-16 z-20 pointer-events-none flex flex-col items-end select-none ${className}`}
    >
      {renderControls()}

      <AnimatePresence>
        {renderSpeechBubble(true)}
      </AnimatePresence>

      {/* Floating 2D Character (Waist-Up, scaled appropriately across viewports) */}
      <div className="relative w-[180px] sm:w-[240px] md:w-[300px] lg:w-[360px] xl:w-[400px] aspect-[1672/940]">
        <AnimatePresence mode="sync">
          <motion.img
            key={currentPose}
            src={POSE_IMAGES[currentPose] || POSE_IMAGES.explaining}
            alt={`Dr. Mae Vance - ${currentPose}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="absolute bottom-0 right-0 w-full h-full object-contain object-bottom select-none pointer-events-none drop-shadow-[0_16px_36px_rgba(0,0,0,0.55)]"
          />
        </AnimatePresence>
      </div>
    </div>
  );
};
