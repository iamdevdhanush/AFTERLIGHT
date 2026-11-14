import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Compass,
  Cpu,
  Layers,
  Calendar,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Sparkles,
  Info,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { MISSION_STORIES } from '../data/missionStories';
import { CompleteMissionStory, MissionStoryChapter } from '../types/storytelling';

export interface MissionStoryProps {
  storyId: string;
  onClose: () => void;
  onCameraCue: (
    lat: number,
    lon: number,
    altitudeUnits: number,
    planet: 'moon' | 'mars'
  ) => void;
  onOpenHardwareInspection: (artifactId: string) => void;
  onSelectStory?: (storyId: string) => void;
}

export const MissionStorytellingExperience: React.FC<MissionStoryProps> = ({
  storyId,
  onClose,
  onCameraCue,
  onOpenHardwareInspection,
  onSelectStory,
}) => {
  const story: CompleteMissionStory =
    MISSION_STORIES[storyId] || MISSION_STORIES.apollo11_eagle;

  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  const currentChapter: MissionStoryChapter = story.chapters[currentChapterIndex];

  // Dispatch camera cues whenever the chapter changes
  const applyCameraCue = useCallback(
    (chapter: MissionStoryChapter) => {
      if (chapter.cameraCue) {
        onCameraCue(
          chapter.cameraCue.lat,
          chapter.cameraCue.lon,
          chapter.cameraCue.altitudeUnits,
          story.planet
        );
      }
    },
    [onCameraCue, story.planet]
  );

  useEffect(() => {
    applyCameraCue(currentChapter);
  }, [currentChapter, applyCameraCue]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goToNextChapter();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevChapter();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentChapterIndex, story.chapters.length, onClose]);

  const goToNextChapter = () => {
    if (currentChapterIndex < story.chapters.length - 1) {
      setCurrentChapterIndex((prev) => prev + 1);
    }
  };

  const goToPrevChapter = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex((prev) => prev - 1);
    }
  };

  const selectChapter = (index: number) => {
    setCurrentChapterIndex(index);
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-40 flex flex-col justify-between p-4 md:p-6 select-none font-sans">
      {/* Top Navigation Bar */}
      <header className="pointer-events-auto flex items-center justify-between w-full max-w-7xl mx-auto bg-slate-950/85 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10 shadow-2xl">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-white font-semibold">
              MISSION ARCHAEOLOGY CHRONICLES
            </span>
          </div>

          <span className="hidden md:inline-block text-white/30 text-xs">|</span>

          {/* Mission Switcher */}
          <div className="hidden sm:flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10">
            {Object.values(MISSION_STORIES).map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  if (onSelectStory) onSelectStory(s.id);
                  setCurrentChapterIndex(0);
                }}
                className={`px-3 py-1 rounded text-xs font-mono tracking-wider uppercase transition-all ${
                  story.id === s.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s.planet.toUpperCase()}: {s.missionName}
              </button>
            ))}
          </div>
        </div>

        {/* Chapter Indicator & Control Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onOpenHardwareInspection(story.id)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-xs tracking-wider uppercase transition-colors"
          >
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">INSPECT 3D HARDWARE</span>
          </button>

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
            title={isMinimized ? 'Expand narrative' : 'Minimize narrative'}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
            title="Exit Mission Chronicles (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Chapter Storytelling Card */}
      {!isMinimized && (
        <div className="pointer-events-auto w-full max-w-4xl mx-auto my-auto bg-[#0A0C13]/92 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
          {/* Chapter Stepper Tabstrip */}
          <div className="border-b border-white/10 bg-black/40 px-4 py-2.5 flex items-center justify-between overflow-x-auto scrollbar-none gap-2">
            <div className="flex items-center space-x-1 shrink-0">
              {story.chapters.map((ch, idx) => {
                const isActive = idx === currentChapterIndex;
                const isPassed = idx < currentChapterIndex;
                return (
                  <button
                    key={ch.id}
                    onClick={() => selectChapter(idx)}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-mono tracking-wider uppercase transition-all ${
                      isActive
                        ? 'bg-amber-500/25 text-amber-300 border border-amber-400/50 shadow'
                        : isPassed
                        ? 'text-slate-300 hover:bg-white/5'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                        isActive
                          ? 'bg-amber-400 text-black'
                          : isPassed
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      {ch.chapterNumber}
                    </span>
                    <span className="hidden lg:inline text-[11px] truncate max-w-[100px]">
                      {ch.title.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            <span className="text-[11px] font-mono text-slate-400 shrink-0">
              CH {currentChapter.chapterNumber} OF {story.chapters.length}
            </span>
          </div>

          {/* Chapter Body Content (Scrollable) */}
          <div className="p-6 md:p-8 overflow-y-auto space-y-6 text-slate-200">
            {/* Chapter Header */}
            <div className="space-y-2 border-b border-white/10 pb-4">
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono uppercase tracking-[0.2em]">
                <Calendar className="w-3.5 h-3.5" />
                <span>CHAPTER {currentChapter.chapterNumber} • {currentChapter.title}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-serif text-white tracking-wide">
                {currentChapter.headline}
              </h1>
              <p className="text-xs md:text-sm font-mono text-slate-400">
                {currentChapter.subtitle}
              </p>
            </div>

            {/* Narrative Columns with Archival Photo */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Narrative Text */}
              <div className="md:col-span-7 space-y-4 text-sm leading-relaxed text-slate-300 font-sans">
                {currentChapter.narrativeText.map((p, idx) => (
                  <p key={idx} className="tracking-wide">
                    {p}
                  </p>
                ))}

                {/* Key Facts Matrix */}
                {currentChapter.keyFacts && currentChapter.keyFacts.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400 block mb-2">
                      CHAPTER METRICS & EVENT LOG
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      {currentChapter.keyFacts.map((fact, idx) => (
                        <div
                          key={idx}
                          className="bg-white/5 p-2 rounded border border-white/5 space-y-0.5"
                        >
                          <div className="text-[10px] text-slate-400 uppercase truncate">
                            {fact.label}
                          </div>
                          <div className="text-amber-200 font-medium text-[11px] truncate">
                            {fact.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Archival Media & Engineering Insight Card */}
              <div className="md:col-span-5 space-y-4">
                {currentChapter.photoUrl && (
                  <div className="space-y-2 rounded-xl bg-black/40 border border-white/10 p-2 overflow-hidden shadow-lg">
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 border border-white/5">
                      <img
                        src={currentChapter.photoUrl}
                        alt={currentChapter.photoCaption || currentChapter.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to high-contrast graphic placeholder if local image missing
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      {currentChapter.photoNasaId && (
                        <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-amber-300 border border-amber-500/30">
                          {currentChapter.photoNasaId}
                        </div>
                      )}
                    </div>
                    {currentChapter.photoCaption && (
                      <p className="text-[11px] font-sans text-slate-400 italic px-1 leading-snug">
                        {currentChapter.photoCaption}
                      </p>
                    )}
                  </div>
                )}

                {/* Engineering Insight Callout */}
                {currentChapter.engineeringInsight && (
                  <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1.5">
                    <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>ENGINEERING ARCHIVE INSIGHT</span>
                    </div>
                    <p className="text-xs text-amber-200/90 leading-relaxed font-sans">
                      {currentChapter.engineeringInsight}
                    </p>
                  </div>
                )}

                {/* 3D Surface Telemetry Cue Card */}
                {currentChapter.cameraCue && (
                  <div className="p-3 rounded-xl bg-sky-950/20 border border-sky-500/30 text-xs font-mono space-y-1">
                    <div className="flex items-center justify-between text-sky-300">
                      <span className="flex items-center space-x-1.5 uppercase tracking-wider text-[11px]">
                        <Compass className="w-3.5 h-3.5" />
                        <span>SYNCHRONIZED PLANETARY POV</span>
                      </span>
                      <span className="text-[10px] text-sky-400">
                        {currentChapter.cameraCue.lat.toFixed(4)}°, {currentChapter.cameraCue.lon.toFixed(4)}°
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      The 3D planetary globe in the background has navigated to match this chapter’s historical event location.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chapter Footer Navigation */}
          <footer className="border-t border-white/10 bg-black/50 px-6 py-4 flex items-center justify-between shrink-0">
            <button
              onClick={goToPrevChapter}
              disabled={currentChapterIndex === 0}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-mono text-xs tracking-wider uppercase transition-all ${
                currentChapterIndex === 0
                  ? 'text-slate-400 bg-white/5 cursor-not-allowed'
                  : 'text-white bg-white/10 hover:bg-white/15 border border-white/10'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>PREVIOUS CHAPTER</span>
            </button>

            {/* Stepper Dots */}
            <div className="hidden sm:flex items-center space-x-1.5">
              {story.chapters.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => selectChapter(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    idx === currentChapterIndex
                      ? 'bg-amber-400 w-6'
                      : idx < currentChapterIndex
                      ? 'bg-emerald-400/60'
                      : 'bg-white/20'
                  }`}
                  title={`Go to Chapter ${idx + 1}`}
                />
              ))}
            </div>

            {currentChapterIndex < story.chapters.length - 1 ? (
              <button
                onClick={goToNextChapter}
                className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-semibold tracking-wider uppercase shadow-lg transition-all"
              >
                <span>NEXT CHAPTER</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => onOpenHardwareInspection(story.id)}
                className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-semibold tracking-wider uppercase shadow-lg transition-all"
              >
                <span>INSPECT FINAL HARDWARE (3D)</span>
                <Cpu className="w-4 h-4" />
              </button>
            )}
          </footer>
        </div>
      )}

      {/* Minimized Dock Bar */}
      {isMinimized && (
        <div className="pointer-events-auto w-full max-w-2xl mx-auto my-auto bg-slate-950/90 backdrop-blur-md border border-white/15 rounded-xl px-5 py-3 shadow-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div className="text-xs font-mono">
              <span className="text-amber-400 font-semibold">
                CHAPTER {currentChapter.chapterNumber}:
              </span>{' '}
              <span className="text-white">{currentChapter.headline}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={goToPrevChapter}
              disabled={currentChapterIndex === 0}
              className="p-1 rounded bg-white/5 hover:bg-white/10 text-white disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToNextChapter}
              disabled={currentChapterIndex === story.chapters.length - 1}
              className="p-1 rounded bg-white/5 hover:bg-white/10 text-white disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsMinimized(false)}
              className="px-3 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono uppercase tracking-wider"
            >
              EXPAND
            </button>
          </div>
        </div>
      )}

      {/* Bottom Hint Footer */}
      <footer className="pointer-events-auto flex items-center justify-center w-full max-w-xl mx-auto py-1 text-slate-400 font-mono text-[11px] bg-slate-950/60 backdrop-blur-sm rounded-full border border-white/5">
        <span>Use Left / Right Arrows to navigate • Space to advance • Esc to exit</span>
      </footer>
    </div>
  );
};
