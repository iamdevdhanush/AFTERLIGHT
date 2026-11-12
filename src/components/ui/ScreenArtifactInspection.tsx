import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useExperienceStore } from '../../store/useExperienceStore';
import { ARTIFACTS } from '../../data/artifacts';

export const ScreenArtifactInspection: React.FC = () => {
  const selectedArtifactId = useExperienceStore((s) => s.selectedArtifactId);
  const enterStory = useExperienceStore((s) => s.enterStory);
  const returnToExploration = useExperienceStore((s) => s.returnToExploration);

  if (!selectedArtifactId) return null;
  const artifact = ARTIFACTS[selectedArtifactId];
  if (!artifact) return null;

  return (
    <div className="relative z-10 w-full h-full flex flex-col justify-between p-8 md:p-16 pointer-events-none select-none">
      {/* Top Header: Simple Minimal Return Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={returnToExploration}
          className="pointer-events-auto group inline-flex items-center space-x-2 text-starlight hover:text-gold text-xs font-mono tracking-wider transition-colors duration-300"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>RETURN TO TERRAIN</span>
        </button>

        <span className="font-mono text-xs tracking-wider text-starlight/40 hidden sm:inline">
          IN-SITU HARDWARE INSPECTION
        </span>
      </div>

      {/* Asymmetric Left Editorial Reserved Area (Leaves 65% of viewport completely open for the 3D artifact) */}
      <div className="max-w-md my-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-3"
        >
          <span className="font-mono text-xs text-gold uppercase tracking-wider block">
            {artifact.mission}
          </span>

          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-starlight tracking-tight leading-none">
            {artifact.name}
          </h1>

          <p className="font-serif text-2xl md:text-3xl italic text-starlight/90 leading-tight">
            {artifact.brief}
          </p>
        </motion.div>

        {/* One Meaningful Story Hook */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-sans text-sm md:text-base text-starlight/80 leading-relaxed font-light"
        >
          {artifact.tagline}
        </motion.p>

        {/* Minimal Mission Metadata Line (No giant tables or grids) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="pt-2 font-mono text-xs text-starlight/60 space-y-1"
        >
          <div className="text-starlight/90 font-medium">
            {artifact.landingDate} • {artifact.locationName}
          </div>
          <div>STATUS: {artifact.statusLabel.toUpperCase()}</div>
        </motion.div>

        {/* Exactly One Clear Primary Action */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="pt-4"
        >
          <button
            onClick={enterStory}
            className="pointer-events-auto group inline-flex items-center space-x-3 px-8 py-4 bg-starlight text-void hover:bg-gold transition-colors duration-300"
          >
            <span className="font-mono text-xs uppercase tracking-wider font-semibold">
              EXPLORE ITS STORY
            </span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>

      {/* Bottom Minimal Line */}
      <div className="font-mono text-xs tracking-wider text-starlight/40">
        REF: {artifact.callsign}
      </div>
    </div>
  );
};
