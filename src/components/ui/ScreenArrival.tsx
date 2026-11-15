import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  ArrowUpRight,
  ChevronDown,
  Globe2,
  Radio,
  Clock,
  MapPin,
  Sparkles,
  ChevronRight,
  Layers,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';
import { navigation } from '../../navigation/navigationController';
import { soundManager } from '../../audio/SoundManager';
import { useExperienceStore } from '../../store/useExperienceStore';
import { LanguageSwitcher } from './LanguageSwitcher';

interface Chapter {
  id: string;
  label: string;
  number: string;
}

const CHAPTERS: Chapter[] = [
  { id: 'scene-prologue', label: 'PROLOGUE', number: '01' },
  { id: 'scene-story', label: 'THE LEAP', number: '02' },
  { id: 'scene-machines', label: 'MONUMENTS', number: '03' },
  { id: 'scene-moon', label: 'THE MOON', number: '04' },
  { id: 'scene-mars', label: 'MARS', number: '05' },
  { id: 'scene-archive', label: 'ENTER ARCHIVE', number: '06' },
];

export const ScreenArrival: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [activeChapter, setActiveChapter] = useState<string>('scene-prologue');
  const activeChapterRef = useRef<string>('scene-prologue');
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);
  const toggleTeacherMode = useExperienceStore((s) => s.toggleTeacherMode);

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

          // Throttle 3D background rendering when scrolled down into opaque documentary sections
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
    }
  };

  const handleSelectMoon = () => {
    soundManager.playNavMoonSelected();
    navigation.toDestination('moon');
  };

  const handleSelectMars = () => {
    soundManager.playNavMarsSelected();
    navigation.toDestination('mars');
  };

  const handleOpen3DSelector = () => {
    soundManager.playNavArrivalToDestinations();
    navigation.toDestinations();
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

      {/* 2. FIXED TOP HEADER HUD */}
      <header className="fixed top-0 left-0 right-0 z-40 px-6 sm:px-12 py-5 flex items-center justify-between bg-obsidian/95 border-b border-meteorite/20">
        <div className="flex items-center space-x-3.5">
          <span className="w-2 h-2 rounded-full bg-signal animate-pulse shadow-[0_0_8px_#F05A38]" />
          <span className="font-mono text-xs uppercase tracking-widest text-bone font-semibold">
            AFTERLIGHT
          </span>
          <span className="hidden sm:inline text-meteorite font-mono text-xs">/</span>
          <span className="hidden sm:inline font-mono text-[10px] tracking-wider text-stone-muted uppercase">
            HISTORICAL SPACE ARCHAEOLOGY
          </span>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center space-x-3">
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
            onClick={() => scrollToChapter('scene-archive')}
            className="group px-3.5 py-1.5 rounded-sm border border-meteorite hover:border-signal/80 bg-surface-raised/40 hover:bg-signal text-bone hover:text-obsidian transition-all duration-200 text-xs font-mono uppercase tracking-wider flex items-center space-x-2"
          >
            <span>ENTER ARCHIVE</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-signal group-hover:text-obsidian group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
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
          SCENE 1 — THE OPENING SCENE (PROLOGUE)
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
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
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-prose text-stone-secondary font-sans text-base sm:text-lg leading-relaxed font-light"
          >
            An interactive space documentary of the machines that transformed human
            understanding. Discover the landers, rovers, and scientific instruments resting
            undisturbed under the skies of the Moon and Mars.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.4 }}
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
          SCENE 2 — THE STORY BEGINS (THE LEAP)
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
                CHAPTER 02 · THE LEAP
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
                Across hundreds of thousands and millions of kilometers of vacuum, we cast our
                scientific senses into the dark. We built machines capable of surviving radiation,
                absolute zero, and violent atmospheric entries to stand where humans could not yet
                walk.
              </p>
              <p className="text-bone/90 font-normal">
                When their propellants were exhausted and communications silenced, they did not
                vanish. They became humanity&apos;s farthest outposts.
              </p>
            </div>

            {/* Integrated Editorial Telemetry Strip */}
            <div className="md:col-span-5 flex flex-col space-y-6 pl-0 md:pl-8 border-l-0 md:border-l border-meteorite/50">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 font-mono text-[10px] tracking-[0.22em] text-signal uppercase font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal" />
                  <span>CUMULATIVE SURFACE MASS</span>
                </div>
                <div className="font-serif text-3xl sm:text-4xl lg:text-5xl text-bone font-normal tracking-tight">
                  200+ <span className="text-lg sm:text-xl text-stone-secondary font-light">Metric Tons</span>
                </div>
                <p className="font-sans text-xs text-stone-muted leading-relaxed font-light">
                  Combined mass of landers, rovers, and scientific payloads resting across the Moon and Mars.
                </p>
              </div>

              <div className="w-full h-[1px] bg-meteorite/40" />

              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 font-mono text-[10px] tracking-[0.22em] text-lunar uppercase font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-lunar" />
                  <span>SURVIVAL RECORD IN VACUO</span>
                </div>
                <div className="font-serif text-3xl sm:text-4xl lg:text-5xl text-bone font-normal tracking-tight">
                  55+ <span className="text-lg sm:text-xl text-stone-secondary font-light">Years in Situ</span>
                </div>
                <p className="font-sans text-xs text-stone-muted leading-relaxed font-light">
                  Tranquility Base hardware and human bootprints remain undisturbed in the airless lunar vacuum since 1969.
                </p>
              </div>

              <div className="w-full h-[1px] bg-meteorite/40" />

              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 font-mono text-[10px] tracking-[0.22em] text-signal uppercase font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal" />
                  <span>PERMANENT OFF-WORLD HERITAGE</span>
                </div>
                <div className="font-serif text-3xl sm:text-4xl lg:text-5xl text-bone font-normal tracking-tight">
                  8 <span className="text-lg sm:text-xl text-stone-secondary font-light">Curated Sites</span>
                </div>
                <p className="font-sans text-xs text-stone-muted leading-relaxed font-light">
                  Documented historical artifact sites preserved in the AFTERLIGHT museum archive.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SCENE 3 — THE MACHINES WE LEFT BEHIND
          ========================================================================= */}
      <section
        id="scene-machines"
        className="relative min-h-screen flex flex-col justify-center p-8 md:p-16 py-24 bg-obsidian border-t border-meteorite/30"
      >
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center space-x-3">
              <span className="w-4 h-[1px] bg-signal" />
              <span className="font-mono text-xs uppercase tracking-widest text-signal font-medium">
                CHAPTER 03 · THE CONCEPT
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
              Rocket physics is uncompromising. Every gram of return mass requires an exponential
              ladder of propellant. To launch astronauts back into lunar orbit, lower descent
              stages served as sacrificial launch pads. On Mars, solar-powered rovers continued
              rolling years past their design lifespans until dust storms engulfed their panels.
            </p>
          </div>

          {/* Staggered Artifact Feature Moments */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Apollo 11 Eagle */}
            <div className="group relative border border-meteorite/60 bg-surface-raised/30 hover:bg-surface-raised/70 transition-all duration-300 p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="relative h-48 overflow-hidden rounded-sm border border-meteorite/40">
                  <img
                    src="/images/apollo11_surface.jpg"
                    alt="Apollo 11 Eagle Descent Stage"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-obsidian/80 backdrop-blur-sm border border-meteorite/60 text-[10px] font-mono text-lunar">
                    THE MOON · 1969
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-signal">
                    APOLLO 11 · LM-5
                  </span>
                  <h3 className="font-serif text-xl text-bone">Eagle Descent Stage</h3>
                  <p className="text-stone-secondary text-xs leading-relaxed font-light">
                    The gold-wrapped lower chassis that cushioned humanity&apos;s first lunar landing
                    and anchored the liftoff back to orbit.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-meteorite/40 flex items-center justify-between text-[11px] font-mono text-stone-muted">
                <span>Mare Tranquillitatis</span>
                <span className="text-lunar">Preserved</span>
              </div>
            </div>

            {/* 2. Lunar Roving Vehicle */}
            <div className="group relative border border-meteorite/60 bg-surface-raised/30 hover:bg-surface-raised/70 transition-all duration-300 p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="relative h-48 overflow-hidden rounded-sm border border-meteorite/40">
                  <img
                    src="/images/exhibits/apollo_lrv.jpg"
                    alt="Apollo Lunar Roving Vehicle"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-obsidian/80 backdrop-blur-sm border border-meteorite/60 text-[10px] font-mono text-lunar">
                    THE MOON · 1971–1972
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-signal">
                    APOLLO 15–17
                  </span>
                  <h3 className="font-serif text-xl text-bone">Lunar Roving Vehicle</h3>
                  <p className="text-stone-secondary text-xs leading-relaxed font-light">
                    Electric chariots that carried astronauts across mountain rims, parked facing
                    Earth to broadcast liftoff.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-meteorite/40 flex items-center justify-between text-[11px] font-mono text-stone-muted">
                <span>3 Surface Sites</span>
                <span className="text-lunar">Intact</span>
              </div>
            </div>

            {/* 3. Opportunity Rover */}
            <div className="group relative border border-meteorite/60 bg-surface-raised/30 hover:bg-surface-raised/70 transition-all duration-300 p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="relative h-48 overflow-hidden rounded-sm border border-meteorite/40">
                  <img
                    src="/images/exhibits/opportunity.jpg"
                    alt="Opportunity Rover on Mars"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-obsidian/80 backdrop-blur-sm border border-meteorite/60 text-[10px] font-mono text-signal">
                    MARS · 2004–2018
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-signal">
                    MER-B MARS ROVER
                  </span>
                  <h3 className="font-serif text-xl text-bone">Opportunity</h3>
                  <p className="text-stone-secondary text-xs leading-relaxed font-light">
                    Designed for 90 days, it explored for 14.5 years, running an unprecedented
                    45.16-kilometer marathon across ancient lakebeds.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-meteorite/40 flex items-center justify-between text-[11px] font-mono text-stone-muted">
                <span>Perseverance Valley</span>
                <span className="text-signal">Silent</span>
              </div>
            </div>

            {/* 4. InSight Lander */}
            <div className="group relative border border-meteorite/60 bg-surface-raised/30 hover:bg-surface-raised/70 transition-all duration-300 p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="relative h-48 overflow-hidden rounded-sm border border-meteorite/40">
                  <img
                    src="/images/exhibits/insight_selfie.jpg"
                    alt="InSight Mars Lander"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-obsidian/80 backdrop-blur-sm border border-meteorite/60 text-[10px] font-mono text-signal">
                    MARS · 2018–2022
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-signal">
                    DISCOVERY MISSION
                  </span>
                  <h3 className="font-serif text-xl text-bone">InSight Lander</h3>
                  <p className="text-stone-secondary text-xs leading-relaxed font-light">
                    Humanity&apos;s extraterrestrial seismologist. Listened to over 1,300 marsquakes
                    before dust dimmed its solar wings.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-meteorite/40 flex items-center justify-between text-[11px] font-mono text-stone-muted">
                <span>Elysium Planitia</span>
                <span className="text-signal">Resting</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SCENE 4 — THE MOON (THE SILENT SEAS)
          ========================================================================= */}
      <section
        id="scene-moon"
        className="relative min-h-screen flex flex-col justify-center p-8 md:p-16 py-24 bg-[#090C10] border-t border-meteorite/30"
      >
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center space-x-3">
                <span className="w-4 h-[1px] bg-lunar" />
                <span className="font-mono text-xs uppercase tracking-widest text-lunar font-medium">
                  DESTINATION 01 · 384,400 KM FROM EARTH
                </span>
              </div>

              <h2 className="font-serif text-4xl sm:text-6xl text-bone tracking-tight leading-tight">
                THE SILENT SEAS OF THE MOON
              </h2>

              <p className="text-stone-secondary text-base sm:text-lg font-light leading-relaxed">
                An airless sanctuary where human bootprints, aluminum chassis, and gold thermal foil
                remain mathematically unchanged since the moment they touched down.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSelectMoon}
              className="px-6 py-3.5 bg-lunar/20 hover:bg-lunar text-lunar hover:text-obsidian border border-lunar/40 rounded-sm font-mono text-xs uppercase tracking-wider flex items-center space-x-2.5 transition-all duration-300 self-start md:self-auto"
            >
              <span>EXPLORE MOON EXHIBITION</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Deep Focus Lunar Feature Presentation */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-surface-raised/20 border border-meteorite/50 p-6 sm:p-10 rounded-sm">
            <div className="lg:col-span-7 relative h-72 sm:h-96 rounded-sm overflow-hidden border border-meteorite/60">
              <img
                src="/images/apollo11_surface.jpg"
                alt="Apollo 11 Tranquility Base"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between font-mono text-xs text-bone">
                <div>
                  <span className="text-signal block text-[10px]">HISTORICAL MONUMENT</span>
                  <span>APOLLO 11 TRANQUILITY BASE</span>
                </div>
                <div className="text-right text-stone-muted text-[10px]">
                  <span>0.67408° N, 23.47297° E</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-2">
                <span className="font-mono text-xs text-lunar uppercase tracking-wider">
                  JULY 20, 1969 · MARE TRANQUILLITATIS
                </span>
                <h3 className="font-serif text-3xl text-bone">The First Base On Another World</h3>
                <p className="text-stone-secondary text-sm leading-relaxed font-light">
                  When Eagle touched down, it held only 25 seconds of descent fuel remaining. For
                  21 hours, its lower stage served as living quarters, laboratory, and finally as
                  the stationary launchpad for the ascent engine.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-start space-x-3 text-xs font-mono text-stone-muted">
                  <span className="text-lunar font-semibold">01.</span>
                  <span>Descent Stage remains upright and intact with stainless-steel plaque</span>
                </div>
                <div className="flex items-start space-x-3 text-xs font-mono text-stone-muted">
                  <span className="text-lunar font-semibold">02.</span>
                  <span>Laser Ranging Retroreflector still targeted by Earth observatories today</span>
                </div>
                <div className="flex items-start space-x-3 text-xs font-mono text-stone-muted">
                  <span className="text-lunar font-semibold">03.</span>
                  <span>Solar Wind Composition foil and early seismic stations resting in the dust</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleSelectMoon}
                  className="w-full py-3 bg-surface hover:bg-lunar text-bone hover:text-obsidian border border-meteorite hover:border-lunar font-mono text-xs uppercase tracking-wider transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <span>OPEN 3D APOLLO 11 HARDWARE</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SCENE 5 — MARS (THE RED EXPEDITION)
          ========================================================================= */}
      <section
        id="scene-mars"
        className="relative min-h-screen flex flex-col justify-center p-8 md:p-16 py-24 bg-gradient-to-b from-[#090C10] via-[#1A0D0C] to-[#120706] border-t border-meteorite/30"
      >
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center space-x-3">
                <span className="w-4 h-[1px] bg-signal" />
                <span className="font-mono text-xs uppercase tracking-widest text-signal font-medium">
                  DESTINATION 02 · 225,000,000 KM AVERAGE
                </span>
              </div>

              <h2 className="font-serif text-4xl sm:text-6xl text-bone tracking-tight leading-tight">
                THE RED EXPEDITION
              </h2>

              <p className="text-stone-secondary text-base sm:text-lg font-light leading-relaxed">
                Across frozen basalt plateaus and towering volcanic calderas, robotic wanderers
                whispered radio telemetry until the sky darkened.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSelectMars}
              className="px-6 py-3.5 bg-signal/20 hover:bg-signal text-signal hover:text-obsidian border border-signal/40 rounded-sm font-mono text-xs uppercase tracking-wider flex items-center space-x-2.5 transition-all duration-300 self-start md:self-auto"
            >
              <span>EXPLORE MARS EXHIBITION</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Deep Focus Mars Feature Presentation */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-surface-raised/20 border border-signal/20 p-6 sm:p-10 rounded-sm">
            <div className="lg:col-span-7 relative h-72 sm:h-96 rounded-sm overflow-hidden border border-meteorite/60">
              <img
                src="/images/exhibits/opportunity.jpg"
                alt="Opportunity Rover on Mars"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between font-mono text-xs text-bone">
                <div>
                  <span className="text-signal block text-[10px]">5,111 MARTIAN SOLS</span>
                  <span>MER-B OPPORTUNITY (1973–2018)</span>
                </div>
                <div className="text-right text-stone-muted text-[10px]">
                  <span>Perseverance Valley · Endeavour Rim</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-2">
                <span className="font-mono text-xs text-signal uppercase tracking-wider">
                  2004–2018 · 45.16 KM TRAVERSE
                </span>
                <h3 className="font-serif text-3xl text-bone">The Rover That Outlasted Time</h3>
                <p className="text-stone-secondary text-sm leading-relaxed font-light">
                  Built to survive 90 Martian days, Opportunity spent fourteen and a half years
                  crawling across ancient lakebeds. It discovered hematite spherules—conclusive
                  proof that liquid water once bathed the Martian surface.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-start space-x-3 text-xs font-mono text-stone-muted">
                  <span className="text-signal font-semibold">01.</span>
                  <span>Completed 45.16 kilometers—the longest off-world drive in history</span>
                </div>
                <div className="flex items-start space-x-3 text-xs font-mono text-stone-muted">
                  <span className="text-signal font-semibold">02.</span>
                  <span>Returned over 217,000 raw color and panoramic images</span>
                </div>
                <div className="flex items-start space-x-3 text-xs font-mono text-stone-muted">
                  <span className="text-signal font-semibold">03.</span>
                  <span>Final telemetry transmitted from Endeavour Crater on June 10, 2018</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleSelectMars}
                  className="w-full py-3 bg-surface hover:bg-signal text-bone hover:text-obsidian border border-meteorite hover:border-signal font-mono text-xs uppercase tracking-wider transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <span>OPEN 3D OPPORTUNITY ROVER</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SCENE 6 — ENTER THE ARCHIVE (DESTINATIONS)
          ========================================================================= */}
      <section
        id="scene-archive"
        className="relative min-h-screen flex flex-col justify-between p-8 md:p-16 py-24 bg-obsidian border-t border-meteorite/40"
      >
        <div className="max-w-6xl mx-auto w-full space-y-16 my-auto">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="font-mono text-xs text-signal tracking-widest uppercase block">
              ENTER THE DIGITAL ARCHIVE
            </span>

            <h2 className="font-serif text-5xl sm:text-7xl text-bone tracking-tight leading-[0.98]">
              THEIR MISSIONS ENDED.
              <br />
              <span className="italic font-light text-bone/90">THEIR STORIES REMAIN.</span>
            </h2>

            <p className="text-stone-secondary text-base sm:text-lg font-light leading-relaxed max-w-xl mx-auto">
              Select a world to step into the interactive museum. Inspect full 3D hardware models,
              explore real orbital topography, and listen to documentary narration by Dr. Mae Vance.
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
              <span>OR EXPLORE INTERACTIVE 3D PLANETARY GLOBES</span>
            </button>
          </div>
        </div>

        {/* Museum Footer */}
        <footer className="pt-12 mt-12 border-t border-meteorite/40 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-stone-muted gap-4">
          <div>
            <span>AFTERLIGHT · NASA SPACE APPS CHALLENGE 2026</span>
          </div>
          <div className="flex items-center space-x-6">
            <span>HISTORICAL ARTIFACT PRESERVATION</span>
            <span>DATA SOURCED FROM NASA PDS & NSSDC</span>
          </div>
        </footer>
      </section>
    </div>
  );
};
