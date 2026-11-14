import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useExperienceStore } from '../../store/useExperienceStore';
import { DESTINATIONS } from '../../data/destinations';
import { getDestinationTheme } from '../../theme/tokens';
import { navigation } from '../../navigation/navigationController';

export const ScreenLoading: React.FC = () => {
  const currentDestination = useExperienceStore((s) => s.currentDestination);
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);
  const validDest = currentDestination === 'mars' ? 'mars' : 'moon';
  const destData = DESTINATIONS[validDest] || DESTINATIONS.moon;
  const destTheme = getDestinationTheme(validDest);

  const [showManualSkip, setShowManualSkip] = useState(false);

  // Safety timer to prevent any stuck loading screens
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowManualSkip(true);
    }, 1800);

    const forceTimer = setTimeout(() => {
      navigation.toExhibition(validDest);
    }, 3200);

    return () => {
      clearTimeout(timer);
      clearTimeout(forceTimer);
    };
  }, [validDest]);

  const subtitle =
    validDest === 'moon'
      ? 'DESCENDING TO MARE TRANQUILLITATIS'
      : 'ENTERING MARTIAN ORBIT';

  return (
    <div className="absolute inset-0 z-30 pointer-events-none select-none overflow-hidden">
      {/* Smooth crossfade veil timed cleanly into the exhibition transition */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.98 }}
        exit={{ opacity: 0 }}
        transition={{
          delay: !reducedMotion ? 0.35 : 0,
          duration: !reducedMotion ? 0.75 : 0.4,
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
                duration: !reducedMotion ? 1.1 : 0.55,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{ transformOrigin: 'left', backgroundColor: destTheme.accent }}
              className="h-full"
            />
          </div>

          {/* Safety proceed button for user recovery */}
          {showManualSkip && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pt-2"
            >
              <button
                type="button"
                onClick={() => navigation.toExhibition(validDest)}
                className="pointer-events-auto inline-flex items-center space-x-1.5 font-mono text-[10px] tracking-wider text-stone-secondary hover:text-bone uppercase border border-meteorite px-2.5 py-1 bg-surface"
              >
                <span>PROCEED TO EXHIBITION</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

