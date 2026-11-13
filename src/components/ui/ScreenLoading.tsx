import React from 'react';
import { motion } from 'framer-motion';
import { useExperienceStore } from '../../store/useExperienceStore';
import { DESTINATIONS } from '../../data/destinations';
import { getDestinationTheme } from '../../theme/tokens';

export const ScreenLoading: React.FC = () => {
  const currentDestination = useExperienceStore((s) => s.currentDestination);
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);
  const destData = DESTINATIONS[currentDestination];
  const destTheme = getDestinationTheme(currentDestination);

  const isOrbitalDescent = currentDestination === 'moon' || currentDestination === 'mars';
  const subtitle =
    currentDestination === 'moon'
      ? 'DESCENDING TO MARE TRANQUILLITATIS'
      : currentDestination === 'mars'
      ? 'ENTERING MARTIAN ORBIT'
      : 'ALIGNING DEEP SPACE TRAJECTORY';

  return (
    <div className="absolute inset-0 z-30 pointer-events-none select-none overflow-hidden">
      {/* Smooth crossfade veil timed cleanly into the exhibition transition */}
      <motion.div
        initial={{ opacity: isOrbitalDescent ? 0 : 0.85 }}
        animate={{ opacity: 0.98 }}
        exit={{ opacity: 0 }}
        transition={{
          delay: isOrbitalDescent && !reducedMotion ? 0.35 : 0,
          duration: isOrbitalDescent && !reducedMotion ? 0.75 : 0.4,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 bg-obsidian"
      />

      {/* Restrained orbital approach caption kept out of center frame */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 h-full flex flex-col justify-end p-8 md:p-16"
      >
        <div className="max-w-sm space-y-2.5">
          <div className="flex items-center space-x-2.5">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: destTheme.accent }}
            />
            <span
              className="font-mono text-[10px] tracking-[0.22em] uppercase font-medium"
              style={{ color: destTheme.accent }}
            >
              {subtitle}
            </span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-bone tracking-tight">
            {destData.name}
          </h2>
          <div className="w-40 h-px bg-meteorite overflow-hidden">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{
                duration: isOrbitalDescent && !reducedMotion ? 1.1 : 0.55,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{ transformOrigin: 'left', backgroundColor: destTheme.accent }}
              className="h-full"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

