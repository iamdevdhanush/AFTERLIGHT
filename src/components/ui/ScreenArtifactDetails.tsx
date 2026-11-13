import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Box,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { AfterlightGuide } from './AfterlightGuide';
import { Artifact3DStage } from '../canvas/Artifact3DStage';
import { useExperienceStore } from '../../store/useExperienceStore';
import { ARTIFACTS } from '../../data/artifacts';
import { DESTINATIONS } from '../../data/destinations';
import { getDestinationTheme } from '../../theme/tokens';

export const ScreenArtifactDetails: React.FC = () => {
  const selectedArtifactId = useExperienceStore((s) => s.selectedArtifactId);
  const selectedComponentId = useExperienceStore((s) => s.selectedComponentId);
  const selectComponent = useExperienceStore((s) => s.selectComponent);
  const returnToExhibition = useExperienceStore((s) => s.returnToExhibition);
  const enterStory = useExperienceStore((s) => s.enterStory);
  const isAudioMuted = useExperienceStore((s) => s.isAudioMuted);
  const toggleAudio = useExperienceStore((s) => s.toggleAudio);
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);

  const [viewMode, setViewMode] = useState<'photo' | '3d'>('photo');
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const artifact = selectedArtifactId ? ARTIFACTS[selectedArtifactId] : null;
  const dest = artifact ? DESTINATIONS[artifact.destination] || DESTINATIONS.moon : DESTINATIONS.moon;
  const destTheme = artifact ? getDestinationTheme(artifact.destination) : getDestinationTheme('moon');

  // Reset active photo if artifact switches
  React.useEffect(() => {
    setActivePhotoIndex(0);
    setViewMode('photo');
  }, [selectedArtifactId]);

  if (!artifact) return null;

  const gallery =
    artifact.galleryImages && artifact.galleryImages.length > 0
      ? artifact.galleryImages
      : [{ src: artifact.heroImage, caption: artifact.heroCaption, nasaId: artifact.heroNasaId }];

  const currentPhoto = gallery[activePhotoIndex] || gallery[0];
  const selectedComponent =
    artifact.components.find((c) => c.id === selectedComponentId) || null;

  return (
    <div className="fixed inset-0 z-30 bg-obsidian text-bone overflow-y-auto overflow-x-hidden select-none">
      {/* Top Minimal Header */}
      <header className="sticky top-0 z-20 bg-obsidian/90 backdrop-blur-sm border-b border-meteorite px-6 md:px-14 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4 md:space-x-6 min-w-0">
          <button
            type="button"
            onClick={returnToExhibition}
            className="group shrink-0 inline-flex items-center space-x-2 text-xs font-mono tracking-[0.16em] text-stone-secondary hover:text-bone transition-colors uppercase"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>EXHIBITION</span>
          </button>

          <span className="text-meteorite font-mono text-xs hidden sm:inline">/</span>

          <div className="hidden sm:flex items-center space-x-2 font-mono text-xs tracking-[0.16em] uppercase truncate">
            <span className="text-stone-secondary">{dest.name}</span>
            <span className="text-meteorite">/</span>
            <span style={{ color: destTheme.accent }} className="truncate font-medium">
              {artifact.name}
            </span>
          </div>
        </div>

        {/* Center Circular Close Button (Matches Editorial Museum Reference) */}
        <button
          type="button"
          onClick={returnToExhibition}
          aria-label="Close Artifact View"
          className="w-10 h-10 rounded-full bg-surface-raised/80 hover:bg-surface border border-meteorite text-stone-secondary hover:text-bone flex items-center justify-center transition-all shadow-md group"
        >
          <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </button>

        <button
          type="button"
          onClick={toggleAudio}
          aria-label={isAudioMuted ? 'Unmute Ambient Audio' : 'Mute Ambient Audio'}
          className="text-stone-secondary hover:text-bone transition-colors p-2"
        >
          {isAudioMuted ? (
            <VolumeX className="w-4 h-4 text-stone-muted" />
          ) : (
            <Volume2 className="w-4 h-4" style={{ color: destTheme.accent }} />
          )}
        </button>
      </header>

      {/* Main Two-Column Asymmetric Museum Layout */}
      <main className="max-w-7xl mx-auto px-6 md:px-14 pt-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-start">
          {/* LEFT / MAIN AREA: Visual Showcase, Title & Component Breakdown */}
          <motion.section
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-8"
          >
            {/* Title Block */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] tracking-[0.18em] uppercase">
                <span style={{ color: destTheme.accent }}>{artifact.mission}</span>
                <span className="text-meteorite">·</span>
                <span className="text-stone-muted">{artifact.year}</span>
                <span className="text-meteorite">·</span>
                <span className="text-stone-secondary">{artifact.category}</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-bone tracking-tight leading-[0.98]">
                {artifact.name}
              </h1>

              <p className="font-sans text-sm md:text-base text-stone-secondary leading-relaxed font-light max-w-2xl">
                {artifact.tagline}
              </p>
            </div>

            {/* Primary Visual Area (Archival NASA Photo + Optional 3D Hardware Mode) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.18em] text-stone-muted uppercase">
                  {viewMode === 'photo'
                    ? currentPhoto.nasaId
                      ? `NASA ARCHIVE · ${currentPhoto.nasaId}`
                      : 'NASA ARCHIVAL PHOTOGRAPH'
                    : 'INTERACTIVE 3D HARDWARE MODEL'}
                </span>

                {artifact.has3DModel && (
                  <div className="inline-flex items-center space-x-4 font-mono text-[10px] tracking-[0.16em] uppercase">
                    <button
                      type="button"
                      onClick={() => setViewMode('photo')}
                      className={`inline-flex items-center space-x-1.5 pb-0.5 transition-colors ${
                        viewMode === 'photo'
                          ? 'text-signal border-b border-signal font-semibold'
                          : 'text-stone-muted hover:text-bone'
                      }`}
                    >
                      <Camera className="w-3 h-3" />
                      <span>PHOTOGRAPH</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('3d')}
                      className={`inline-flex items-center space-x-1.5 pb-0.5 transition-colors ${
                        viewMode === '3d'
                          ? 'text-signal border-b border-signal font-semibold'
                          : 'text-stone-muted hover:text-bone'
                      }`}
                    >
                      <Box className="w-3 h-3" />
                      <span>3D HARDWARE</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="relative w-full aspect-[16/10] bg-surface overflow-hidden border border-meteorite">
                {viewMode === '3d' && artifact.has3DModel ? (
                  <Artifact3DStage artifactId={artifact.id} />
                ) : (
                  <img
                    src={currentPhoto.src}
                    alt={currentPhoto.caption}
                    className="w-full h-full object-cover object-center"
                  />
                )}
              </div>

              {viewMode === 'photo' && (
                <p className="font-sans text-xs text-stone-muted leading-relaxed font-light">
                  {currentPhoto.caption}
                </p>
              )}

              {/* Historical Photo Strip when multiple NASA stills exist */}
              {viewMode === 'photo' && gallery.length > 1 && (
                <div className="flex items-center gap-3 pt-1">
                  {gallery.map((img, idx) => (
                    <button
                      key={img.src}
                      type="button"
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`relative w-20 h-14 overflow-hidden border transition-all ${
                        idx === activePhotoIndex
                          ? 'border-signal ring-1 ring-signal opacity-100'
                          : 'border-meteorite opacity-50 hover:opacity-85'
                      }`}
                      title={img.caption}
                    >
                      <img src={img.src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Hardware & Landing Component Inspection */}
            <div className="pt-4 space-y-4">
              <div className="flex items-center justify-between border-b border-meteorite pb-2.5">
                <span
                  className="font-mono text-[11px] tracking-[0.2em] uppercase font-medium"
                  style={{ color: destTheme.accent }}
                >
                  HARDWARE & LANDING COMPONENTS
                </span>
                <span className="font-mono text-[10px] tracking-[0.16em] text-stone-muted uppercase">
                  SELECT COMPONENT TO INSPECT
                </span>
              </div>

              <div className="divide-y divide-meteorite/60">
                {artifact.components.map((comp) => {
                  const isActive = selectedComponent?.id === comp.id;

                  return (
                    <button
                      key={comp.id}
                      type="button"
                      onClick={() =>
                        selectComponent(isActive ? null : comp.id)
                      }
                      className={`w-full text-left py-3.5 px-3 -mx-3 transition-colors duration-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
                        isActive
                          ? 'bg-surface-raised border-l-2 border-signal'
                          : 'hover:bg-surface/60'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2.5">
                          <span
                            className={`font-serif text-lg transition-colors ${
                              isActive ? 'text-signal' : 'text-bone'
                            }`}
                          >
                            {comp.name}
                          </span>
                        </div>
                        <p className="font-sans text-xs text-stone-secondary font-light max-w-xl">
                          {comp.description}
                        </p>
                      </div>

                      <div className="shrink-0 flex sm:flex-col sm:items-end gap-2 sm:gap-0.5 font-mono text-[10px] tracking-[0.14em] uppercase">
                        <span className="text-stone-muted">{comp.category}</span>
                        <span className={comp.remainsOnSite ? 'text-lunar font-medium' : 'text-stone-muted'}>
                          {comp.remainsOnSite ? 'REMAINS AT SITE' : 'NOT AT SITE'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.section>

          {/* RIGHT / SUPPORTING AREA: AFTERLIGHT Guide + Primary Story CTA */}
          <motion.div
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: reducedMotion ? 0 : 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 lg:sticky lg:top-24 space-y-6"
          >
            <AfterlightGuide
              artifact={artifact}
              selectedComponent={selectedComponent}
              onResetComponent={() => selectComponent(null)}
            />

            {/* Location Reference & Primary Action */}
            <div className="space-y-5 pt-6 border-t border-meteorite">
              <div className="font-mono text-[11px] tracking-[0.14em] text-stone-muted space-y-1">
                <div className="text-bone">{artifact.locationName}</div>
                <div>
                  {artifact.coordinates.latitude} · {artifact.coordinates.longitude}
                </div>
                <div>LANDED / DEPLOYED: {artifact.landingDate.toUpperCase()}</div>
              </div>

              <button
                type="button"
                onClick={enterStory}
                className="group w-full sm:w-auto inline-flex items-center justify-center space-x-3.5 px-8 py-4 bg-signal text-obsidian hover:bg-bone transition-colors duration-300 font-semibold shadow-lg shadow-signal/15"
              >
                <span className="font-mono text-xs uppercase tracking-[0.18em] font-semibold text-obsidian">
                  EXPLORE FULL STORY
                </span>
                <ArrowRight className="w-4 h-4 text-obsidian group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};
