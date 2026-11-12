import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Play, Pause, ArrowRight, ShieldCheck } from 'lucide-react';
import { useExperienceStore } from '../../store/useExperienceStore';
import { ARTIFACTS } from '../../data/artifacts';
import { soundManager } from '../../audio/SoundManager';

export const ScreenDocumentary: React.FC = () => {
  const selectedArtifactId = useExperienceStore((s) => s.selectedArtifactId);
  const activeChapterIndex = useExperienceStore((s) => s.activeStoryChapterIndex);
  const nextStoryChapter = useExperienceStore((s) => s.nextStoryChapter);
  const prevStoryChapter = useExperienceStore((s) => s.prevStoryChapter);
  const setStoryChapter = useExperienceStore((s) => s.setStoryChapter);
  const enterLegacy = useExperienceStore((s) => s.enterLegacy);
  const returnToArtifactDetails = useExperienceStore((s) => s.returnToArtifactDetails);
  const returnToExhibition = useExperienceStore((s) => s.returnToExhibition);

  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const artifact = selectedArtifactId ? ARTIFACTS[selectedArtifactId] : null;
  const chapters = artifact ? artifact.storyChapters : [];
  const currentChapter = chapters[activeChapterIndex] || chapters[0];

  const isLastChapter = activeChapterIndex === chapters.length - 1;

  // Sound cue on chapter change
  useEffect(() => {
    if (currentChapter?.audioFrequency) {
      soundManager.playArtifactChime(currentChapter.audioFrequency);
    }
  }, [activeChapterIndex, currentChapter]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        if (!isLastChapter) nextStoryChapter();
        else enterLegacy();
      } else if (e.key === 'ArrowLeft') {
        prevStoryChapter();
      } else if (e.key === 'Escape') {
        returnToArtifactDetails();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isLastChapter, nextStoryChapter, prevStoryChapter, enterLegacy, returnToArtifactDetails]);

  // Optional auto-play progression
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAutoPlaying && !isLastChapter) {
      timer = setTimeout(() => {
        nextStoryChapter();
      }, 9000);
    }
    return () => clearTimeout(timer);
  }, [isAutoPlaying, activeChapterIndex, isLastChapter, nextStoryChapter]);

  if (!artifact || !currentChapter) return null;

  return (
    <div className="fixed inset-0 z-40 bg-void text-starlight overflow-hidden select-none flex flex-col justify-between">
      {/* 1. FULL-SCREEN DOCUMENTARY BACKDROP (ARCHIVAL NASA PHOTOGRAPHY) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentChapter.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.55, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full"
          >
            <img
              src={currentChapter.archivalImage}
              alt={currentChapter.imageCaption}
              className="w-full h-full object-cover filter brightness-75 contrast-110"
            />
          </motion.div>
        </AnimatePresence>

        {/* Cinematic Vignette & Readability Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-void/90 via-void/50 to-transparent" />
      </div>

      {/* 2. TOP DOCUMENTARY HEADER */}
      <div className="relative z-10 p-6 md:px-14 md:py-8 flex items-center justify-between border-b border-starlight/10">
        <div className="flex items-center space-x-4 md:space-x-5">
          <button
            type="button"
            onClick={returnToArtifactDetails}
            className="inline-flex items-center space-x-2 text-xs font-mono tracking-[0.16em] text-starlight/75 hover:text-gold transition-colors uppercase"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>ARTIFACT</span>
          </button>

          <span className="text-starlight/25 font-mono text-xs">/</span>

          <div className="flex items-center space-x-3">
            <span className="font-mono text-xs uppercase tracking-wider text-gold font-medium">
              {artifact.name}
            </span>
            <span className="text-starlight/30 hidden sm:inline">•</span>
            <span className="font-mono text-xs tracking-wider text-starlight/70 hidden sm:inline">
              DOCUMENTARY STORY
            </span>
          </div>
        </div>

        {/* Controls: Play/Pause, Back to Exhibition */}
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-space-800/90 hover:bg-space-700 border border-starlight/15 text-xs font-mono tracking-wider text-starlight transition-colors"
          >
            {isAutoPlaying ? <Pause className="w-3 h-3 text-gold" /> : <Play className="w-3 h-3 text-gold" />}
            <span className="hidden sm:inline font-medium">{isAutoPlaying ? 'PAUSE' : 'AUTO-PLAY'}</span>
          </button>

          <button
            type="button"
            onClick={returnToExhibition}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-space-800/90 hover:bg-space-700 border border-starlight/15 text-xs font-mono tracking-wider text-starlight transition-colors"
            title="Return to Exhibition"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden md:inline">EXHIBITION</span>
          </button>
        </div>
      </div>

      {/* 3. CENTER EDITORIAL STORY SECTION */}
      <div className="relative z-10 px-8 md:px-16 max-w-4xl my-auto space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentChapter.id}
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -25 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            {/* Chapter Header */}
            <div className="flex items-center space-x-3 text-xs font-mono tracking-wider text-gold">
              <span>CHAPTER {currentChapter.chapterNumber}</span>
              <span className="text-starlight/40">—</span>
              <span>{currentChapter.chapterTitle}</span>
            </div>

            {/* Headline */}
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-starlight tracking-tight leading-tight">
              {currentChapter.headline}
            </h2>

            {/* Narrative text */}
            <p className="font-sans text-base sm:text-lg text-starlight/90 leading-relaxed font-light max-w-3xl">
              {currentChapter.narrative}
            </p>

            {/* Historical Context Callout */}
            <div className="p-4 bg-space-800/80 border-l-2 border-gold max-w-2xl">
              <span className="block font-mono text-xs tracking-wider text-gold mb-1">
                HISTORICAL CONTEXT
              </span>
              <p className="font-sans text-xs sm:text-sm text-starlight/80 italic font-light">
                {currentChapter.historicalContext}
              </p>
            </div>

            {/* Key Metric Tag if present */}
            {currentChapter.keyMetric && (
              <div className="inline-flex items-center space-x-3 px-4 py-2 bg-space-800/90 border border-starlight/15 font-mono text-xs">
                <span className="text-starlight/60">{currentChapter.keyMetric.label}:</span>
                <span className="text-gold font-bold">{currentChapter.keyMetric.value}</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 4. BOTTOM BAR: CAPTION, CHAPTER NAVIGATION & PROGRESS */}
      <div className="relative z-10 p-8 md:p-12 border-t border-starlight/10 bg-void/90 backdrop-blur-sm space-y-4">
        {/* Archival Photo Caption */}
        <div className="text-xs font-mono text-starlight/70 flex items-center space-x-2">
          <ShieldCheck className="w-3.5 h-3.5 text-gold flex-shrink-0" />
          <span className="line-clamp-1">ARCHIVAL RECORD: {currentChapter.imageCaption}</span>
        </div>

        {/* Progress Timeline & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Chapter Step Indicators */}
          <div className="flex items-center space-x-2">
            {chapters.map((ch, idx) => (
              <button
                key={ch.id}
                onClick={() => setStoryChapter(idx)}
                className="group py-2 flex flex-col items-center focus:outline-none"
              >
                <div
                  className={`h-1 transition-all duration-300 ${
                    idx === activeChapterIndex
                      ? 'w-10 bg-gold'
                      : idx < activeChapterIndex
                      ? 'w-6 bg-starlight/80'
                      : 'w-6 bg-space-600 group-hover:bg-space-500'
                  }`}
                />
              </button>
            ))}
            <span className="font-mono text-xs text-starlight/70 ml-2 font-medium">
              0{activeChapterIndex + 1} / 0{chapters.length}
            </span>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={prevStoryChapter}
              disabled={activeChapterIndex === 0}
              className={`p-3 bg-space-800 border border-starlight/15 transition-colors ${
                activeChapterIndex === 0
                  ? 'opacity-30 cursor-not-allowed text-starlight/40'
                  : 'hover:bg-space-700 text-starlight'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {isLastChapter ? (
              <button
                onClick={enterLegacy}
                className="px-6 py-3 bg-gold text-void font-mono text-xs uppercase tracking-wider font-bold hover:bg-gold-light transition-colors flex items-center space-x-2"
              >
                <span>PROCEED TO LEGACY</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={nextStoryChapter}
                className="px-6 py-3 bg-starlight text-void font-mono text-xs uppercase tracking-wider font-semibold hover:bg-gold transition-colors flex items-center space-x-2"
              >
                <span>NEXT CHAPTER</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
