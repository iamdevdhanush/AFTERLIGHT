import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Subtitles, Radio, Sparkles } from 'lucide-react';
import { ArtifactComponent, ArtifactData } from '../../types';
import { useExperienceStore } from '../../store/useExperienceStore';
import { guideVoiceEngine, VoiceState } from '../../audio/GuideVoiceEngine';
import { GuideCharacter3D } from '../canvas/GuideCharacter3D';

interface AfterlightGuideProps {
  artifact: ArtifactData;
  selectedComponent: ArtifactComponent | null;
  onResetComponent: () => void;
}

/**
 * Voice-Based Interactive 3D Museum Presenter — Dr. Mae Vance, Senior Curator.
 * Explains artifacts and components verbally with browser speech synthesis,
 * real-time viseme mouth synchronization, natural gestures, interactive audio controls,
 * real-time captions, and archival curatorial breakdown.
 * Absolute zero-chatbot UI (no message bubbles, input boxes, or typing indicators).
 */
export const AfterlightGuide: React.FC<AfterlightGuideProps> = ({
  artifact,
  selectedComponent,
  onResetComponent,
}) => {
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);
  const isAudioMuted = useExperienceStore((s) => s.isAudioMuted);

  // Voice engine state
  const [voiceState, setVoiceState] = useState<VoiceState>(guideVoiceEngine.getState());
  const [showCaptions, setShowCaptions] = useState(true);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Subscribe to GuideVoiceEngine updates
  useEffect(() => {
    const unsubscribe = guideVoiceEngine.subscribe((next) => {
      setVoiceState(next);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Determine active script for the current state
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

  // Auto-play voice presentation on artifact open or component change
  useEffect(() => {
    // Respect user's master sound setting
    guideVoiceEngine.setMuted(isAudioMuted);

    // Short delay to let screen transition settle smoothly
    const timer = setTimeout(() => {
      guideVoiceEngine.play(activeScript, true);
    }, 450);

    return () => {
      clearTimeout(timer);
      guideVoiceEngine.stop(false);
    };
  }, [activeKey, activeScript, isAudioMuted]);

  // Audio control handlers
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

  // Subtitle real-time word highlighting computation
  const renderedSubtitleWords = useMemo(() => {
    if (!activeScript) return [];
    const words = activeScript.split(/(\s+)/);
    let cumulativeLength = 0;

    return words.map((chunk, idx) => {
      const start = cumulativeLength;
      cumulativeLength += chunk.length;
      const end = cumulativeLength;
      const isWhitespace = /^\s+$/.test(chunk);

      if (isWhitespace) {
        return { text: chunk, isCurrent: false, isPast: false, isWhitespace: true, id: idx };
      }

      const isCurrent =
        voiceState.currentCharIndex >= start && voiceState.currentCharIndex <= end;
      const isPast = voiceState.currentCharIndex > end;

      return {
        text: chunk,
        isCurrent,
        isPast,
        isWhitespace: false,
        id: idx,
      };
    });
  }, [activeScript, voiceState.currentCharIndex]);

  return (
    <aside
      aria-label="Afterlight Curatorial Presenter"
      className="flex flex-col space-y-6 border-l border-starlight/10 pl-6 lg:pl-8"
    >
      {/* 1. Presenter Header & 3D Character Viewport */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Radio className="w-3.5 h-3.5 text-gold animate-pulse" />
            <span className="font-mono text-[10px] tracking-[0.24em] text-gold uppercase">
              AFTERLIGHT MUSEUM GUIDE
            </span>
          </div>

          <span className="font-mono text-[9px] tracking-[0.16em] text-starlight/45 uppercase">
            ORBITAL DOCENT SYSTEM
          </span>
        </div>

        {/* 3D Character Viewport (Dr. Mae Vance) */}
        <div className="relative w-full h-56 sm:h-64 rounded-sm border border-starlight/15 overflow-hidden shadow-2xl bg-void group">
          <GuideCharacter3D
            artifactKey={activeKey}
            isSpeaking={voiceState.isSpeaking}
            isPaused={voiceState.isPaused}
            visemeSignal={voiceState.visemeSignal}
          />

          {/* Presenter Name Badge Overlay */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between pointer-events-none bg-void/65 backdrop-blur-md px-3 py-1.5 border border-starlight/10 rounded-sm">
            <div>
              <span className="font-serif text-xs text-starlight tracking-wide block">
                Dr. Mae Vance
              </span>
              <span className="font-mono text-[8.5px] tracking-[0.18em] text-gold/90 uppercase block">
                Senior Curator · Planetary Heritage
              </span>
            </div>

            {/* Live Audio Equalizer Waveform */}
            <div className="flex items-end space-x-1 h-3.5" aria-hidden="true">
              {[0.4, 0.9, 0.6, 1.0, 0.5, 0.8].map((mult, i) => (
                <motion.span
                  key={i}
                  className="w-0.5 bg-gold rounded-full"
                  animate={
                    voiceState.isSpeaking && !voiceState.isPaused
                      ? {
                          height: [
                            '3px',
                            `${Math.max(4, Math.round(14 * mult * (voiceState.visemeSignal || 0.6)))}px`,
                            '3px',
                          ],
                        }
                      : { height: '3px' }
                  }
                  transition={{
                    duration: 0.28 + i * 0.05,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 2. Interactive Voice Controls Bar */}
        <div className="bg-[#090D14] border border-starlight/12 px-3.5 py-2.5 rounded-sm space-y-2">
          <div className="flex items-center justify-between gap-3">
            {/* Play / Pause Toggle */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleTogglePlayPause}
                title={voiceState.isSpeaking && !voiceState.isPaused ? 'Pause Narration' : 'Play Narration'}
                aria-label={voiceState.isSpeaking && !voiceState.isPaused ? 'Pause Narration' : 'Play Narration'}
                className="w-8 h-8 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center text-gold hover:bg-gold hover:text-void transition-colors"
              >
                {voiceState.isSpeaking && !voiceState.isPaused ? (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                )}
              </button>

              {/* Replay */}
              <button
                type="button"
                onClick={handleReplay}
                title="Replay from Beginning"
                aria-label="Replay from Beginning"
                className="w-7 h-7 rounded-sm flex items-center justify-center text-starlight/60 hover:text-starlight hover:bg-starlight/10 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <span className="font-mono text-[9.5px] tracking-[0.16em] text-starlight/70 uppercase">
                {voiceState.isSpeaking && !voiceState.isPaused
                  ? 'SPEAKING'
                  : voiceState.isPaused
                  ? 'PAUSED'
                  : 'READY'}
              </span>
            </div>

            {/* Right Controls: Volume, CC Toggle */}
            <div className="flex items-center space-x-2">
              {/* Volume Slider Drawer */}
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
                  className="w-7 h-7 rounded-sm flex items-center justify-center text-starlight/60 hover:text-starlight hover:bg-starlight/10 transition-colors"
                >
                  {voiceState.isMuted || voiceState.volume === 0 ? (
                    <VolumeX className="w-3.5 h-3.5 text-starlight/45" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-gold" />
                  )}
                </button>

                {showVolumeSlider && (
                  <div className="absolute right-0 bottom-full mb-1 bg-void/95 border border-starlight/20 px-2.5 py-1.5 rounded-sm shadow-xl flex items-center space-x-2 z-30">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={voiceState.isMuted ? 0 : voiceState.volume}
                      onChange={handleVolumeChange}
                      aria-label="Voice Volume"
                      className="w-20 accent-gold cursor-pointer h-1 bg-starlight/20 rounded-lg appearance-none"
                    />
                    <span className="font-mono text-[8px] text-starlight/70">
                      {Math.round((voiceState.isMuted ? 0 : voiceState.volume) * 100)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Closed Captions CC Toggle */}
              <button
                type="button"
                onClick={() => setShowCaptions(!showCaptions)}
                title="Toggle Captions"
                aria-label="Toggle Captions"
                className={`px-2 py-1 rounded-sm font-mono text-[9px] tracking-wider border transition-colors flex items-center space-x-1 ${
                  showCaptions
                    ? 'border-gold/50 bg-gold/15 text-gold'
                    : 'border-starlight/20 text-starlight/45 hover:text-starlight/75'
                }`}
              >
                <Subtitles className="w-3 h-3" />
                <span>CC</span>
              </button>
            </div>
          </div>

          {/* Slender Gold Playback Progress Bar */}
          <div className="space-y-1">
            <div className="w-full h-1 bg-starlight/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-gold/70 to-gold"
                style={{ width: `${Math.round(voiceState.progress * 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center font-mono text-[8.5px] text-starlight/45">
              <span>VOICE NARRATION</span>
              <span>{Math.round(voiceState.progress * 100)}% COMPLETE</span>
            </div>
          </div>
        </div>

        {/* 3. Live Synchronized Captions / Subtitles with Word Highlighting */}
        {showCaptions && (
          <div className="bg-void/70 border border-starlight/10 p-3.5 rounded-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] tracking-[0.18em] text-gold uppercase flex items-center gap-1.5">
                <Sparkles className="w-2.5 h-2.5 text-gold" />
                {selectedComponent ? 'COMPONENT PRESENTATION' : 'CURATORIAL BRIEFING'}
              </span>

              {selectedComponent && (
                <button
                  type="button"
                  onClick={onResetComponent}
                  className="font-mono text-[9px] tracking-[0.16em] text-starlight/55 hover:text-gold uppercase transition-colors underline underline-offset-2"
                >
                  RETURN TO OVERVIEW
                </button>
              )}
            </div>

            {selectedComponent && (
              <h4 className="font-serif text-base text-starlight">
                {selectedComponent.name}
              </h4>
            )}

            {/* Word-by-word highlighted script */}
            <p className="font-sans text-xs md:text-[13px] leading-relaxed font-light text-starlight/75 max-h-40 overflow-y-auto pr-1">
              {renderedSubtitleWords.map((chunk) => {
                if (chunk.isWhitespace) {
                  return chunk.text;
                }
                return (
                  <span
                    key={chunk.id}
                    className={`transition-colors duration-150 ${
                      chunk.isCurrent
                        ? 'text-gold font-medium bg-gold/15 px-0.5 rounded'
                        : chunk.isPast
                        ? 'text-starlight/95'
                        : 'text-starlight/45'
                    }`}
                  >
                    {chunk.text}
                  </span>
                );
              })}
            </p>
          </div>
        )}
      </div>

      {/* 4. Structured Curatorial Archival Breakdown */}
      <dl className="space-y-4 pt-4 border-t border-starlight/10 text-xs">
        <div>
          <dt className="font-mono text-[10px] tracking-[0.18em] text-starlight/45 uppercase">
            Mission & Program
          </dt>
          <dd className="font-sans text-xs md:text-[13px] text-starlight/85 leading-relaxed mt-1 font-light">
            {artifact.guide.missionUsed}
          </dd>
        </div>

        <div>
          <dt className="font-mono text-[10px] tracking-[0.18em] text-starlight/45 uppercase">
            Curatorial Purpose
          </dt>
          <dd className="font-sans text-xs md:text-[13px] text-starlight/85 leading-relaxed mt-1 font-light">
            {artifact.guide.purpose}
          </dd>
        </div>

        <div>
          <dt className="font-mono text-[10px] tracking-[0.18em] text-starlight/45 uppercase">
            Why It Remained
          </dt>
          <dd className="font-sans text-xs md:text-[13px] text-starlight/85 leading-relaxed mt-1 font-light">
            {artifact.guide.whyLeftBehind}
          </dd>
        </div>

        <div>
          <dt className="font-mono text-[10px] tracking-[0.18em] text-starlight/45 uppercase">
            Present Status Today
          </dt>
          <dd className="font-sans text-xs md:text-[13px] text-gold/95 leading-relaxed mt-1 font-light">
            {artifact.guide.presentStatus}
          </dd>
        </div>

        {/* Curated Key Facts */}
        {artifact.guide.keyFacts && artifact.guide.keyFacts.length > 0 && (
          <div className="pt-2">
            <dt className="font-mono text-[10px] tracking-[0.18em] text-gold uppercase mb-2">
              Curated Key Facts
            </dt>
            <dd className="space-y-1.5">
              {artifact.guide.keyFacts.map((fact, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-2 text-starlight/80 font-sans text-xs font-light leading-relaxed"
                >
                  <span className="text-gold shrink-0 mt-0.5">•</span>
                  <span>{fact}</span>
                </div>
              ))}
            </dd>
          </div>
        )}
      </dl>
    </aside>
  );
};
