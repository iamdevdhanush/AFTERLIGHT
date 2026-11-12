import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useExperienceStore } from '../../store/useExperienceStore';
import { ARTIFACTS } from '../../data/artifacts';

export const ScreenLegacy: React.FC = () => {
  const selectedArtifactId = useExperienceStore((s) => s.selectedArtifactId);
  const returnToExhibition = useExperienceStore((s) => s.returnToExhibition);
  const returnToArtifactDetails = useExperienceStore((s) => s.returnToArtifactDetails);

  const artifact = selectedArtifactId ? ARTIFACTS[selectedArtifactId] : null;
  if (!artifact) return null;

  const headlines: Record<string, string> = {
    apollo11_eagle: 'Still Standing in the Sea of Tranquility.',
    apollo_lrv: 'Three Electric Rovers Parked Across Taurus-Littrow and Hadley.',
    surveyor3: 'Visited by Astronauts Inside Surveyor Crater.',
    apollo_alsep: 'Listening to the Lunar Interior Across Eight Years.',
    sojourner: 'The First Six Wheels to Roll Across Ares Vallis.',
    spirit: 'Hot-Spring Silica Uncovered in Gusev Crater.',
    opportunity: 'Silence Over Perseverance Valley.',
    insight: 'Taking Mars’s Vital Signs on Elysium Planitia.',
    voyager1: 'Sailing the Interstellar Ocean.',
  };

  const headline = headlines[artifact.id] || artifact.legacy.currentMilestone;
  const conclusionNarrative =
    artifact.id === 'apollo11_eagle'
      ? 'Over half a century later, in the undisturbed vacuum of Mare Tranquillitatis, the descent stage of Eagle remains intact where it touched down in 1969. With no wind, rain, or liquid water to corrode its frame, the octagonal descent stage, four footpads, ladder, and plaque endure as a permanent milestone of human exploration.'
      : artifact.legacy.whatRemainsToday;

  return (
    <div className="fixed inset-0 z-40 bg-void text-starlight overflow-y-auto overflow-x-hidden select-none flex flex-col justify-between">
      {/* 1. FULL-BLEED ARCHIVAL NASA BACKDROP */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 0.35, scale: 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full h-full"
        >
          <img
            src={artifact.heroImage}
            alt={artifact.name}
            className="w-full h-full object-cover filter contrast-110 brightness-75"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/80 to-void/45" />
      </div>

      {/* 2. TOP BAR */}
      <div className="relative z-10 p-6 md:px-14 md:py-8 flex items-center justify-between border-b border-starlight/10">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={returnToArtifactDetails}
            className="inline-flex items-center space-x-2 text-starlight/75 hover:text-gold text-xs font-mono tracking-wider transition-colors uppercase"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>ARTIFACT</span>
          </button>
          <span className="text-starlight/30">/</span>
          <span className="font-mono text-xs tracking-wider text-gold">
            {artifact.name}
          </span>
        </div>

        <button
          type="button"
          onClick={returnToExhibition}
          className="group inline-flex items-center space-x-2 text-starlight hover:text-gold text-xs font-mono tracking-wider transition-colors duration-300"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>RETURN TO EXHIBITION</span>
        </button>
      </div>

      {/* 3. CENTER DOCUMENTARY FINALE */}
      <div className="relative z-10 px-6 md:px-14 py-12 max-w-4xl mx-auto my-auto w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          <span className="font-mono text-xs tracking-wider text-gold block uppercase">
            {artifact.statusLabel}
          </span>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-starlight tracking-tight leading-[1.04]">
            {headline}
          </h1>
        </motion.div>

        {/* Narrative & Verified Discoveries */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.15 }}
          className="space-y-6"
        >
          <p className="font-sans text-base md:text-lg text-starlight/90 leading-relaxed font-light max-w-2xl">
            {conclusionNarrative}
          </p>

          <ul className="space-y-2 border-l border-gold/40 pl-4 max-w-2xl">
            {artifact.legacy.scientificImpact.map((impact) => (
              <li key={impact} className="font-sans text-xs md:text-sm text-starlight/75 font-light">
                {impact}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Minimal Mission Location Reference */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.25 }}
          className="pt-2 font-mono text-xs text-starlight/60 tracking-wider"
        >
          {artifact.locationName} • {artifact.coordinates.latitude}, {artifact.coordinates.longitude}
        </motion.div>

        {/* Primary Clear Return Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35 }}
          className="pt-2 flex flex-wrap items-center gap-4"
        >
          <button
            type="button"
            onClick={returnToExhibition}
            className="group inline-flex items-center space-x-3.5 px-8 py-4 bg-starlight text-void hover:bg-gold transition-colors duration-300"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-mono text-xs uppercase tracking-wider font-semibold">
              RETURN TO EXHIBITION
            </span>
          </button>

          <button
            type="button"
            onClick={returnToArtifactDetails}
            className="px-6 py-4 border border-starlight/20 text-starlight/80 hover:border-gold hover:text-gold font-mono text-xs uppercase tracking-wider transition-colors"
          >
            BACK TO ARTIFACT DETAILS
          </button>
        </motion.div>
      </div>

      {/* 4. VISUALLY RESTRAINED SOURCE CREDIT FOOTER */}
      <div className="relative z-10 p-6 md:px-14 md:py-8 border-t border-starlight/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-starlight/45 tracking-wider">
        <div>
          ARCHIVE SOURCE:{' '}
          <span className="text-starlight/75">
            {artifact.legacy.sources[0]?.title || 'NASA Mission Archives'}
          </span>
        </div>
        <a
          href={artifact.legacy.sources[0]?.url || 'https://www.nasa.gov'}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gold transition-colors flex items-center space-x-1"
        >
          <span>OFFICIAL MISSION RECORD</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
