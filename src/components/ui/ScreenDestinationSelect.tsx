import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Pause, Play } from 'lucide-react';
import { useExperienceStore } from '../../store/useExperienceStore';
import { DESTINATIONS } from '../../data/destinations';
import { DestinationId } from '../../types';

export const ScreenDestinationSelect: React.FC = () => {
  const selectDestination = useExperienceStore((s) => s.selectDestination);
  const previewDestination = useExperienceStore((s) => s.previewDestination);
  const currentDestination = useExperienceStore((s) => s.currentDestination);
  const isRotationPaused = useExperienceStore((s) => s.isRotationPaused);
  const toggleRotationPaused = useExperienceStore((s) => s.toggleRotationPaused);
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);

  const destinationList: DestinationId[] = ['moon', 'mars', 'deep_space'];
  const activeData = DESTINATIONS[currentDestination] || DESTINATIONS.moon;
  const isOrbitalGlobe = currentDestination === 'moon' || currentDestination === 'mars';

  return (
    <div className="relative z-10 w-full h-full flex flex-col justify-between p-7 md:p-14 pointer-events-none select-none">
      {/* Top Minimal Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-1.5 h-1.5 rounded-full bg-gold" />
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-starlight/90">
            AFTERLIGHT
          </span>
        </div>

        {/* Minimal inline selector pills (no boxed cards) */}
        <nav
          aria-label="Destination selection"
          className="pointer-events-auto flex items-center space-x-6 md:space-x-8"
        >
          {destinationList.map((id, idx) => {
            const item = DESTINATIONS[id];
            const isSelected = currentDestination === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => previewDestination(id)}
                className={`group relative pb-1.5 font-mono text-[11px] md:text-xs tracking-[0.18em] uppercase transition-colors duration-300 ${
                  isSelected
                    ? 'text-starlight'
                    : 'text-starlight/45 hover:text-starlight/80'
                }`}
              >
                <span className="text-gold/75 mr-1.5">0{idx + 1}</span>
                <span>{item.name}</span>
                {isSelected && (
                  <motion.span
                    layoutId="dest-underline"
                    className="absolute left-0 right-0 bottom-0 h-px bg-gold"
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Left-reserved editorial typography so the complete 3D globe owns the right/center canvas */}
      <div className="my-auto max-w-sm md:max-w-md pr-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeData.id}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-5"
          >
            <div className="space-y-2">
              <span className="font-mono text-[11px] tracking-[0.22em] text-gold uppercase block">
                {activeData.epoch}
              </span>
              <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl text-starlight tracking-tight leading-[0.95]">
                {activeData.name}
              </h1>
            </div>

            <p className="font-serif text-xl md:text-2xl text-starlight/85 leading-snug">
              {activeData.tagline}
            </p>

            <p className="font-sans text-xs md:text-sm text-starlight/65 leading-relaxed max-w-xs md:max-w-sm font-light">
              {activeData.subtext}
            </p>

            {/* Restrained borderless telemetry line */}
            <div className="flex items-center space-x-8 pt-2 font-mono text-[11px]">
              <div>
                <span className="block text-starlight/40 tracking-[0.16em] uppercase text-[10px]">
                  ATMOSPHERE
                </span>
                <span className="text-starlight/85 mt-0.5 block">
                  {activeData.surfaceAtmosphere}
                </span>
              </div>
              <div>
                <span className="block text-starlight/40 tracking-[0.16em] uppercase text-[10px]">
                  TEMP RANGE
                </span>
                <span className="text-starlight/85 mt-0.5 block">
                  {activeData.temperature}
                </span>
              </div>
            </div>

            {/* Single direct descent CTA */}
            <div className="pt-3">
              <button
                type="button"
                onClick={() => selectDestination(activeData.id)}
                className="pointer-events-auto group inline-flex items-center space-x-3.5 px-7 py-3.5 bg-starlight text-void hover:bg-gold transition-colors duration-300"
              >
                <span className="font-mono text-xs uppercase tracking-[0.18em] font-semibold">
                  ENTER {activeData.name}
                </span>
                <ArrowRight className="w-4 h-4 text-void group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Whisper Bar + Rotation Control */}
      <div className="flex items-center justify-between text-[11px] font-mono tracking-[0.16em] text-starlight/45">
        <span>
          {isOrbitalGlobe
            ? 'DRAG GLOBE TO INSPECT · SCROLL TO ZOOM'
            : 'DEEP SPACE TELEMETRY ESTABLISHED'}
        </span>

        {isOrbitalGlobe && (
          <button
            type="button"
            onClick={toggleRotationPaused}
            aria-pressed={isRotationPaused}
            className="pointer-events-auto inline-flex items-center space-x-2 text-starlight/65 hover:text-starlight transition-colors duration-200 uppercase"
          >
            {isRotationPaused || reducedMotion ? (
              <>
                <Play className="w-3.5 h-3.5 text-gold" />
                <span>{reducedMotion ? 'REDUCED MOTION' : 'RESUME ROTATION'}</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 text-gold" />
                <span>PAUSE ROTATION</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

