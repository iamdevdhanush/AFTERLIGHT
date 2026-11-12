import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Box, Camera, Volume2, VolumeX } from 'lucide-react';
import { useExperienceStore } from '../../store/useExperienceStore';
import { ARTIFACTS } from '../../data/artifacts';
import { DESTINATIONS } from '../../data/destinations';
import { AfterlightGuide } from './AfterlightGuide';
import { Artifact3DStage } from '../canvas/Artifact3DStage';

export const ScreenArtifactDetails: React.FC = () => {
  const selectedArtifactId = useExperienceStore((s) => s.selectedArtifactId);
  const selectedComponentId = useExperienceStore((s) => s.selectedComponentId);
  const selectComponent = useExperienceStore((s) => s.selectComponent);
  const enterStory = useExperienceStore((s) => s.enterStory);
  const returnToExhibition = useExperienceStore((s) => s.returnToExhibition);
  const isAudioMuted = useExperienceStore((s) => s.isAudioMuted);
  const toggleAudio = useExperienceStore((s) => s.toggleAudio);
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);

  const [viewMode, setViewMode] = useState<'photo' | '3d'>('photo');
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const artifact = selectedArtifactId ? ARTIFACTS[selectedArtifactId] : null;
  const dest = artifact ? DESTINATIONS[artifact.destination] : DESTINATIONS.moon;

  // Reset gallery & 3D tab when switching artifacts
  useEffect(() => {
    setViewMode('photo');
    setActivePhotoIndex(0);
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
    <div className="fixed inset-0 z-30 bg-void text-starlight overflow-y-auto overflow-x-hidden select-none">
      {/* Top Minimal Header */}
      <header className="sticky top-0 z-20 bg-void/90 backdrop-blur-sm border-b border-starlight/10 px-6 md:px-14 py-5 flex items-center justify-between">
        <div className="flex items-center space-x-4 md:space-x-6 min-w-0">
          <button
            type="button"
            onClick={returnToExhibition}
            className="group shrink-0 inline-flex items-center space-x-2 text-xs font-mono tracking-[0.16em] text-starlight/75 hover:text-gold transition-colors uppercase"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>EXHIBITION</span>
          </button>

          <span className="text-starlight/25 font-mono text-xs hidden sm:inline">/</span>

          <div className="hidden sm:flex items-center space-x-2 font-mono text-xs tracking-[0.16em] uppercase truncate">
            <span className="text-starlight/60">{dest.name}</span>
            <span className="text-starlight/30">/</span>
            <span className="text-gold truncate">{artifact.name}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleAudio}
          aria-label={isAudioMuted ? 'Unmute Ambient Audio' : 'Mute Ambient Audio'}
          className="text-starlight/55 hover:text-gold transition-colors p-1.5"
        >
          {isAudioMuted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4 text-gold" />
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
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] tracking-[0.18em] text-gold uppercase">
                <span>{artifact.mission}</span>
                <span className="text-starlight/30">·</span>
                <span>{artifact.year}</span>
                <span className="text-starlight/30">·</span>
                <span className="text-starlight/65">{artifact.category}</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-starlight tracking-tight leading-[0.98]">
                {artifact.name}
              </h1>

              <p className="font-sans text-sm md:text-base text-starlight/75 leading-relaxed font-light max-w-2xl">
                {artifact.tagline}
              </p>
            </div>

            {/* Primary Visual Area (Archival NASA Photo + Optional 3D Hardware Mode) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.18em] text-starlight/45 uppercase">
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
                          ? 'text-gold border-b border-gold'
                          : 'text-starlight/50 hover:text-starlight'
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
                          ? 'text-gold border-b border-gold'
                          : 'text-starlight/50 hover:text-starlight'
                      }`}
                    >
                      <Box className="w-3 h-3" />
                      <span>3D HARDWARE</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="relative w-full aspect-[16/10] bg-[#06080D] overflow-hidden border border-starlight/10">
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
                <p className="font-sans text-xs text-starlight/55 leading-relaxed">
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
                      className={`relative w-20 h-14 overflow-hidden transition-opacity ${
                        idx === activePhotoIndex
                          ? 'ring-1 ring-gold opacity-100'
                          : 'opacity-45 hover:opacity-80'
                      }`}
                      title={img.caption}
                    >
                      <img src={img.src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Hardware & Landing Component Inspection (Section 7) */}
            <div className="pt-4 space-y-4">
              <div className="flex items-center justify-between border-b border-starlight/10 pb-2.5">
                <span className="font-mono text-[11px] tracking-[0.2em] text-gold uppercase">
                  HARDWARE & LANDING COMPONENTS
                </span>
                <span className="font-mono text-[10px] tracking-[0.16em] text-starlight/45 uppercase">
                  SELECT COMPONENT TO INSPECT
                </span>
              </div>

              <div className="divide-y divide-starlight/10">
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
                          ? 'bg-space-800/75 border-l-2 border-gold'
                          : 'hover:bg-space-900/50'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2.5">
                          <span
                            className={`font-serif text-lg transition-colors ${
                              isActive ? 'text-gold' : 'text-starlight'
                            }`}
                          >
                            {comp.name}
                          </span>
                        </div>
                        <p className="font-sans text-xs text-starlight/65 font-light max-w-xl">
                          {comp.description}
                        </p>
                      </div>

                      <div className="shrink-0 flex sm:flex-col sm:items-end gap-2 sm:gap-0.5 font-mono text-[10px] tracking-[0.14em] uppercase">
                        <span className="text-starlight/55">{comp.category}</span>
                        <span className={comp.remainsOnSite ? 'text-gold/90' : 'text-starlight/45'}>
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
            className="lg:col-span-5 lg:sticky lg:top-24 space-y-8"
          >
            <AfterlightGuide
              artifact={artifact}
              selectedComponent={selectedComponent}
              onResetComponent={() => selectComponent(null)}
            />

            {/* Location Reference + Direct Action */}
            <div className="pl-6 lg:pl-8 space-y-5 pt-4 border-t border-starlight/10">
              <div className="font-mono text-[11px] tracking-[0.14em] text-starlight/55 space-y-1">
                <div className="text-starlight/85">{artifact.locationName}</div>
                <div>
                  {artifact.coordinates.latitude} · {artifact.coordinates.longitude}
                </div>
                <div>LANDED / DEPLOYED: {artifact.landingDate.toUpperCase()}</div>
              </div>

              <button
                type="button"
                onClick={enterStory}
                className="group w-full sm:w-auto inline-flex items-center justify-center space-x-3.5 px-8 py-4 bg-starlight text-void hover:bg-gold transition-colors duration-300"
              >
                <span className="font-mono text-xs uppercase tracking-[0.18em] font-semibold">
                  EXPLORE FULL STORY
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

