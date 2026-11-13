import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { useExperienceStore } from '../../store/useExperienceStore';
import { ARTIFACTS, EXHIBITION_COLLECTIONS } from '../../data/artifacts';
import { DESTINATIONS } from '../../data/destinations';
import { getDestinationTheme } from '../../theme/tokens';

export const ScreenExhibition: React.FC = () => {
  const currentDestination = useExperienceStore((s) => s.currentDestination);
  const selectArtifact = useExperienceStore((s) => s.selectArtifact);
  const returnToDestinations = useExperienceStore((s) => s.returnToDestinations);
  const isAudioMuted = useExperienceStore((s) => s.isAudioMuted);
  const toggleAudio = useExperienceStore((s) => s.toggleAudio);
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);

  const dest = DESTINATIONS[currentDestination] || DESTINATIONS.moon;
  const destTheme = getDestinationTheme(currentDestination);
  const artifactIds = EXHIBITION_COLLECTIONS[currentDestination] || EXHIBITION_COLLECTIONS.moon;
  const exhibits = artifactIds.map((id) => ARTIFACTS[id]).filter(Boolean);

  const headline =
    currentDestination === 'moon'
      ? 'THE MACHINES WE LEFT BEHIND'
      : currentDestination === 'mars'
      ? 'THE MACHINES THAT EXPLORED ANOTHER WORLD'
      : 'THE MACHINES BEYOND THE SUN';

  const supportingText =
    currentDestination === 'moon'
      ? 'Explore the rovers, landers, and scientific hardware preserved in the undisturbed lunar vacuum.'
      : currentDestination === 'mars'
      ? 'Discover the mobile geological laboratories that braved dust storms and traversed craters across the Red Planet.'
      : 'Track humanity’s farthest emissaries carrying our scientific sensors and memories into the interstellar deep.';

  // Asymmetric 12-column spans matching editorial rhythm
  const getAsymmetricLayout = (index: number) => {
    const pattern = index % 4;
    if (pattern === 0) return 'lg:col-span-7';
    if (pattern === 1) return 'lg:col-span-5 lg:mt-16';
    if (pattern === 2) return 'lg:col-span-5';
    return 'lg:col-span-7 lg:mt-14';
  };

  const getAspectClass = (index: number) => {
    const pattern = index % 4;
    return pattern === 0 || pattern === 3 ? 'aspect-[16/10]' : 'aspect-[4/3]';
  };

  return (
    <div className="fixed inset-0 z-30 bg-obsidian text-bone overflow-y-auto overflow-x-hidden select-none">
      {/* Minimal Sticky Top Navigation */}
      <header className="sticky top-0 z-20 bg-obsidian/90 backdrop-blur-sm border-b border-meteorite px-6 md:px-14 py-5 flex items-center justify-between">
        <div className="flex items-center space-x-4 md:space-x-6">
          <button
            type="button"
            onClick={returnToDestinations}
            className="group inline-flex items-center space-x-2 text-xs font-mono tracking-[0.16em] text-stone-secondary hover:text-bone transition-colors uppercase"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>DESTINATIONS</span>
          </button>

          <span className="text-meteorite font-mono text-xs">/</span>

          <div className="flex items-center space-x-2 font-mono text-xs tracking-[0.18em] uppercase">
            <span className="text-stone-secondary">AFTERLIGHT</span>
            <span className="text-meteorite">/</span>
            <span style={{ color: destTheme.accent }}>{dest.name}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleAudio}
          aria-label={isAudioMuted ? 'Unmute Ambient Audio' : 'Mute Ambient Audio'}
          className="text-stone-secondary hover:text-bone transition-colors p-1.5"
        >
          {isAudioMuted ? (
            <VolumeX className="w-4 h-4 text-stone-muted" />
          ) : (
            <Volume2 className="w-4 h-4" style={{ color: destTheme.accent }} />
          )}
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-14 pt-12 pb-24 space-y-16 md:space-y-20">
        {/* Curatorial Exhibition Heading */}
        <motion.section
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl space-y-4"
        >
          <span
            className="font-mono text-[11px] tracking-[0.22em] uppercase block font-medium"
            style={{ color: destTheme.accent }}
          >
            CURATED ARCHIVE · 0{exhibits.length} ARTIFACTS · {destTheme.character}
          </span>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-bone tracking-tight leading-[1.02]">
            {headline}
          </h1>

          <p className="font-sans text-sm md:text-base text-stone-secondary leading-relaxed max-w-2xl font-light">
            {supportingText}
          </p>
        </motion.section>

        {/* Asymmetric Editorial Collection */}
        <section
          aria-label={`${dest.name} Artifact Collection`}
          className="grid grid-cols-1 lg:grid-cols-12 gap-y-16 lg:gap-x-12 items-start"
        >
          {exhibits.map((artifact, index) => (
            <motion.article
              key={artifact.id}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.55,
                delay: reducedMotion ? 0 : index * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`group ${getAsymmetricLayout(index)}`}
            >
              <button
                type="button"
                onClick={() => selectArtifact(artifact.id)}
                className="w-full text-left block focus:outline-none"
              >
                {/* Photograph Plate (Clean museum crop with Meteorite hairline border) */}
                <div
                  className={`relative w-full ${getAspectClass(index)} overflow-hidden bg-surface border border-meteorite/60 group-hover:border-opacity-100 transition-colors duration-500`}
                  style={{
                    borderColor: undefined,
                  }}
                >
                  <img
                    src={artifact.heroImage}
                    alt={`${artifact.name} — ${artifact.mission}`}
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03] brightness-95 group-hover:brightness-100"
                    loading={index < 2 ? 'eager' : 'lazy'}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-obsidian/75 via-transparent to-transparent" />
                  
                  {/* Plate Index Badge */}
                  <span className="pointer-events-none absolute top-4 left-4 font-mono text-[10px] tracking-[0.2em] text-bone bg-obsidian/85 px-2.5 py-1 border border-meteorite/70">
                    0{index + 1}
                  </span>

                  {/* Category Pill */}
                  <span className="pointer-events-none absolute bottom-4 left-4 font-mono text-[9px] tracking-[0.16em] uppercase text-stone-secondary bg-surface/90 px-2 py-0.5 border border-meteorite/50">
                    {artifact.category}
                  </span>
                </div>

                {/* Exhibit Caption Strip */}
                <div className="pt-5 space-y-2.5 border-b border-meteorite pb-6 group-hover:border-stone-secondary transition-colors duration-300">
                  <div className="flex items-center justify-between font-mono text-[11px] tracking-[0.18em] uppercase">
                    <span style={{ color: destTheme.accent }}>{artifact.mission}</span>
                    <span className="text-stone-muted">{artifact.year}</span>
                  </div>

                  <h2 className="font-serif text-2xl sm:text-3xl text-bone tracking-tight transition-colors duration-300">
                    {artifact.name}
                  </h2>

                  <p className="font-sans text-xs sm:text-sm text-stone-secondary leading-relaxed font-light max-w-xl">
                    {artifact.shortDescription}
                  </p>

                  <div
                    className="pt-2 inline-flex items-center space-x-2.5 font-mono text-[11px] tracking-[0.2em] uppercase transition-colors"
                    style={{ color: destTheme.accent }}
                  >
                    <span>EXAMINE ARTIFACT</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform duration-200" />
                  </div>
                </div>
              </button>
            </motion.article>
          ))}
        </section>
      </main>
    </div>
  );
};
