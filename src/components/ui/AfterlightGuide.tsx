import React, { useEffect, useMemo, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { ArtifactComponent, ArtifactData } from '../../types';
import { useExperienceStore } from '../../store/useExperienceStore';
import { guideVoiceEngine, VoiceState } from '../../audio/GuideVoiceEngine';
import { CuratorPresenter2D } from './CuratorPresenter2D';

interface AfterlightGuideProps {
  artifact: ArtifactData;
  selectedComponent: ArtifactComponent | null;
  onResetComponent: () => void;
  onEnterStory?: () => void;
}

const AMBER_ACCENT = '#DEB275';

/**
 * AFTERLIGHT — Museum Curator Storytelling Integration
 * Unifies the Dr. Mae Vance character presenter, animated speech bubble,
 * curatorial controls, site telemetry, and documentary story access into one connected card.
 */
export const AfterlightGuide: React.FC<AfterlightGuideProps> = ({
  artifact,
  selectedComponent,
  onResetComponent,
  onEnterStory,
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
    <aside
      aria-label="Afterlight Museum Curator Narration"
      className="flex flex-col bg-surface-raised/50 border border-meteorite/70 rounded-sm p-4 sm:p-5 space-y-4 select-none shadow-xl"
    >
      {/* 1. Header: Curator identity + Audio Controls */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-meteorite/40">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-signal animate-pulse" />
            <span
              className="font-mono text-[10px] tracking-[0.2em] uppercase font-semibold"
              style={{ color: AMBER_ACCENT }}
            >
              DR. MAE VANCE
            </span>
          </div>
          <p className="font-sans text-[11px] text-stone-secondary font-light truncate">
            Senior Curator of Planetary Heritage
          </p>
        </div>

        {/* Audio Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleTogglePlayPause}
            title={voiceState.isSpeaking && !voiceState.isPaused ? 'Pause Narration' : 'Play Narration'}
            aria-label={voiceState.isSpeaking && !voiceState.isPaused ? 'Pause Narration' : 'Play Narration'}
            style={{ borderColor: AMBER_ACCENT, color: AMBER_ACCENT }}
            className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-white/5 transition-all shrink-0 shadow-sm"
          >
            {voiceState.isSpeaking && !voiceState.isPaused ? (
              <Pause className="w-3 h-3 fill-current" />
            ) : (
              <Play className="w-3 h-3 fill-current ml-0.5" />
            )}
          </button>

          <span className="font-mono text-[10px] tracking-wider text-stone-secondary">
            {timeDisplay.current} / {timeDisplay.total}
          </span>

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
                <VolumeX className="w-3.5 h-3.5 text-stone-muted" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
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
            className="px-1.5 py-0.5 rounded border text-[9px] font-mono tracking-wider transition-colors"
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
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Progress Scrubber */}
      <div
        className="w-full h-[3px] bg-[#22282C] rounded-full relative cursor-pointer group"
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
      </div>

      {/* 3. Component context badge if inspecting */}
      {selectedComponent && (
        <div className="flex items-center justify-between text-[10px] font-mono px-2.5 py-1.5 bg-surface border border-meteorite/60 rounded-sm">
          <span className="text-signal truncate font-medium">✦ INSPECTING: {selectedComponent.name}</span>
          <button
            type="button"
            onClick={onResetComponent}
            className="text-stone-muted hover:text-signal uppercase tracking-wider ml-2 shrink-0 font-semibold"
          >
            RESET
          </button>
        </div>
      )}

      {/* 4. DR. MAE VANCE PRESENTATION STAGE & SPEECH BUBBLE */}
      <div className="py-1">
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

      {/* 5. In-Situ Archival Records & Documentary CTA */}
      <div className="pt-3 border-t border-meteorite/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] font-mono text-stone-muted">
        <div className="space-y-0.5">
          <div className="text-bone font-medium text-xs">{artifact.locationName}</div>
          <div className="text-[10px] text-stone-muted font-mono">
            {artifact.coordinates.latitude} · {artifact.coordinates.longitude}
          </div>
        </div>

        {onEnterStory && (
          <button
            type="button"
            onClick={onEnterStory}
            className="group shrink-0 inline-flex items-center space-x-2 px-3.5 py-2 border border-meteorite hover:border-[#DEB275] bg-surface hover:bg-surface-raised text-bone transition-all text-xs font-mono uppercase tracking-[0.14em] rounded-sm"
          >
            <span>DOCUMENTARY</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" style={{ color: '#DEB275' }} />
          </button>
        )}
      </div>
    </aside>
  );
};
