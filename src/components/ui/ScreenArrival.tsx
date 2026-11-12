import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Compass } from 'lucide-react';
import { useExperienceStore } from '../../store/useExperienceStore';

export const ScreenArrival: React.FC = () => {
  const beginArrival = useExperienceStore((s) => s.beginArrival);

  return (
    <div className="relative z-10 w-full h-full flex flex-col justify-between p-8 md:p-16 pointer-events-none select-none">
      {/* Top Bar: Wordmark only */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 rounded-full bg-gold" />
          <span className="font-mono text-xs uppercase tracking-wider text-starlight font-medium">
            AFTERLIGHT
          </span>
        </div>
        <div className="hidden md:flex items-center space-x-6 text-xs font-mono tracking-wider text-starlight/60">
          <span>APOLLO 11 • MER-B • VOYAGER 1</span>
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
          <span className="font-mono text-xs tracking-wider text-gold uppercase block">
            INTERACTIVE SPACE ARTIFACT ARCHIVE
          </span>
          <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl tracking-tight leading-[0.98] text-starlight">
            THEY WENT BEYOND.
            <br />
            <span className="italic font-normal text-starlight/90">THEY LEFT A LEGACY.</span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl text-starlight/80 font-sans text-base md:text-lg leading-relaxed font-light"
        >
          An interactive archive of the machines that changed our understanding of space.
          Explore the rovers, landers, and scientific hardware humanity left behind across
          the Moon, Mars, and interstellar space.
        </motion.p>

        {/* Primary Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="pt-4"
        >
          <button
            onClick={beginArrival}
            className="pointer-events-auto group relative inline-flex items-center space-x-4 px-8 py-4 bg-starlight text-void hover:bg-gold transition-colors duration-300"
          >
            <Compass className="w-4 h-4 text-void group-hover:rotate-45 transition-transform duration-300" />
            <span className="font-mono text-xs uppercase tracking-wider font-semibold">
              BEGIN EXPLORATION
            </span>
            <ArrowUpRight className="w-4 h-4 text-void group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
          </button>
        </motion.div>
      </div>

      {/* Bottom Editorial Coordinates & Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, delay: 0.6 }}
        className="flex flex-col md:flex-row md:items-end justify-between text-xs font-mono tracking-wider text-starlight/60 pt-6 border-t border-starlight/10"
      >
        <div className="flex items-center space-x-6">
          <span>01. THE MOON</span>
          <span className="text-gold">•</span>
          <span>02. MARS</span>
          <span className="text-gold">•</span>
          <span>03. DEEP SPACE</span>
        </div>
        <div className="mt-3 md:mt-0 text-starlight/50">
          <span>HISTORICAL SITES ARE PRESERVED IN SITU</span>
        </div>
      </motion.div>
    </div>
  );
};

