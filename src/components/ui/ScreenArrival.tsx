import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  ArrowUpRight,
  ChevronDown,
  Globe2,
  Radio,
  ArrowRight,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { navigation } from '../../navigation/navigationController';
import { soundManager } from '../../audio/SoundManager';
import { useExperienceStore } from '../../store/useExperienceStore';
import { LanguageSwitcher } from './LanguageSwitcher';

const ScreenArtifactDetails = lazy(() =>
  import('./ScreenArtifactDetails').then((m) => ({ default: m.ScreenArtifactDetails }))
);

interface Chapter {
  id: string;
  label: string;
  number: string;
}

const CHAPTERS: Chapter[] = [
  { id: 'scene-prologue', label: 'ARRIVAL', number: '01' },
  { id: 'scene-story', label: 'THE STORY', number: '02' },
  { id: 'scene-reveals', label: 'REVEALS', number: '03' },
  { id: 'scene-destinations', label: 'DESTINATIONS', number: '04' },
];

export const ScreenArrival: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [activeChapter, setActiveChapter] = useState<string>('scene-prologue');
  const activeChapterRef = useRef<string>('scene-prologue');
  const [inspectingArtifactId, setInspectingArtifactId] = useState<string | null>(null);

  const reducedMotion = useExperienceStore((s) => s.reducedMotion);
  const toggleTeacherMode = useExperienceStore((s) => s.toggleTeacherMode);
  const setArrivalHeroVisible = useExperienceStore((s) => s.setArrivalHeroVisible);

  // Restore scroll position or target chapter if returning from museum/exhibition
  useEffect(() => {
    const targetChapter = navigation.getLastArrivalChapter();
    const targetScrollTop = navigation.getLastArrivalScrollTop();

    if (targetChapter && targetChapter !== 'scene-prologue') {
      const timer = setTimeout(() => {
        const el = document.getElementById(targetChapter);
        if (el) {
          el.scrollIntoView({ behavior: 'auto' });
        } else if (containerRef.current && targetScrollTop > 0) {
          containerRef.current.scrollTop = targetScrollTop;
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, []);

  // High-performance scroll listener with rAF coalescing and direct DOM style updates
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let ticking = false;
    let cachedOffsets: { id: string; top: number }[] = [];

    const updateOffsets = () => {
      cachedOffsets = CHAPTERS.map((ch) => {
        const el = document.getElementById(ch.id);
        return { id: ch.id, top: el ? el.offsetTop : 0 };
      });
    };

    updateOffsets();
    window.addEventListener('resize', updateOffsets, { passive: true });

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          ticking = false;
          if (!container) return;

          const { scrollTop, scrollHeight, clientHeight } = container;
          const maxScroll = scrollHeight - clientHeight;
          const progress = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;

          // Direct DOM manipulation for zero-react-render progress updates
          if (progressBarRef.current) {
            progressBarRef.current.style.width = `${progress}%`;
          }

          // Throttle 3D background rendering when scrolled down into opaque editorial sections
          const heroInView = scrollTop < clientHeight * 0.85;
          setArrivalHeroVisible(heroInView);

          // Determine active section using cached offsets
          const currentScrollMiddle = scrollTop + clientHeight * 0.4;
          for (let i = cachedOffsets.length - 1; i >= 0; i--) {
            if (currentScrollMiddle >= cachedOffsets[i].top) {
              const matchedId = cachedOffsets[i].id;
              if (activeChapterRef.current !== matchedId) {
                activeChapterRef.current = matchedId;
                setActiveChapter(matchedId);
                navigation.syncArrivalChapter(matchedId, scrollTop);
              }
              break;
            }
          }
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateOffsets);
    };
  }, [setArrivalHeroVisible]);

  const scrollToChapter = (id: string) => {
    soundManager.playClick();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
      activeChapterRef.current = id;
      setActiveChapter(id);
      navigation.syncArrivalChapter(id);
    }
  };

  const handleSelectMoon = () => {
    soundManager.playNavMoonSelected();
    if (containerRef.current) {
      navigation.syncArrivalChapter('scene-destinations', containerRef.current.scrollTop);
    }
    navigation.toDestination('moon');
  };

  const handleSelectMars = () => {
    soundManager.playNavMarsSelected();
    if (containerRef.current) {
      navigation.syncArrivalChapter('scene-destinations', containerRef.current.scrollTop);
    }
    navigation.toDestination('mars');
  };

  const handleOpen3DSelector = () => {
    soundManager.playNavArrivalToDestinations();
    if (containerRef.current) {
      navigation.syncArrivalChapter('scene-destinations', containerRef.current.scrollTop);
    }
    navigation.toDestinations();
  };

  const handleOpenSpecimen = (id: string) => {
    soundManager.playNavArtifactSelect();
    useExperienceStore.setState({ selectedArtifactId: id });
    setInspectingArtifactId(id);
  };

  const handleCloseSpecimen = () => {
    soundManager.playNavReturnToExhibition();
    useExperienceStore.setState({ selectedArtifactId: null });
    setInspectingArtifactId(null);
  };

  return (
    <div
      ref={containerRef}
      className="relative z-30 w-full h-full overflow-y-auto overflow-x-hidden scroll-smooth bg-transparent text-bone select-none"
    >
      {/* 1. TOP PROGRESS HAIRLINE */}
      <div className="fixed top-0 left-0 right-0 h-[2px] z-50 bg-meteorite/30 pointer-events-none">
        <div
          ref={progressBarRef}
          style={{ width: '0%' }}
          className="h-full bg-gradient-to-r from-signal via-bone to-signal transition-[width] duration-75 ease-out shadow-[0_0_8px_rgba(240,90,56,0.6)]"
        />
      </div>

      {/* 2. MINIMAL FIXED TOP HEADER HUD WITH EXACTLY ONE PRIMARY SKIP ACTION */}
      <header className="fixed top-0 left-0 right-0 z-40 px-6 sm:px-12 py-5 flex items-center justify-between bg-obsidian/95 border-b border-meteorite/20">
        <div className="flex items-center space-x-3.5">
          <span className="w-2 h-2 rounded-full bg-signal animate-pulse shadow-[0_0_8px_#F05A38]" />
          <span className="font-mono text-xs uppercase tracking-widest text-bone font-semibold">
            ORBITAL
          </span>
          <span className="hidden sm:inline text-meteorite font-mono text-xs">/</span>
          <span className="hidden sm:inline font-mono text-[10px] tracking-wider text-stone-muted uppercase">
            HISTORICAL SPACE ARCHAEOLOGY
          </span>
        </div>

        {/* Right side: Active Chapter Indicator, Teacher Mode, Language Switcher + Skip Action */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="hidden lg:flex items-center space-x-2 text-xs font-mono tracking-wider text-stone-muted">
            <Radio className="w-3.5 h-3.5 text-signal animate-pulse" />
            <span className="text-bone">
              {CHAPTERS.find((c) => c.id === activeChapter)?.number}.{' '}
              {CHAPTERS.find((c) => c.id === activeChapter)?.label}
            </span>
          </div>

          <LanguageSwitcher />

          <button
            type="button"
            onClick={() => toggleTeacherMode(true)}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-sm border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[10px] font-mono uppercase tracking-wider transition-colors shadow-sm"
            title="Classroom assignments, lesson sheets, and LMS quiz export"
          >
            <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
            <span>TEACHER MODE</span>
          </button>

          <button
            type="button"
            onClick={() => scrollToChapter('scene-destinations')}
            className="group px-3.5 py-1.5 rounded-sm border border-meteorite hover:border-signal/80 bg-surface-raised/40 hover:bg-signal text-bone hover:text-obsidian transition-all duration-200 text-xs font-mono uppercase tracking-wider flex items-center space-x-2"
            title="Jump directly to Destination Selection"
          >
            <span>SKIP TO MUSEUM</span>
            <ArrowRight className="w-3.5 h-3.5 text-signal group-hover:text-obsidian group-hover:translate-x-0.5 transition-transform duration-200" />
          </button>
        </div>
      </header>

      {/* 3. RIGHT FLOATING CHAPTER RAIL (Desktop) */}
      <nav
        aria-label="Story Chapters"
        className="hidden md:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col items-end space-y-3 pointer-events-auto"
      >
        {CHAPTERS.map((chap) => {
          const isActive = activeChapter === chap.id;
          return (
            <button
              key={chap.id}
              type="button"
              onClick={() => scrollToChapter(chap.id)}
              className="group flex items-center space-x-2.5 py-1 focus:outline-none"
            >
              <span
                className={`font-mono text-[10px] tracking-widest uppercase transition-all duration-200 ${
                  isActive
                    ? 'text-signal opacity-100 font-semibold'
                    : 'text-stone-muted opacity-0 group-hover:opacity-80'
                }`}
              >
                {chap.number} {chap.label}
              </span>
              <span
                className={`block transition-all duration-300 rounded-full ${
                  isActive
                    ? 'w-2.5 h-2.5 bg-signal shadow-[0_0_8px_#F05A38]'
                    : 'w-1.5 h-1.5 bg-meteorite group-hover:bg-bone'
                }`}
              />
            </button>
          );
        })}
      </nav>

      {/* =========================================================================
          BEAT 01 — ARRIVAL (PROLOGUE)
          ========================================================================= */}
      <section
        id="scene-prologue"
        className="relative min-h-screen flex flex-col justify-between p-8 md:p-16 pt-28 md:pt-36 overflow-hidden"
      >
        {/* Left-side subtle atmospheric scrim to ensure 100% typography contrast while preserving 3D canvas */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-obsidian/90 via-obsidian/45 to-transparent z-0" />

        {/* Bottom cinematic transition veil into Scene 2 */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-obsidian via-obsidian/60 to-transparent z-10" />

        <div className="relative z-10 max-w-xl lg:max-w-2xl space-y-8 my-auto">
          <motion.div
            initial={{ opacity: 0, y: reducedMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0.2 : 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            <div className="inline-flex items-center space-x-2.5 px-3 py-1 bg-surface-raised/70 border border-meteorite rounded-sm backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-signal shadow-[0_0_8px_#F05A38]" />
              <span className="font-mono text-[11px] tracking-widest text-signal uppercase font-medium">
                INTERACTIVE SPACE ARTIFACT ARCHIVE
              </span>
            </div>

            <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl tracking-tight leading-[0.94] text-bone font-normal">
              THEY WENT BEYOND.
              <br />
              <span className="italic font-light text-bone/90">THEY LEFT A LEGACY.</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: reducedMotion ? 0 : 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0.2 : 1.2, delay: reducedMotion ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-prose text-stone-secondary font-sans text-base sm:text-lg leading-relaxed font-light"
          >
            An interactive space documentary of the machines that transformed human
            understanding. Discover the landers, rovers, and scientific instruments resting
            undisturbed under the skies of the Moon and Mars.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: reducedMotion ? 0 : 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0.2 : 1.2, delay: reducedMotion ? 0 : 0.4 }}
            className="flex flex-wrap items-center gap-3 pt-2"
          >
            {/* Flagship Story Mode Button for Youth & School-Age Explorers */}
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                navigation.toDestinations();
              }}
              className="group px-7 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold transition-all duration-300 shadow-xl shadow-amber-500/25 flex items-center space-x-3 text-xs font-mono uppercase tracking-wider"
              title="Interactive storytelling about forgotten rovers, landers and relics"
            >
              <Sparkles className="w-4 h-4 text-black group-hover:rotate-12 transition-transform duration-300" />
              <span>LAUNCH STORY MODE</span>
              <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1 transition-transform duration-200" />
            </button>

            <button
              type="button"
              onClick={() => scrollToChapter('scene-story')}
              className="group px-6 py-4 bg-signal/90 text-obsidian hover:bg-bone transition-all duration-300 font-semibold shadow-lg shadow-signal/20 flex items-center space-x-2.5 text-xs font-mono uppercase tracking-wider"
            >
              <Compass className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
              <span>DISCOVER PROLOGUE</span>
              <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform duration-200" />
            </button>

            <button
              type="button"
              onClick={handleOpen3DSelector}
              className="px-5 py-4 border border-meteorite hover:border-signal bg-surface-raised/40 hover:bg-surface text-bone transition-all duration-300 font-mono text-xs uppercase tracking-wider flex items-center space-x-2"
            >
              <Globe2 className="w-4 h-4 text-signal" />
              <span>3D ORBITAL MAP</span>
            </button>
          </motion.div>
        </div>

        {/* Scroll down prompt */}
        <div className="relative z-10 pt-8 flex flex-col sm:flex-row items-start sm:items-end justify-between text-xs font-mono tracking-wider text-stone-muted border-t border-meteorite/30">
          <div className="flex items-center space-x-4">
            <span className="text-signal">01. THE MOON</span>
            <span className="text-meteorite">•</span>
            <span className="text-bone">02. MARS</span>
            <span className="text-meteorite">•</span>
            <span>8 DOCUMENTED ARTIFACT SITES</span>
          </div>

          <div
            onClick={() => scrollToChapter('scene-story')}
            className="mt-4 sm:mt-0 flex items-center space-x-2 text-stone-secondary hover:text-signal cursor-pointer transition-colors duration-200"
          >
            <span>SCROLL TO EXPLORE</span>
            <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
          </div>
        </div>
      </section>

      {/* =========================================================================
          BEAT 02 — THE STORY (THE SACRIFICIAL PHYSICS OF EXPLORATION)
          ========================================================================= */}
      <section
        id="scene-story"
        className="relative min-h-screen flex items-center p-8 md:p-16 py-28 bg-gradient-to-b from-obsidian via-obsidian/95 to-obsidian"
      >
        <div className="max-w-5xl mx-auto space-y-12 w-full">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <span className="w-4 h-[1px] bg-signal" />
              <span className="font-mono text-xs uppercase tracking-widest text-signal font-medium">
                CHAPTER 02 · THE STORY
              </span>
            </div>

            <h2 className="font-serif text-4xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.05] text-bone font-normal max-w-4xl">
              &ldquo;Humanity reached for worlds beyond its own.&rdquo;
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 items-start">
            <div className="md:col-span-7 space-y-6 text-stone-secondary font-light text-base sm:text-lg leading-relaxed max-w-prose">
              <p>
                In the second half of the twentieth century, human beings broke free of
                Earth&apos;s gravitational sanctuary. What began as a contest between superpowers
                evolved into the greatest engineering journey in civilization&apos;s history.
              </p>
              <p>
                Rocket physics is uncompromising. Every gram of return mass requires an exponential
                propellant penalty. To launch astronauts back into lunar orbit, lower descent
                stages served as sacrificial launch pads. On Mars, solar-powered rovers continued
                rolling years past their design lifespans until dust storms engulfed their panels.
              </p>
              <p className="text-bone/90 font-normal">
                When their propellants were exhausted and communications silenced, they did not
                vanish. They became humanity&apos;s farthest outposts.
              </p>

              {/* Curatorial Note by Dr. Mae Vance */}
              <div className="p-5 bg-surface-raised/40 border border-meteorite/60 rounded-sm flex items-start space-x-4 pt-4 mt-2">
                <div className="w-11 h-11 rounded-full overflow-hidden border border-meteorite shrink-0 bg-surface">
                  <img
                    src="/characters/mae-vance/explaining.png"
                    alt="Dr. Mae Vance, Museum Curator"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center space-x-2 font-mono text-[10px] tracking-wider text-signal uppercase">
                    <span className="font-semibold">DR. MAE VANCE</span>
                    <span className="text-stone-muted">·</span>
                    <span className="text-stone-muted">LEAD CURATOR</span>
                  </div>
                  <p className="font-sans text-stone-secondary font-light italic leading-relaxed">
                    &ldquo;When humanity leaves machines beyond Earth, we leave behind our greatest ambition. In the lunar vacuum, bootprints and descent stages endure indefinitely. On Mars, the dust tells the story of survival. Welcome to ORBITAL.&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* Integrated Editorial Telemetry Strip with Verified Primary-Source NASA Metrics */}
            <div className="md:col-span-5 flex flex-col space-y-6 pl-0 md:pl-8 border-l-0 md:border-l border-meteorite/50">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 font-mono text-[10px] tracking-[0.22em] text-lunar uppercase font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-lunar" />
                  <span>SURVIVAL RECORD IN VACUO</span>
                </div>
                <div className="font-serif text-3xl sm:text-4xl lg:text-5xl text-bone font-normal tracking-tight">
                  55+ <span className="text-lg sm:text-xl text-stone-secondary font-light">Years in Situ</span>
                </div>
                <p className="font-sans text-xs text-stone-muted leading-relaxed font-light">
                  Tranquility Base hardware and human bootprints remain undisturbed in the airless lunar vacuum since July 20, 1969 (NASA SP-214).
                </p>
              </div>

              <div className="w-full h-[1px] bg-meteorite/40" />

              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 font-mono text-[10px] tracking-[0.22em] text-signal uppercase font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal" />
                  <span>DOCUMENTED HERITAGE SITES</span>
                </div>
                <div className="font-serif text-3xl sm:text-4xl lg:text-5xl text-bone font-normal tracking-tight">
                  8 <span className="text-lg sm:text-xl text-stone-secondary font-light">Curated Sites</span>
                </div>
                <p className="font-sans text-xs text-stone-muted leading-relaxed font-light">
                  Historic landing and exploration sites across the Moon and Mars with verified cartographic coordinates (NASA PDS Cartography Group).
                </p>
              </div>

              <div className="w-full h-[1px] bg-meteorite/40" />

              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 font-mono text-[10px] tracking-[0.22em] text-signal uppercase font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal" />
                  <span>LONGEST OFF-WORLD TRAVERSE</span>
                </div>
                <div className="font-serif text-3xl sm:text-4xl lg:text-5xl text-bone font-normal tracking-tight">
                  45.16 <span className="text-lg sm:text-xl text-stone-secondary font-light">Kilometers</span>
                </div>
                <p className="font-sans text-xs text-stone-muted leading-relaxed font-light">
                  Record distance driven across another planetary body by the MER-B Opportunity Rover across Meridiani Planum (NASA JPL-Pub 19-3).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          BEAT 03 — ARTIFACT REVEALS (TWO LANDMARK MONUMENTS)
          ========================================================================= */}
      <section
        id="scene-reveals"
        className="relative min-h-screen flex flex-col justify-center p-8 md:p-16 py-28 bg-obsidian border-t border-meteorite/30"
      >
        <div className="max-w-6xl mx-auto space-y-16 w-full">
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center space-x-3">
              <span className="w-4 h-[1px] bg-signal" />
              <span className="font-mono text-xs uppercase tracking-widest text-signal font-medium">
                CHAPTER 03 · ARTIFACT REVEALS
              </span>
            </div>

            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-bone tracking-tight leading-tight">
              Some machines completed their missions.
              <br />
              <span className="text-stone-secondary italic">Some became silent witnesses.</span>
              <br />
              All became part of our history.
            </h2>

            <p className="text-stone-secondary text-base sm:text-lg font-light leading-relaxed pt-2">
              Across the Moon and Mars, humanity has left two fundamentally distinct classes of
              exploration hardware: intentionally placed landing platforms designed to anchor liftoffs
              or listen across decades, and robotic explorers that ventured miles beyond their design
              lifespans until nature claimed their solar arrays.
            </p>
          </div>

          {/* Two Landmark Featured Specimen Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* 1. Apollo 11 Eagle Descent Stage (The Moon) */}
            <div className="group relative border border-meteorite/70 bg-surface-raised/40 hover:bg-surface-raised hover:border-lunar transition-all duration-300 p-8 rounded-sm flex flex-col justify-between space-y-6 shadow-xl">
              <div className="space-y-5">
                <div className="relative aspect-[16/10] overflow-hidden rounded-sm border border-meteorite/50 bg-surface">
                  <img
                    src="/images/apollo11_surface.jpg"
                    alt="Apollo 11 Eagle Descent Stage at Tranquility Base"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out brightness-95 group-hover:brightness-100"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-obsidian/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-obsidian/85 backdrop-blur-sm border border-lunar/50 text-[10px] font-mono text-lunar font-semibold rounded-sm">
                    DELIBERATELY ABANDONED HARDWARE
                  </div>
                  <div className="absolute bottom-3 left-3 text-[10px] font-mono text-stone-muted">
                    NASA AS11-40-5921 · JULY 20, 1969
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between font-mono text-[11px] tracking-[0.18em] uppercase text-lunar font-semibold">
                    <span>APOLLO 11 · LM-5</span>
                    <span className="text-stone-muted">THE MOON</span>
                  </div>

                  <h3 className="font-serif text-2xl sm:text-3xl text-bone group-hover:text-lunar transition-colors">
                    Eagle Descent Stage
                  </h3>

                  <p className="text-stone-secondary text-xs sm:text-sm leading-relaxed font-light">
                    The gold-wrapped lower chassis that cushioned humanity&apos;s first lunar landing
                    and served as the stationary launch pad when Neil Armstrong and Buzz Aldrin
                    blasted off back into orbit.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-meteorite/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                <div className="text-stone-muted">
                  <span className="block text-bone font-medium">Mare Tranquillitatis</span>
                  <span className="text-[10px]">0.67408° N, 23.47297° E</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenSpecimen('apollo11_eagle')}
                  className="px-4 py-2 border border-meteorite hover:border-lunar text-lunar hover:bg-lunar hover:text-obsidian transition-colors uppercase tracking-wider text-[11px] font-semibold flex items-center space-x-2 self-start sm:self-auto rounded-sm"
                >
                  <span>EXAMINE SPECIMEN</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 2. MER-B Opportunity Rover (Mars) */}
            <div className="group relative border border-meteorite/70 bg-surface-raised/40 hover:bg-surface-raised hover:border-signal transition-all duration-300 p-8 rounded-sm flex flex-col justify-between space-y-6 shadow-xl">
              <div className="space-y-5">
                <div className="relative aspect-[16/10] overflow-hidden rounded-sm border border-meteorite/50 bg-surface">
                  <img
                    src="/images/exhibits/opportunity.jpg"
                    alt="Opportunity Rover on Mars"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out brightness-95 group-hover:brightness-100"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-obsidian/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#1A0D0C]/90 backdrop-blur-sm border border-signal/50 text-[10px] font-mono text-signal font-semibold rounded-sm">
                    MISSION-ENDED ROBOTIC EXPLORER
                  </div>
                  <div className="absolute bottom-3 left-3 text-[10px] font-mono text-stone-muted">
                    NASA JPL MER-B · 2004–2018
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between font-mono text-[11px] tracking-[0.18em] uppercase text-signal font-semibold">
                    <span>MER-B ROVER</span>
                    <span className="text-stone-muted">MARS</span>
                  </div>

                  <h3 className="font-serif text-2xl sm:text-3xl text-bone group-hover:text-signal transition-colors">
                    Opportunity Rover
                  </h3>

                  <p className="text-stone-secondary text-xs sm:text-sm leading-relaxed font-light">
                    Engineered for a 90-sol design lifespan, Opportunity explored for fourteen and a
                    half years, completing a historic 45.16-kilometer marathon before a planet-wide
                    dust storm obscured its solar arrays.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-meteorite/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                <div className="text-stone-muted">
                  <span className="block text-bone font-medium">Perseverance Valley</span>
                  <span className="text-[10px]">Endeavour Rim · 2.215° S, 354.475° E</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenSpecimen('opportunity')}
                  className="px-4 py-2 border border-meteorite hover:border-signal text-signal hover:bg-signal hover:text-obsidian transition-colors uppercase tracking-wider text-[11px] font-semibold flex items-center space-x-2 self-start sm:self-auto rounded-sm"
                >
                  <span>EXAMINE SPECIMEN</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          BEAT 04 — DESTINATION SELECTION (TERMINAL BEAT OF GUIDED INTRODUCTION)
          ========================================================================= */}
      <section
        id="scene-destinations"
        className="relative min-h-screen flex flex-col justify-between p-8 md:p-16 py-28 bg-obsidian border-t border-meteorite/40"
      >
        <div className="max-w-6xl mx-auto w-full space-y-16 my-auto">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="font-mono text-xs text-signal tracking-widest uppercase block font-medium">
              CHAPTER 04 · DESTINATION SELECTION
            </span>

            <h2 className="font-serif text-5xl sm:text-7xl text-bone tracking-tight leading-[0.98]">
              THEIR MISSIONS ENDED.
              <br />
              <span className="italic font-light text-bone/90">THEIR STORIES REMAIN.</span>
            </h2>

            <p className="text-stone-secondary text-base sm:text-lg font-light leading-relaxed max-w-xl mx-auto">
              Select a world to step into the digital museum archive. Explore curated specimens,
              inspect 3D hardware, and examine orbital surface topography.
            </p>
          </div>

          {/* Dual Destination Planetary Portals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* The Moon Portal */}
            <div
              onClick={handleSelectMoon}
              className="group cursor-pointer relative overflow-hidden rounded-sm border border-meteorite/80 hover:border-lunar bg-surface-raised transition-all duration-500 shadow-2xl hover:shadow-[0_0_30px_rgba(222,178,117,0.15)] flex flex-col justify-between p-8 sm:p-10 min-h-[420px]"
            >
              {/* NASA Lunar Surface Photographic Backdrop */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <img
                  src="/images/apollo11_surface.jpg"
                  alt="Lunar Horizon"
                  className="w-full h-full object-cover object-center brightness-40 group-hover:brightness-50 group-hover:scale-105 transition-all duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/80 to-obsidian/30" />
                <div className="absolute inset-0 bg-gradient-to-b from-obsidian/50 via-transparent to-transparent" />
              </div>

              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center space-x-2 px-2.5 py-1 bg-obsidian/80 border border-lunar/40 rounded-sm font-mono text-[10px] tracking-[0.2em] text-lunar uppercase font-semibold">
                    <span>DESTINATION 01 · 384,400 KM</span>
                  </span>
                  <span className="font-mono text-[10px] text-stone-muted tracking-widest uppercase">AIRLESS VACUUM</span>
                </div>

                <div className="space-y-3">
                  <h3 className="font-serif text-4xl sm:text-5xl text-bone group-hover:text-lunar transition-colors duration-300 tracking-tight">
                    THE MOON
                  </h3>
                  <p className="text-stone-secondary text-sm font-light leading-relaxed max-w-sm">
                    Tranquility Base, Apollo Lunar Rovers, and ALSEP nuclear science packages
                    standing in eternal airless silence.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-meteorite/40 text-xs font-mono text-stone-muted">
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-lunar" />
                    <span>4 Documented Heritage Sites</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-lunar" />
                    <span>Apollo 11 Eagle 3D Hardware Model</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-lunar" />
                    <span>Curatorial Narration by Dr. Mae Vance</span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 pt-6 border-t border-meteorite/30 flex items-center justify-between text-xs font-mono uppercase tracking-[0.18em] text-lunar font-semibold">
                <span>ENTER MOON EXHIBITION</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
              </div>
            </div>

            {/* Mars Portal */}
            <div
              onClick={handleSelectMars}
              className="group cursor-pointer relative overflow-hidden rounded-sm border border-meteorite/80 hover:border-signal bg-surface-raised transition-all duration-500 shadow-2xl hover:shadow-[0_0_30px_rgba(240,90,56,0.18)] flex flex-col justify-between p-8 sm:p-10 min-h-[420px]"
            >
              {/* NASA Martian Surface Photographic Backdrop */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <img
                  src="/images/exhibits/opportunity.jpg"
                  alt="Martian Terrain"
                  className="w-full h-full object-cover object-center brightness-40 group-hover:brightness-50 group-hover:scale-105 transition-all duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#120706] via-[#1A0D0C]/85 to-[#090C10]/40" />
                <div className="absolute inset-0 bg-gradient-to-b from-obsidian/50 via-transparent to-transparent" />
              </div>

              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center space-x-2 px-2.5 py-1 bg-[#1A0D0C]/90 border border-signal/40 rounded-sm font-mono text-[10px] tracking-[0.2em] text-signal uppercase font-semibold">
                    <span>DESTINATION 02 · 225M KM</span>
                  </span>
                  <span className="font-mono text-[10px] text-stone-muted tracking-widest uppercase">IRON OXIDE ATMOSPHERE</span>
                </div>

                <div className="space-y-3">
                  <h3 className="font-serif text-4xl sm:text-5xl text-bone group-hover:text-signal transition-colors duration-300 tracking-tight">
                    MARS
                  </h3>
                  <p className="text-stone-secondary text-sm font-light leading-relaxed max-w-sm">
                    Sojourner, Opportunity, Spirit, and InSight resting under rust skies, towering
                    volcanoes, and planet-wide dust storms.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-meteorite/40 text-xs font-mono text-stone-muted">
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-signal" />
                    <span>4 Robotic Landers & Rovers</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-signal" />
                    <span>Opportunity 3D Hardware Model</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-signal" />
                    <span>Martian Surface Topography & Maps</span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 pt-6 border-t border-meteorite/30 flex items-center justify-between text-xs font-mono uppercase tracking-[0.18em] text-signal font-semibold">
                <span>ENTER MARS EXHIBITION</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
              </div>
            </div>
          </div>

          {/* Secondary 3D Orbital Globe Option */}
          <div className="text-center pt-4">
            <button
              type="button"
              onClick={handleOpen3DSelector}
              className="inline-flex items-center space-x-2.5 px-6 py-3 border border-meteorite hover:border-signal text-stone-secondary hover:text-bone text-xs font-mono uppercase tracking-wider transition-colors duration-200"
            >
              <Globe2 className="w-4 h-4 text-signal" />
              <span>OR OPEN 3D ORBITAL GLOBE SELECTOR</span>
            </button>
          </div>
        </div>

        {/* Museum Footer */}
        <footer className="pt-12 mt-12 border-t border-meteorite/40 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-stone-muted gap-4">
          <div>
            <span>ORBITAL · NASA SPACE APPS CHALLENGE 2026</span>
          </div>
          <div className="flex items-center space-x-6">
            <span>HISTORICAL ARTIFACT PRESERVATION</span>
            <span>DATA SOURCED FROM NASA PDS & NSSDC</span>
          </div>
        </footer>
      </section>

      {/* Inline Modal Specimen Overlay (if opened from Beat 3 story reveals) */}
      <AnimatePresence>
        {inspectingArtifactId && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              onClick={handleCloseSpecimen}
              className="fixed inset-0 bg-obsidian/85 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 min-h-screen"
            >
              <Suspense fallback={null}>
                <ScreenArtifactDetails onClose={handleCloseSpecimen} />
              </Suspense>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
