import React, { useEffect, useMemo, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Eye, EyeOff } from 'lucide-react';
import { ArtifactComponent, ArtifactData } from '../../types';
import { useExperienceStore } from '../../store/useExperienceStore';
import { guideVoiceEngine, VoiceState } from '../../audio/GuideVoiceEngine';
import { CuratorPresenter2D } from './CuratorPresenter2D';

interface AfterlightGuideProps {
  artifact: ArtifactData;
  selectedComponent: ArtifactComponent | null;
  onResetComponent: () => void;
}

const AMBER_ACCENT = '#DEB275';

/**
 * AFTERLIGHT — Museum Curator Storytelling Integration
 * Integrates the floating 2D Mae Vance character presenter and animated white speech bubble,
 * along with the editorial curatorial controls and telemetry dossier in the exhibition view.
 */
export const AfterlightGuide: React.FC<AfterlightGuideProps> = ({
  artifact,
  selectedComponent,
  onResetComponent,
}) => {
  const isAudioMuted = useExperienceStore((s) => s.isAudioMuted);
  const setNarrationVolume = useExperienceStore((s) => s.setNarrationVolume);

  // Guide voice engine state
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
    setNarrationVolume(val);
  };

  // Formatted duration calculation (~135 wpm documentary cadence)
  const timeDisplay = useMemo(() => {
    if (!activeScript) return { current: '0:00', total: '0:00' };
    const wordCount = activeScript.split(/\s+/).filter(Boolean).length;
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
  }, [activeScript, voiceState.progress]);

  return (
    <>
      {/* A. RIGHT-COLUMN CURATORIAL DOSSIER & PLAYBACK CONTROLS */}
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

        {/* 2. Curator Identification & Status */}
        <div className="space-y-2">
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
        </div>

        {/* 3. Audio Narration Control Strip */}
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-meteorite/40">
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

          {/* Action Tools: Volume, CC, Replay */}
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
                <div className="absolute bottom-full right-0 mb-2 p-2.5 bg-obsidian border border-meteorite rounded-lg shadow-xl z-30 flex flex-col items-center space-y-1.5 min-w-[110px]">
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

        {/* 4. Active Curatorial Presentation Context */}
        <div className="p-4 bg-surface-raised/40 border border-meteorite/60 rounded space-y-2">
          <div className="flex items-center justify-between">
            <span
              className="font-mono text-[9px] tracking-[0.2em] uppercase font-semibold flex items-center space-x-1.5"
              style={{ color: AMBER_ACCENT }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-signal animate-pulse" />
              <span>
                {selectedComponent
                  ? `INSPECTING: ${selectedComponent.name}`
                  : `PRESENTING: ${artifact.name}`}
              </span>
            </span>

            {selectedComponent && (
              <button
                type="button"
                onClick={onResetComponent}
                className="font-mono text-[9px] tracking-wider uppercase text-signal hover:underline"
              >
                RETURN TO OVERVIEW
              </button>
            )}
          </div>

          <p className="font-sans text-xs text-stone-secondary font-light leading-relaxed">
            {selectedComponent
              ? selectedComponent.description
              : artifact.brief}
          </p>
        </div>

        {/* 5. DR. MAE VANCE PRESENTATION STAGE & SIGNATURE SPEECH BUBBLE */}
        <div className="pt-2">
          <CuratorPresenter2D
            script={activeScript}
            contextTitle={selectedComponent ? selectedComponent.name : artifact.name}
            isComponent={!!selectedComponent}
            onResetComponent={onResetComponent}
            showControls={false}
            showCaptions={showCaptions}
            variant="panel"
          />
        </div>
      </aside>
    </>
  );
};
