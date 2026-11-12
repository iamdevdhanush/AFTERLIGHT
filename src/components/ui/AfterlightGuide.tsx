import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArtifactComponent, ArtifactData } from '../../types';
import { useExperienceStore } from '../../store/useExperienceStore';

interface AfterlightGuideProps {
  artifact: ArtifactData;
  selectedComponent: ArtifactComponent | null;
  onResetComponent: () => void;
}

/**
 * Permanent educational museum presenter for AFTERLIGHT.
 * Renders curated, historically verified artifact and component briefings
 * without chatbot UI, chat bubbles, or text input prompts.
 */
export const AfterlightGuide: React.FC<AfterlightGuideProps> = ({
  artifact,
  selectedComponent,
  onResetComponent,
}) => {
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);
  const briefingKey = selectedComponent ? `${artifact.id}-${selectedComponent.id}` : artifact.id;

  return (
    <aside
      aria-label="Afterlight Curatorial Guide"
      className="flex flex-col justify-between space-y-6 border-l border-starlight/10 pl-6 lg:pl-8"
    >
      {/* Guide Identity Row + Subtle Animated Curator Silhouette */}
      <div className="space-y-5">
        <div className="flex items-center space-x-4">
          <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
            {/* Subtle orbital telemetry ring */}
            <motion.svg
              viewBox="0 0 64 64"
              className="w-12 h-12"
              aria-hidden="true"
              animate={
                reducedMotion
                  ? undefined
                  : { y: [0, -1.5, 0] }
              }
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <circle
                cx="32"
                cy="32"
                r="29"
                fill="#0D1118"
                stroke="#D99A63"
                strokeOpacity="0.35"
                strokeWidth="1"
              />
              {/* Architectural docent helmet / silhouette */}
              <path
                d="M21 47 C21 38, 25 35, 32 35 C39 35, 43 38, 43 47"
                fill="none"
                stroke="#E8E3D9"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <circle
                cx="32"
                cy="24"
                r="8.5"
                fill="#171E28"
                stroke="#E8E3D9"
                strokeWidth="1.4"
              />
              {/* Gold helmet visor slit */}
              <path
                d="M26.5 23.5 Q32 25.5 37.5 23.5"
                fill="none"
                stroke="#D99A63"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Subtle gesture line that tilts softly on selection change */}
              <motion.path
                key={briefingKey}
                initial={reducedMotion ? undefined : { pathLength: 0.4, opacity: 0.5 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.65, ease: 'easeOut' }}
                d="M15 41 L22 39"
                fill="none"
                stroke="#D99A63"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </motion.svg>
          </div>

          <div>
            <span className="font-mono text-[10px] tracking-[0.22em] text-gold uppercase block">
              AFTERLIGHT GUIDE
            </span>
            <p className="font-serif text-lg text-starlight/90 leading-snug">
              Curatorial Briefing
            </p>
          </div>
        </div>

        {/* Dynamic Spoken-Tone Educational Narrative */}
        <AnimatePresence mode="wait">
          <motion.div
            key={briefingKey}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-3"
          >
            {selectedComponent ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-gold uppercase">
                    COMPONENT · {selectedComponent.category}
                  </span>
                  <button
                    type="button"
                    onClick={onResetComponent}
                    className="font-mono text-[10px] tracking-[0.16em] text-starlight/50 hover:text-gold uppercase transition-colors"
                  >
                    OVERVIEW
                  </button>
                </div>
                <h3 className="font-serif text-xl text-starlight">
                  {selectedComponent.name}
                </h3>
                <p className="font-sans text-sm text-starlight/85 leading-relaxed font-light">
                  {selectedComponent.guideExplanation}
                </p>
                <p className="font-mono text-[11px] leading-relaxed text-starlight/60 pt-1">
                  {selectedComponent.remainsOnSite ? 'ON SITE: ' : 'OFF SITE: '}
                  <span className={selectedComponent.remainsOnSite ? 'text-starlight/85' : 'text-gold'}>
                    {selectedComponent.siteNote}
                  </span>
                </p>
              </>
            ) : (
              <p className="font-sans text-sm md:text-[15px] text-starlight/90 leading-relaxed font-light">
                “{artifact.guide.explanation}”
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Structured Archival Breakdown (Zero cards, restrained hairline separators) */}
      <dl className="space-y-4 pt-5 border-t border-starlight/10 text-xs">
        <div>
          <dt className="font-mono text-[10px] tracking-[0.18em] text-starlight/45 uppercase">
            Purpose
          </dt>
          <dd className="font-sans text-xs md:text-[13px] text-starlight/80 leading-relaxed mt-1 font-light">
            {artifact.guide.purpose}
          </dd>
        </div>

        <div>
          <dt className="font-mono text-[10px] tracking-[0.18em] text-starlight/45 uppercase">
            Mission
          </dt>
          <dd className="font-sans text-xs md:text-[13px] text-starlight/80 leading-relaxed mt-1 font-light">
            {artifact.guide.missionUsed}
          </dd>
        </div>

        <div>
          <dt className="font-mono text-[10px] tracking-[0.18em] text-starlight/45 uppercase">
            Why It Remained
          </dt>
          <dd className="font-sans text-xs md:text-[13px] text-starlight/80 leading-relaxed mt-1 font-light">
            {artifact.guide.whyLeftBehind}
          </dd>
        </div>

        <div>
          <dt className="font-mono text-[10px] tracking-[0.18em] text-starlight/45 uppercase">
            Present Status
          </dt>
          <dd className="font-sans text-xs md:text-[13px] text-gold/95 leading-relaxed mt-1 font-light">
            {artifact.guide.presentStatus}
          </dd>
        </div>
      </dl>
    </aside>
  );
};

