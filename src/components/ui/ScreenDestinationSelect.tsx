import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react';
import { useExperienceStore } from '../../store/useExperienceStore';
import { DESTINATIONS } from '../../data/destinations';
import { DestinationId } from '../../types';
import { getDestinationTheme } from '../../theme/tokens';
import { navigation } from '../../navigation/navigationController';

export const ScreenDestinationSelect: React.FC = () => {
  const selectDestination = useExperienceStore((s) => s.selectDestination);
  const previewDestination = useExperienceStore((s) => s.previewDestination);
  const currentDestination = useExperienceStore((s) => s.currentDestination);
  const isRotationPaused = useExperienceStore((s) => s.isRotationPaused);
  const toggleRotationPaused = useExperienceStore((s) => s.toggleRotationPaused);
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);

  // Exclusively Moon and Mars
  const destinationList: DestinationId[] = ['moon', 'mars'];
  const activeData = DESTINATIONS[currentDestination] || DESTINATIONS.moon;
  const activeTheme = getDestinationTheme(currentDestination);

  return (
    <div className="relative z-10 w-full h-full flex flex-col justify-between p-7 md:p-14 pointer-events-none select-none">
      {/* Top Minimal Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => navigation.toArrival()}
            className="pointer-events-auto inline-flex items-center space-x-1.5 text-stone-muted hover:text-bone text-xs font-mono tracking-[0.16em] uppercase transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>ARRIVAL</span>
          </button>

          <span className="text-meteorite font-mono text-xs hidden sm:inline">/</span>

          <div className="flex items-center space-x-3">
            <div
              className="w-2 h-2 rounded-full transition-colors duration-500"
              style={{ backgroundColor: activeTheme.accent }}
            />
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-bone font-medium">
              AFTERLIGHT
            </span>
          </div>
        </div>

        {/* Destination-Specific Nav with Active Accent Underline */}
        <nav
          aria-label="Destination selection"
          className="pointer-events-auto flex items-center space-x-6 md:space-x-8"
        >
          {destinationList.map((id, idx) => {
            const item = DESTINATIONS[id];
            const itemTheme = getDestinationTheme(id);
            const isSelected = currentDestination === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => previewDestination(id)}
                className={`group relative pb-1.5 font-mono text-[11px] md:text-xs tracking-[0.18em] uppercase transition-colors duration-300 ${
                  isSelected
                    ? 'text-bone font-semibold'
                    : 'text-stone-muted hover:text-stone-secondary'
                }`}
              >
                <span
                  className="mr-1.5 transition-colors duration-300"
                  style={{ color: isSelected ? itemTheme.accent : undefined }}
                >
                  0{idx + 1}
                </span>
                <span>{item.name}</span>
                {isSelected && (
                  <motion.span
                    layoutId="dest-underline"
                    className="absolute left-0 right-0 bottom-0 h-[2px]"
                    style={{ backgroundColor: itemTheme.accent }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Left-reserved editorial typography — 3D globe owns center/right */}
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
              <span
                className="font-mono text-[11px] tracking-[0.22em] uppercase block font-medium"
                style={{ color: activeTheme.accent }}
              >
                {activeData.epoch} · {activeTheme.character}
              </span>
              <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl text-bone tracking-tight leading-[0.95]">
                {activeData.name}
              </h1>
            </div>

            <p className="font-serif text-xl md:text-2xl text-bone/90 leading-snug">
              {activeData.tagline}
            </p>

            <p className="font-sans text-xs md:text-sm text-stone-secondary leading-relaxed max-w-xs md:max-w-sm font-light">
              {activeData.subtext}
            </p>

            {/* Industrial Scientific Telemetry Line */}
            <div className="flex items-center space-x-8 pt-2 font-mono text-[11px] border-t border-meteorite">
              <div>
                <span className="block text-stone-muted tracking-[0.16em] uppercase text-[10px]">
                  ATMOSPHERE
                </span>
                <span className="text-bone mt-0.5 block font-mono text-xs">
                  {activeData.surfaceAtmosphere}
                </span>
              </div>
              <div>
                <span className="block text-stone-muted tracking-[0.16em] uppercase text-[10px]">
                  TEMP RANGE
                </span>
                <span className="text-bone mt-0.5 block font-mono text-xs">
                  {activeData.temperature}
                </span>
              </div>
            </div>

            {/* Destination Accent Descent CTA */}
            <div className="pt-3">
              <button
                type="button"
                onClick={() => selectDestination(activeData.id)}
                className="pointer-events-auto group inline-flex items-center space-x-3.5 px-7 py-3.5 text-obsidian font-semibold transition-all duration-300 shadow-lg"
                style={{
                  backgroundColor: activeTheme.accent,
                }}
              >
                <span className="font-mono text-xs uppercase tracking-[0.18em] font-semibold text-obsidian">
                  ENTER {activeData.name}
                </span>
                <ArrowRight className="w-4 h-4 text-obsidian group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Telemetry Bar + Rotation Control */}
      <div className="flex items-center justify-between text-[11px] font-mono tracking-[0.16em] text-stone-muted pt-4 border-t border-meteorite">
        <span>DRAG GLOBE TO ROTATE · SCROLL TO ZOOM SURFACE</span>

        <button
          type="button"
          onClick={toggleRotationPaused}
          aria-pressed={isRotationPaused}
          className="pointer-events-auto inline-flex items-center space-x-2 text-stone-secondary hover:text-bone transition-colors duration-200 uppercase"
        >
          {isRotationPaused || reducedMotion ? (
            <>
              <Play className="w-3.5 h-3.5" style={{ color: activeTheme.accent }} />
              <span>{reducedMotion ? 'REDUCED MOTION' : 'RESUME ROTATION'}</span>
            </>
          ) : (
            <>
              <Pause className="w-3.5 h-3.5" style={{ color: activeTheme.accent }} />
              <span>PAUSE ROTATION</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
