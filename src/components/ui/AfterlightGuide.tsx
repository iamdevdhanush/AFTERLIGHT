import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { ArtifactComponent, ArtifactData } from '../../types';
import { useExperienceStore } from '../../store/useExperienceStore';
import { guideVoiceEngine, VoiceState } from '../../audio/GuideVoiceEngine';

interface AfterlightGuideProps {
  artifact: ArtifactData;
  selectedComponent: ArtifactComponent | null;
  onResetComponent: () => void;
}

const AMBER_ACCENT = '#DEB275';

/**
 * AFTERLIGHT — Editorial Museum Curator Presenter
 * Featuring Dr. Mae Vance, Senior Curator of Planetary Heritage.
 * Matches the reference layout: Hero Curator Stage, Audio Scrubber, and Subtitle Quotation.
 */
export const AfterlightGuide: React.FC<AfterlightGuideProps> = ({
  artifact,
  selectedComponent,
  onResetComponent,
}) => {
  const isAudioMuted = useExperienceStore((s) => s.isAudioMuted);

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

  // Pick the currently active sentence for the editorial quote display
  const currentSentence = useMemo(() => {
    if (selectedComponent) {
      const active = subtitleSentences.find((s) => s.isActive);
      if (active && active.text.length > 25) return active.text;
      return (
        selectedComponent.guideExplanation ||
        selectedComponent.description ||
        activeScript
      );
    }

    // Curated high-impact quotes matching documentary reference
    if (artifact.id === 'apollo_alsep') {
      const active = subtitleSentences.find((s) => s.isActive);
      if (active && (active.text.includes('moonquakes') || active.text.includes('SNAP-27'))) {
        return active.text;
      }
      return 'These instruments were left on the Moon to turn it into a long-term scientific observatory. They measured moonquakes, magnetic fields and heat flowing from beneath the lunar surface';
    }

    const active = subtitleSentences.find((s) => s.isActive);
    if (active && active.text.length > 25) return active.text;
    if (subtitleSentences.length > 1) {
      return `${subtitleSentences[0].text} ${subtitleSentences[1].text}`;
    }
    return activeScript;
  }, [selectedComponent, artifact.id, subtitleSentences, activeScript]);

  // Highlight key phrases in the active sentence (e.g. "long-term scientific observatory", "SNAP-27", etc.)
  const renderHighlightedSentence = (text: string) => {
    // List of notable keywords or key phrases to highlight in amber
    const keyPhrases = [
      'long-term scientific observatory',
      'long-term scientific laboratory',
      'scientific observatory',
      'scientific laboratory',
      'SNAP-27 radioisotope',
      'SNAP-27',
      'moonquakes',
      'lunar surface',
      'lunar dust',
      'lunar regolith',
      'Apollo landing sites',
      'twelve thousand moonquakes',
      'laser retroreflector',
      'telemetry',
      'lunar roving vehicle',
      'lunar module',
      'Eagle',
      'Opportunity',
      'Voyager 1',
      'Oceanus Procellarum',
      'Mare Tranquillitatis',
      'Meridiani Planum',
    ];

    // Find if text matches any key phrase
    const regex = new RegExp(`(${keyPhrases.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) => {
      const isMatch = keyPhrases.some((kp) => kp.toLowerCase() === part.toLowerCase());
      if (isMatch) {
        return (
          <span key={i} style={{ color: AMBER_ACCENT }} className="font-normal">
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <aside
      aria-label="Afterlight Museum Curator Narration"
      className="flex flex-col space-y-6 select-none"
    >
      {/* 1. Header: ((•)) AFTERLIGHT MUSEUM GUIDE ─────── */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5 shrink-0">
          <span
            className="font-mono text-xs tracking-[0.22em] uppercase font-medium"
            style={{ color: AMBER_ACCENT }}
          >
            ((•)) AFTERLIGHT MUSEUM GUIDE
          </span>
        </div>
        <div className="flex-1 h-[1px] bg-meteorite/60" />
      </div>

      {/* 2. Hero Curator Stage: Name/Title on Left, Mae Vance Portrait on Right */}
      <div className="relative flex items-center justify-between min-h-[180px] sm:min-h-[200px] overflow-hidden">
        {/* Left: Curator Identification */}
        <div className="z-10 space-y-2 pr-4 max-w-[220px] sm:max-w-[260px]">
          <h2 className="font-serif text-3xl sm:text-4xl text-bone tracking-tight leading-tight">
            Dr. Mae Vance
          </h2>
          <p className="font-sans text-xs sm:text-sm text-stone-secondary font-light leading-snug">
            Senior Curator of <br />
            Planetary Heritage
          </p>
          <div
            className="w-12 h-0.5 mt-3 rounded-full"
            style={{ backgroundColor: AMBER_ACCENT }}
          />

          {selectedComponent && (
            <div className="pt-2">
              <span
                className="inline-block text-[9px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded border border-meteorite/80 text-stone-muted"
              >
                FOCUS: {selectedComponent.name}
              </span>
            </div>
          )}
        </div>

        {/* Right: Mae Vance Portrait (blending seamlessly into dark obsidian background) */}
        <div className="relative shrink-0 w-44 sm:w-56 md:w-64 aspect-[4/3] overflow-hidden">
          <img
            src="/images/curator_mae_vance.jpg"
            alt="Dr. Mae Vance, Senior Curator of Planetary Heritage"
            className="w-full h-full object-cover object-center filter contrast-105 brightness-95"
          />
          {/* Subtle edge blend overlay to seamlessly integrate into the dark space background */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 70% 40%, transparent 60%, #111416 98%), linear-gradient(to right, #111416 0%, transparent 25%)',
            }}
          />
        </div>
      </div>

      {/* 3. Audio Narration Control Strip */}
      <div className="flex items-center justify-between gap-3 pt-2">
        {/* Play / Pause Circular Button */}
        <button
          type="button"
          onClick={handleTogglePlayPause}
          title={voiceState.isSpeaking && !voiceState.isPaused ? 'Pause Narration' : 'Play Narration'}
          aria-label={voiceState.isSpeaking && !voiceState.isPaused ? 'Pause Narration' : 'Play Narration'}
          style={{ borderColor: AMBER_ACCENT, color: AMBER_ACCENT }}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center hover:bg-white/5 transition-all shrink-0 shadow-sm"
        >
          {voiceState.isSpeaking && !voiceState.isPaused ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          )}
        </button>

        {/* Timestamp */}
        <span className="font-mono text-xs tracking-wider text-stone-secondary shrink-0">
          {timeDisplay.current} / {timeDisplay.total}
        </span>

        {/* Progress Scrubber */}
        <div
          className="flex-1 h-[3px] bg-[#22282C] rounded-full relative cursor-pointer group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            guideVoiceEngine.seekProgress(clickPos);
          }}
        >
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{
              width: `${Math.round(voiceState.progress * 100)}%`,
              backgroundColor: AMBER_ACCENT,
            }}
          />
          <div
            className="w-2.5 h-2.5 rounded-full absolute -top-[3.5px] shadow-sm transition-all duration-100"
            style={{
              left: `${Math.round(voiceState.progress * 100)}%`,
              backgroundColor: AMBER_ACCENT,
              transform: 'translateX(-50%)',
            }}
          />
        </div>

        {/* Tool Controls: Volume, CC, Replay */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Volume Control with hover popover */}
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
              className="text-stone-secondary hover:text-bone transition-colors p-1"
            >
              {voiceState.isMuted || voiceState.volume === 0 ? (
                <VolumeX className="w-4 h-4 text-stone-muted" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            {showVolumeSlider && (
              <div className="absolute bottom-full right-0 mb-2 p-2 bg-surface-raised border border-meteorite rounded shadow-xl z-30">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={voiceState.isMuted ? 0 : voiceState.volume}
                  onChange={handleVolumeChange}
                  className="w-20 accent-[#DEB275] cursor-pointer"
                  aria-label="Curator Volume Slider"
                />
              </div>
            )}
          </div>

          {/* CC Toggle Button */}
          <button
            type="button"
            onClick={() => setShowCaptions((v) => !v)}
            title={showCaptions ? 'Hide Subtitles' : 'Show Subtitles'}
            aria-label={showCaptions ? 'Hide Subtitles' : 'Show Subtitles'}
            style={{
              borderColor: showCaptions ? AMBER_ACCENT : '#3E4548',
              color: showCaptions ? AMBER_ACCENT : '#85877F',
            }}
            className="px-1.5 py-0.5 rounded border text-[10px] font-mono tracking-wider transition-colors"
          >
            CC
          </button>

          {/* Replay Button */}
          <button
            type="button"
            onClick={handleReplay}
            title="Replay Presentation"
            aria-label="Replay Presentation"
            className="text-stone-secondary hover:text-bone transition-colors p-1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. Editorial Quotation / Narration Box */}
      <AnimatePresence mode="wait">
        {showCaptions ? (
          <motion.div
            key={activeKey + currentSentence.slice(0, 20)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="relative flex items-start pt-2"
          >
            {/* Opening quotation mark */}
            <span
              className="font-serif text-3xl sm:text-4xl select-none leading-none mr-2.5 mt-0.5 shrink-0"
              style={{ color: AMBER_ACCENT }}
              aria-hidden="true"
            >
              “
            </span>

            {/* Editorial quote text with highlighted phrases */}
            <div className="space-y-3">
              <p className="font-serif text-lg sm:text-xl text-bone/95 leading-relaxed font-light tracking-wide">
                {renderHighlightedSentence(currentSentence)}
                <span className="text-stone-muted">...</span>
              </p>

              {selectedComponent && (
                <div className="flex items-center space-x-3 pt-1">
                  <span className="font-mono text-[10px] tracking-widest text-stone-muted uppercase">
                    ACTIVE COMPONENT: {selectedComponent.name}
                  </span>
                  <button
                    type="button"
                    onClick={onResetComponent}
                    className="font-mono text-[10px] tracking-wider uppercase transition-colors underline underline-offset-2"
                    style={{ color: AMBER_ACCENT }}
                  >
                    OVERVIEW
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="py-4 text-center font-mono text-[10px] tracking-widest text-stone-muted uppercase border-t border-meteorite/40">
            CAPTIONS MUTED · AUDIO ACTIVE
          </div>
        )}
      </AnimatePresence>
    </aside>
  );
};
