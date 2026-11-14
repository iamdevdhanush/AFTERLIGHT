import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Compass } from 'lucide-react';
import { useExperienceStore } from '../../store/useExperienceStore';

export const ScreenArrival: React.FC = () => {
  const beginArrival = useExperienceStore((s) => s.beginArrival);

  return (
    <div className="relative z-10 w-full h-full flex flex-col justify-between p-8 md:p-16 pointer-events-none select-none">
      {/* Top Bar: Wordmark & Historical Register */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 rounded-full bg-signal" />
          <span className="font-mono text-xs uppercase tracking-wider text-bone font-medium">
            AFTERLIGHT
          </span>
        </div>
        <div className="hidden md:flex items-center space-x-6 text-xs font-mono tracking-wider text-stone-secondary">
          <span>APOLLO 11 · MER-B · INSIGHT</span>
          <span>SOLAR SYSTEM HISTORICAL REGISTER</span>
        </div>
      </motion.div>

      {/* Center Editorial Title & Subtitle */}
      <div className="max-w-3xl space-y-6 my-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-3"
        >
          <span className="font-mono text-xs tracking-wider text-signal uppercase block">
            INTERACTIVE SPACE ARTIFACT ARCHIVE
          </span>
          <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl tracking-tight leading-[0.98] text-bone">
            THEY WENT BEYOND.
            <br />
            <span className="italic font-normal text-bone/90">THEY LEFT A LEGACY.</span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl text-stone-secondary font-sans text-base md:text-lg leading-relaxed font-light"
        >
          An interactive archive of the machines that changed our understanding of space.
          Explore the rovers, landers, and scientific hardware humanity left behind across
          the Moon and Mars.
        </motion.p>

        {/* Primary Action Button (Signal Vermilion) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="pt-4"
        >
          <button
            type="button"
            onClick={beginArrival}
            className="pointer-events-auto group relative inline-flex items-center space-x-4 px-8 py-4 bg-signal text-obsidian hover:bg-bone transition-colors duration-300 font-semibold shadow-lg shadow-signal/15"
          >
            <Compass className="w-4 h-4 text-obsidian group-hover:rotate-45 transition-transform duration-300" />
            <span className="font-mono text-xs uppercase tracking-wider font-semibold">
              BEGIN EXPLORATION
            </span>
            <ArrowUpRight className="w-4 h-4 text-obsidian group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
          </button>
        </motion.div>
      </div>

      {/* Bottom Editorial Coordinates & Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, delay: 0.6 }}
        className="flex flex-col md:flex-row md:items-end justify-between text-xs font-mono tracking-wider text-stone-muted pt-6 border-t border-meteorite"
      >
        <div className="flex items-center space-x-6">
          <span className="flex items-center space-x-1.5">
            <span className="text-lunar">01.</span>
            <span>THE MOON</span>
          </span>
          <span className="text-meteorite">•</span>
          <span className="flex items-center space-x-1.5">
            <span className="text-signal">02.</span>
            <span>MARS</span>
          </span>
        </div>
        <div className="mt-3 md:mt-0 text-stone-muted">
          <span>HISTORICAL SITES ARE PRESERVED IN SITU</span>
        </div>
      </motion.div>
    </div>
  );
};
