import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Radio } from 'lucide-react';
import { ArtifactComponent, ArtifactData } from '../../types';
import { useExperienceStore } from '../../store/useExperienceStore';
import { guideVoiceEngine, VoiceState } from '../../audio/GuideVoiceEngine';
import { GuideCharacter3D } from '../canvas/GuideCharacter3D';
import { getDestinationTheme } from '../../theme/tokens';

interface AfterlightGuideProps {
  artifact: ArtifactData;
  selectedComponent: ArtifactComponent | null;
  onResetComponent: () => void;
}

/**
 * AFTERLIGHT — Signal & Stone Museum Presenter Interface
 * Dr. Mae Vance, Senior Curator of Planetary Heritage.
 * Features an expansive, borderless 3D stage, minimal Signal-accented audio controls,
 * and high-contrast editorial live subtitles with highlighted phrasing.
 */
export const AfterlightGuide: React.FC<AfterlightGuideProps> = ({
  artifact,
  selectedComponent,
  onResetComponent,
}) => {
  const isAudioMuted = useExperienceStore((s) => s.isAudioMuted);
  const destTheme = getDestinationTheme(artifact.destination);

  // Guide voice engine state
  const [voiceState, setVoiceState] = useState<VoiceState>(guideVoiceEngine.getState());
  const [showCaptions, setShowCaptions] = useState(true);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Subscribe to voice engine updates
  useEffect(() => {
    const unsubscribe = guideVoiceEngine.subscribe((next) => {
      setVoiceState(next);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Determine active narration script
  const activeScript = useMemo(() => {
    if (selectedComponent) {
      return (
        selectedComponent.voiceScript ||
        selectedComponent.guideExplanation ||
        selectedComponent.description
      );
    }
    return (
      artifact.guide.voiceScript ||
      artifact.guide.spokenIntro ||
      artifact.guide.explanation
    );
  }, [selectedComponent, artifact]);

  const activeKey = selectedComponent
    ? `${artifact.id}-${selectedComponent.id}`
    : artifact.id;

  // Auto-play narration on artifact open or component change
  useEffect(() => {
    guideVoiceEngine.setMuted(isAudioMuted);

    const timer = setTimeout(() => {
      guideVoiceEngine.play(activeScript, true);
    }, 450);

    return () => {
      clearTimeout(timer);
      guideVoiceEngine.stop(false);
    };
  }, [activeKey, activeScript, isAudioMuted]);

  // Audio control actions
  const handleTogglePlayPause = () => {
    if (voiceState.isSpeaking && !voiceState.isPaused) {
      guideVoiceEngine.pause();
    } else if (voiceState.isPaused) {
      guideVoiceEngine.resume();
    } else {
      guideVoiceEngine.play(activeScript, true);
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
    guideVoiceEngine.setVolume(val);
  };

  // Formatted duration calculation (approx ~135 wpm documentary cadence)
  const timeDisplay = useMemo(() => {
    if (!activeScript) return { current: '0:00', total: '0:00' };
    const wordCount = activeScript.split(/\s+/).filter(Boolean).length;
    const totalSeconds = Math.max(24, Math.round((wordCount / 135) * 60));
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
  }, [activeScript, voiceState.progress]);

  // Sentence-level subtitle segmentation with active phrase highlighting
  const subtitleSentences = useMemo(() => {
    if (!activeScript) return [];
    const rawSentences = activeScript.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [activeScript];
    let cumulative = 0;

    return rawSentences.map((sent, idx) => {
      const start = cumulative;
      cumulative += sent.length;
      const end = cumulative;
      const isActive =
        voiceState.currentCharIndex >= start && voiceState.currentCharIndex <= end;
      const isPast = voiceState.currentCharIndex > end;

      return {
        text: sent.trim(),
        isActive,
        isPast,
        id: idx,
      };
    });
  }, [activeScript, voiceState.currentCharIndex]);

  return (
    <aside
      aria-label="Afterlight Curatorial Presenter"
      className="flex flex-col space-y-6 select-none"
    >
      {/* 1. Subtle Editorial Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-meteorite">
        <div className="flex items-center space-x-2">
          <Radio className="w-3.5 h-3.5 text-signal animate-pulse" />
          <span className="font-mono text-[10px] tracking-[0.22em] text-signal uppercase font-medium">
            AFTERLIGHT MUSEUM GUIDE
          </span>
        </div>
        <span className="font-mono text-[9px] tracking-[0.16em] text-stone-muted uppercase hidden sm:inline">
          {voiceState.isSpeaking && !voiceState.isPaused
            ? 'CURATOR TRANSMITTING'
            : 'CURATOR ON STANDBY'}
        </span>
      </div>

      {/* 2. Large Cinematic Character Presentation Stage */}
      <div className="relative w-full h-80 sm:h-96 -my-2 overflow-hidden">
        {/* Editorial Presenter Label & Curator Designation (Left-Aligned overlay) */}
        <div className="absolute top-8 left-0 z-10 pointer-events-none space-y-1.5 max-w-[210px] sm:max-w-[240px]">
          <h2 className="font-serif text-3xl sm:text-4xl text-bone tracking-tight leading-tight">
            Dr. Mae Vance
          </h2>
          <p className="font-sans text-xs sm:text-sm text-stone-secondary font-light leading-snug">
            Senior Curator of <br />
            Planetary Heritage
          </p>
          <div className="w-8 h-[2px] bg-signal mt-3" />
        </div>

        {/* 3D Character Viewport (Right ~60% with presentation gesture toward left artifact) */}
        <GuideCharacter3D
          artifactKey={activeKey}
          isSpeaking={voiceState.isSpeaking}
          isPaused={voiceState.isPaused}
          visemeSignal={voiceState.visemeSignal}
        />
      </div>

      {/* 3. Minimalist Audio Narration Control Strip */}
      <div className="pt-2 pb-1 flex items-center justify-between gap-4">
        {/* Play / Pause Circular Toggle (Signal Vermilion) */}
        <button
          type="button"
          onClick={handleTogglePlayPause}
          title={voiceState.isSpeaking && !voiceState.isPaused ? 'Pause Narration' : 'Play Narration'}
          aria-label={voiceState.isSpeaking && !voiceState.isPaused ? 'Pause Narration' : 'Play Narration'}
          className="w-9 h-9 rounded-full border border-signal/80 flex items-center justify-center text-signal hover:border-signal hover:bg-signal/15 transition-all shrink-0"
        >
          {voiceState.isSpeaking && !voiceState.isPaused ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          )}
        </button>

        {/* Telemetry Timestamp Counter */}
        <span className="font-mono text-xs tracking-wider text-stone-secondary shrink-0">
          {timeDisplay.current} / {timeDisplay.total}
        </span>

        {/* Thin Sleek Progress Line */}
        <div className="flex-1 h-[3px] bg-surface-raised rounded-full overflow-hidden relative border border-meteorite/40">
          <motion.div
            className="h-full bg-gradient-to-r from-signal/80 to-signal"
            style={{ width: `${Math.round(voiceState.progress * 100)}%` }}
          />
        </div>

        {/* Right Tools: Volume, CC, Replay */}
        <div className="flex items-center space-x-2.5 shrink-0">
          {/* Volume Control with hover slider */}
          <div
            className="relative flex items-center"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <button
              type="button"
              onClick={handleToggleMute}
              title={voiceState.isMuted ? 'Unmute Presenter' : 'Mute Presenter'}
              aria-label={voiceState.isMuted ? 'Unmute Presenter' : 'Mute Presenter'}
              className="text-stone-secondary hover:text-signal transition-colors p-1"
            >
              {voiceState.isMuted || voiceState.volume === 0 ? (
                <VolumeX className="w-4 h-4 text-stone-muted" />
              ) : (
                <Volume2 className="w-4 h-4 text-signal" />
              )}
            </button>

            {showVolumeSlider && (
              <div className="absolute right-0 bottom-full mb-2 bg-surface-raised border border-meteorite px-2.5 py-1.5 rounded-sm shadow-2xl flex items-center space-x-2 z-30">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={voiceState.isMuted ? 0 : voiceState.volume}
                  onChange={handleVolumeChange}
                  aria-label="Voice Volume"
                  className="w-20 accent-signal cursor-pointer h-1 bg-meteorite rounded-lg appearance-none"
                />
              </div>
            )}
          </div>

          {/* CC Closed Captions Toggle */}
          <button
            type="button"
            onClick={() => setShowCaptions(!showCaptions)}
            title="Toggle Captions"
            aria-label="Toggle Captions"
            className={`px-2 py-0.5 rounded text-[10px] font-mono tracking-wider transition-colors border ${
              showCaptions
                ? 'border-signal text-signal bg-signal/10'
                : 'border-meteorite text-stone-muted hover:text-stone-secondary'
            }`}
          >
            CC
          </button>

          {/* Replay Narration */}
          <button
            type="button"
            onClick={handleReplay}
            title="Replay from Beginning"
            aria-label="Replay from Beginning"
            className="text-stone-muted hover:text-signal transition-colors p-1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. Live Editorial Subtitles (Directly beneath controls, spacious, no internal scrollbar) */}
      <AnimatePresence mode="wait">
        {showCaptions && (
          <motion.div
            key={activeKey}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="space-y-3 pt-2"
          >
            {/* Component Context Indicator if a component is inspected */}
            {selectedComponent && (
              <div className="flex items-center justify-between pb-1">
                <span
                  className="font-mono text-[9px] tracking-[0.2em] uppercase font-medium"
                  style={{ color: destTheme.accent }}
                >
                  COMPONENT ANALYSIS · {selectedComponent.name}
                </span>
                <button
                  type="button"
                  onClick={onResetComponent}
                  className="font-mono text-[9px] tracking-[0.16em] text-stone-secondary hover:text-signal uppercase transition-colors underline underline-offset-2"
                >
                  RETURN TO OVERVIEW
                </button>
              </div>
            )}

            {/* Stylized Documentary Subtitle Quote */}
            <div className="flex items-start">
              <span
                className="font-serif text-3xl sm:text-4xl text-signal select-none leading-none mr-2 mt-0.5"
                aria-hidden="true"
              >
                “
              </span>

              <p className="font-serif text-base sm:text-lg md:text-[19px] text-bone/90 leading-relaxed font-light tracking-wide">
                {subtitleSentences.map((sentence) => (
                  <span
                    key={sentence.id}
                    className={`transition-colors duration-200 ${
                      sentence.isActive
                        ? 'text-signal font-normal'
                        : sentence.isPast
                        ? 'text-bone'
                        : 'text-stone-muted'
                    }`}
                  >
                    {sentence.text}{' '}
                  </span>
                ))}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
};
