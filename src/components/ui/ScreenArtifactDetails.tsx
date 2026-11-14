import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Box,
  Volume2,
  VolumeX,
  X,
  ShieldCheck,
  Compass,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { AfterlightGuide } from './AfterlightGuide';
import { Artifact3DStage } from '../canvas/Artifact3DStage';
import { useExperienceStore } from '../../store/useExperienceStore';
import { ARTIFACTS } from '../../data/artifacts';
import { DESTINATIONS } from '../../data/destinations';
import { getDestinationTheme } from '../../theme/tokens';
import { ArtifactComponent } from '../../types';
import { navigation } from '../../navigation/navigationController';
import { guideVoiceEngine } from '../../audio/GuideVoiceEngine';

interface ScreenArtifactDetailsProps {
  artifactId?: string | null;
  onClose?: () => void;
}

export const ScreenArtifactDetails: React.FC<ScreenArtifactDetailsProps> = ({ artifactId, onClose }) => {
  const selectedArtifactId = useExperienceStore((s) => s.selectedArtifactId);
  const selectedComponentId = useExperienceStore((s) => s.selectedComponentId);
  const selectComponent = useExperienceStore((s) => s.selectComponent);
  const returnToExhibition = useExperienceStore((s) => s.returnToExhibition);
  const enterStory = useExperienceStore((s) => s.enterStory);
  const isAudioMuted = useExperienceStore((s) => s.isAudioMuted);
  const toggleAudio = useExperienceStore((s) => s.toggleAudio);
  const isSfxMuted = useExperienceStore((s) => s.isSfxMuted);
  const toggleSfx = useExperienceStore((s) => s.toggleSfx);
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);

  const [viewMode, setViewMode] = useState<'photo' | '3d'>('photo');
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [hoveredHotspotId, setHoveredHotspotId] = useState<string | null>(null);

  const activeArtifactId = artifactId || selectedArtifactId;
  const artifact = activeArtifactId ? ARTIFACTS[activeArtifactId] : null;
  const dest = artifact ? DESTINATIONS[artifact.destination] || DESTINATIONS.moon : DESTINATIONS.moon;
  const destTheme = artifact ? getDestinationTheme(artifact.destination) : getDestinationTheme('moon');

  const handleClose = () => {
    if (onClose) onClose();
    else navigation.goBack();
  };

  // Keyboard navigation: Escape key closes the detail overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Cleanly silence narration when exiting the artifact screen
  useEffect(() => {
    return () => {
      guideVoiceEngine.stop(false);
    };
  }, []);

  // Reset active photo if artifact switches
  useEffect(() => {
    setActivePhotoIndex(0);
    setViewMode('photo');
    setHoveredHotspotId(null);
  }, [activeArtifactId]);

  if (!artifact) {
    return (
      <div className="fixed inset-0 z-50 bg-obsidian text-bone flex flex-col items-center justify-center p-8 space-y-4 text-center select-none">
        <Compass className="w-8 h-8 text-[#DEB275] animate-pulse" />
        <h2 className="font-serif text-2xl text-bone">Artifact Not Found in Sector Archive</h2>
        <p className="font-sans text-xs text-stone-secondary max-w-sm">
          The requested artifact ID could not be located in the current planetary telemetry.
        </p>
        <button
          type="button"
          onClick={() => navigation.goBack()}
          className="px-5 py-2.5 bg-signal text-obsidian font-mono text-xs uppercase tracking-wider font-semibold"
        >
          RETURN TO EXHIBITION
        </button>
      </div>
    );
  }

  const gallery =
    artifact.galleryImages && artifact.galleryImages.length > 0
      ? artifact.galleryImages
      : [{ src: artifact.heroImage, caption: artifact.heroCaption, nasaId: artifact.heroNasaId }];

  const currentPhoto = gallery[activePhotoIndex] || gallery[0];
  const selectedComponent =
    artifact.components.find((c) => c.id === selectedComponentId) || null;

  // Components that have verified hotspot coordinates on the primary hero image
  const hotspotComponents = activePhotoIndex === 0 && viewMode === 'photo'
    ? artifact.components.filter((c): c is ArtifactComponent & { hotspot: { x: number; y: number } } => !!c.hotspot)
    : [];

  return (
    <div className="w-full min-h-screen bg-obsidian text-bone overflow-y-auto overflow-x-hidden select-none">
      {/* Top Minimal Editorial Header */}
      <header className="sticky top-0 z-30 bg-obsidian/95 backdrop-blur-md border-b border-meteorite/60 px-6 md:px-14 py-4 flex items-center justify-between">
        {/* Left: Breadcrumbs matching reference styling */}
        <div className="flex items-center space-x-2 md:space-x-3 font-mono text-xs tracking-[0.16em] uppercase">
          <button
            type="button"
            onClick={handleClose}
            className="group inline-flex items-center space-x-1.5 transition-colors hover:text-bone"
            style={{ color: '#DEB275' }}
          >
            <span>← EXHIBITION</span>
          </button>

          <span className="text-meteorite">/</span>

          <span style={{ color: '#DEB275' }} className="hidden sm:inline">
            {dest.name}
          </span>

          <span className="text-meteorite hidden sm:inline">/</span>

          <span style={{ color: '#DEB275' }} className="truncate font-medium">
            {artifact.name}
          </span>
        </div>

        {/* Center Circular Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close Artifact View (Esc)"
          title="Close Artifact View (Esc)"
          className="w-10 h-10 rounded-full bg-[#1E2327]/80 hover:bg-[#2C3338] border border-meteorite text-bone/80 hover:text-bone flex items-center justify-center transition-all shadow-md group"
        >
          <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </button>

        {/* Right: Master Sound & Navigation SFX Controls */}
        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={toggleSfx}
            aria-label={isSfxMuted ? 'Unmute Navigation Sound Effects' : 'Mute Navigation Sound Effects'}
            title={isSfxMuted ? 'Navigation SFX: MUTED' : 'Navigation SFX: ACTIVE'}
            className={`px-2 py-1 font-mono text-[10px] tracking-wider rounded border transition-colors uppercase ${
              isSfxMuted
                ? 'border-meteorite text-stone-muted hover:text-stone-secondary bg-surface/30'
                : 'border-meteorite/80 text-bone hover:border-signal bg-surface/60'
            }`}
          >
            SFX: {isSfxMuted ? 'OFF' : 'ON'}
          </button>

          <button
            type="button"
            onClick={toggleAudio}
            aria-label={isAudioMuted ? 'Unmute Ambient Audio' : 'Mute Ambient Audio'}
            title={isAudioMuted ? 'Ambient: MUTED' : 'Ambient: ACTIVE'}
            className="hover:text-bone transition-colors p-2"
            style={{ color: '#DEB275' }}
          >
            {isAudioMuted ? (
              <VolumeX className="w-4 h-4 text-stone-muted" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* Main Two-Column Editorial Museum Layout */}
      <main className="max-w-7xl mx-auto px-6 md:px-14 pt-8 pb-36">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* LEFT / MAIN COLUMN: Visual Showcase, Title, Hotspots, Specs & Curatorial Records */}
          <motion.section
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-8"
          >
            {/* Title & Metadata Block */}
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-x-2.5 font-mono text-xs tracking-[0.2em] uppercase">
                <span style={{ color: '#DEB275' }} className="font-semibold">
                  {artifact.mission}
                </span>
                <span className="text-meteorite">·</span>
                <span style={{ color: '#DEB275' }}>{artifact.year}</span>
                <span className="text-meteorite">·</span>
                <span style={{ color: '#DEB275' }}>{artifact.category}</span>
              </div>

              <motion.h1
                layoutId={`exhibit-title-${artifact.id}`}
                className="font-serif text-4xl sm:text-5xl md:text-6xl text-bone tracking-tight leading-[1.0] pt-1"
              >
                {artifact.name}
              </motion.h1>

              <p className="font-sans text-base md:text-lg text-stone-secondary leading-relaxed font-light max-w-2xl pt-1">
                {artifact.tagline}
              </p>

              <div className="pt-1">
                <span className="font-mono text-xs tracking-[0.18em] text-stone-muted uppercase">
                  {currentPhoto.nasaId
                    ? `NASA ARCHIVE · ${currentPhoto.nasaId}`
                    : 'NASA ARCHIVE · AS12-47-6918'}
                </span>
              </div>
            </div>

            {/* Primary Visual Showcase (Archival Photography or Interactive 3D Turntable) */}
            <div className="space-y-3.5">
              {/* Controls bar above showcase */}
              <div className="flex items-center justify-end text-xs font-mono">
                <div className="inline-flex items-center space-x-4 text-[10px] tracking-[0.16em] uppercase">
                  <button
                    type="button"
                    onClick={() => setViewMode('photo')}
                    className={`inline-flex items-center space-x-1.5 pb-0.5 transition-colors ${
                      viewMode === 'photo'
                        ? 'border-b font-semibold'
                        : 'text-stone-muted hover:text-bone'
                    }`}
                    style={{
                      color: viewMode === 'photo' ? '#DEB275' : undefined,
                      borderColor: viewMode === 'photo' ? '#DEB275' : 'transparent',
                    }}
                  >
                    <Camera className="w-3 h-3" />
                    <span>PHOTOGRAPH</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('3d')}
                    className={`inline-flex items-center space-x-1.5 pb-0.5 transition-colors ${
                      viewMode === '3d'
                        ? 'border-b font-semibold'
                        : 'text-stone-muted hover:text-bone'
                    }`}
                    style={{
                      color: viewMode === '3d' ? '#DEB275' : undefined,
                      borderColor: viewMode === '3d' ? '#DEB275' : 'transparent',
                    }}
                  >
                    <Box className="w-3 h-3" />
                    <span>{artifact.has3DModel ? '3D HARDWARE' : '3D STATUS'}</span>
                  </button>
                </div>
              </div>

              {/* Showcase Frame with Interactive Hotspots Overlay */}
              <div className="relative w-full aspect-[16/10] bg-surface overflow-hidden border border-meteorite shadow-2xl group">
                {viewMode === '3d' ? (
                  <Artifact3DStage
                    artifactId={artifact.id}
                    onSwitchToPhoto={() => setViewMode('photo')}
                  />
                ) : (
                  <>
                    <motion.img
                      layoutId={`exhibit-image-${artifact.id}`}
                      src={currentPhoto.src}
                      alt={currentPhoto.caption}
                      className="w-full h-full object-cover object-center"
                    />

                    {/* Interactive Hardware Component Hotspots */}
                    {hotspotComponents.map((comp) => {
                      const isSelected = selectedComponent?.id === comp.id;
                      const isHovered = hoveredHotspotId === comp.id;

                      return (
                        <div
                          key={comp.id}
                          style={{
                            left: `${comp.hotspot.x}%`,
                            top: `${comp.hotspot.y}%`,
                          }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                          onMouseEnter={() => setHoveredHotspotId(comp.id)}
                          onMouseLeave={() => setHoveredHotspotId(null)}
                        >
                          <button
                            type="button"
                            onClick={() => selectComponent(isSelected ? null : comp.id)}
                            aria-label={`Inspect ${comp.name}`}
                            className="relative group/pin flex items-center justify-center p-2 focus:outline-none"
                          >
                            {/* Pulsing radar ring */}
                            <span
                              className={`absolute w-7 h-7 rounded-full animate-ping opacity-60 transition-colors ${
                                isSelected ? 'bg-signal' : 'bg-lunar'
                              }`}
                            />
                            {/* Outer ring */}
                            <span
                              className={`relative w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${
                                isSelected
                                  ? 'border-signal bg-signal/30 scale-125'
                                  : 'border-bone bg-obsidian/75 group-hover/pin:scale-115 group-hover/pin:border-signal'
                              }`}
                            >
                              {/* Inner center dot */}
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isSelected ? 'bg-signal' : 'bg-bone'
                                }`}
                              />
                            </span>
                          </button>

                          {/* Hover Tooltip Card */}
                          <AnimatePresence>
                            {(isHovered || isSelected) && (
                              <motion.div
                                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-surface-raised border border-meteorite p-2.5 shadow-2xl rounded-sm z-30 space-y-1 text-left"
                              >
                                <span
                                  className="font-mono text-[8px] tracking-[0.16em] uppercase block font-medium"
                                  style={{ color: destTheme.accent }}
                                >
                                  {comp.category}
                                </span>
                                <h4 className="font-serif text-xs text-bone leading-tight">
                                  {comp.name}
                                </h4>
                                <span className="font-mono text-[8px] text-stone-muted block uppercase">
                                  CLICK TO INSPECT
                                </span>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}

                    {/* Hotspot guidance pill */}
                    {hotspotComponents.length > 0 && (
                      <div className="pointer-events-none absolute bottom-3 right-3 z-10 font-mono text-[9px] tracking-[0.16em] text-stone-secondary bg-obsidian/85 px-2.5 py-1 border border-meteorite/60 uppercase">
                        INTERACTIVE HOTSPOTS ACTIVE
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Photo Caption & Reference */}
              {viewMode === 'photo' && (
                <p className="font-sans text-xs text-stone-muted leading-relaxed font-light">
                  {currentPhoto.caption}
                </p>
              )}

              {/* Historical Photo Thumbnails Strip */}
              {viewMode === 'photo' && gallery.length > 1 && (
                <div className="flex items-center gap-3 pt-1">
                  {gallery.map((img, idx) => (
                    <button
                      key={img.src}
                      type="button"
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`relative w-20 h-14 overflow-hidden border transition-all ${
                        idx === activePhotoIndex
                          ? 'border-signal ring-1 ring-signal opacity-100 scale-102'
                          : 'border-meteorite opacity-60 hover:opacity-90'
                      }`}
                      title={img.caption}
                    >
                      <img src={img.src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Interactive Hardware & Landing Component Exploration */}
            <div className="pt-2 space-y-4">
              <div className="flex items-center justify-between border-b border-meteorite/70 pb-2.5">
                <span
                  className="font-mono text-xs tracking-[0.2em] uppercase font-medium"
                  style={{ color: '#DEB275' }}
                >
                  HARDWARE & LANDING COMPONENTS
                </span>
                <span
                  className="font-mono text-xs tracking-[0.16em] uppercase flex items-center space-x-1"
                  style={{ color: selectedComponent ? '#DEB275' : '#85877F' }}
                >
                  <span>{selectedComponent ? `INSPECTING: ${selectedComponent.name}` : 'SELECT COMPONENT TO INSPECT →'}</span>
                </span>
              </div>

              <div className="divide-y divide-meteorite/60">
                {artifact.components.map((comp) => {
                  const isActive = selectedComponent?.id === comp.id;

                  return (
                    <button
                      key={comp.id}
                      type="button"
                      onClick={() => selectComponent(isActive ? null : comp.id)}
                      className={`w-full text-left py-4 px-4 -mx-4 transition-colors duration-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                        isActive
                          ? 'bg-surface-raised border-l-2 border-signal pl-4'
                          : 'hover:bg-surface/50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2.5">
                          <span
                            className={`font-serif text-lg sm:text-xl transition-colors ${
                              isActive ? 'text-signal font-normal' : 'text-bone'
                            }`}
                          >
                            {comp.name}
                          </span>
                        </div>
                        <p className="font-sans text-xs text-stone-secondary font-light max-w-xl leading-relaxed">
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

            {/* Engineering Specifications & Technical Architecture */}
            <div className="pt-4 space-y-4 border-t border-meteorite">
              <span
                className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold block"
                style={{ color: destTheme.accent }}
              >
                ENGINEERING SPECIFICATIONS
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-surface-raised/60 border border-meteorite space-y-1">
                  <span className="font-mono text-[10px] tracking-[0.16em] text-stone-muted uppercase block">
                    TOTAL MASS & STRUCTURE
                  </span>
                  <p className="font-serif text-lg text-bone">{artifact.specs.mass}</p>
                </div>

                <div className="p-4 bg-surface-raised/60 border border-meteorite space-y-1">
                  <span className="font-mono text-[10px] tracking-[0.16em] text-stone-muted uppercase block">
                    PRIMARY POWER SOURCE
                  </span>
                  <p className="font-serif text-lg text-bone">{artifact.specs.powerSource}</p>
                </div>

                <div className="p-4 bg-surface-raised/60 border border-meteorite space-y-1">
                  <span className="font-mono text-[10px] tracking-[0.16em] text-stone-muted uppercase block">
                    TELEMETRY & COMMUNICATIONS
                  </span>
                  <p className="font-serif text-lg text-bone">{artifact.specs.communication}</p>
                </div>

                <div className="p-4 bg-surface-raised/60 border border-meteorite space-y-1">
                  <span className="font-mono text-[10px] tracking-[0.16em] text-stone-muted uppercase block">
                    OPERATIONAL DURATION
                  </span>
                  <p className="font-serif text-lg text-bone">{artifact.operationalDuration}</p>
                </div>
              </div>
            </div>

            {/* Scientific Impact & Historical Milestones */}
            <div className="pt-4 space-y-4 border-t border-meteorite">
              <span
                className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold block"
                style={{ color: destTheme.accent }}
              >
                SCIENTIFIC CONTRIBUTIONS & LEGACY
              </span>

              <ul className="space-y-2.5 border-l-2 pl-4" style={{ borderColor: destTheme.accent }}>
                {artifact.legacy.scientificImpact.map((impact, idx) => (
                  <li key={idx} className="font-sans text-xs sm:text-sm text-stone-secondary font-light leading-relaxed">
                    {impact}
                  </li>
                ))}
              </ul>
            </div>

            {/* Official Archival Mission Records */}
            <div className="pt-4 space-y-3 border-t border-meteorite pb-6">
              <span className="font-mono text-[10px] tracking-[0.18em] text-stone-muted uppercase block">
                VERIFIED ARCHIVAL SOURCES
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-stone-muted">
                <div>
                  ORGANIZATION:{' '}
                  <span className="text-stone-secondary font-medium">
                    {artifact.legacy.sources[0]?.organization || 'NASA / National Air and Space Museum'}
                  </span>
                </div>
                <a
                  href={artifact.legacy.sources[0]?.url || 'https://www.nasa.gov'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-signal transition-colors inline-flex items-center space-x-1.5 text-stone-secondary hover:text-signal"
                >
                  <span>OFFICIAL NASA RECORD</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </motion.section>

          {/* RIGHT / SUPPORTING COLUMN: Curator Dr. Mae Vance + Primary Story CTA */}
          <motion.div
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: reducedMotion ? 0 : 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 lg:sticky lg:top-24 space-y-8"
          >
            {/* Dr. Mae Vance Curatorial Presenter & Signature Speech Bubble */}
            <AfterlightGuide
              artifact={artifact}
              selectedComponent={selectedComponent}
              onResetComponent={() => selectComponent(null)}
            />

            {/* Curatorial In-Situ Records & Story Link */}
            <div className="pt-8 border-t border-meteorite/50 space-y-4">
              <div className="font-mono text-[11px] tracking-[0.14em] text-stone-muted space-y-1">
                <div className="text-bone font-medium">{artifact.locationName}</div>
                <div>{artifact.coordinates.latitude} · {artifact.coordinates.longitude}</div>
                <div>DEPLOYED: {artifact.landingDate.toUpperCase()}</div>
              </div>

              <button
                type="button"
                onClick={enterStory}
                className="group inline-flex items-center space-x-2.5 px-6 py-3 border border-meteorite hover:border-[#DEB275] bg-surface hover:bg-surface-raised text-bone transition-all text-xs font-mono uppercase tracking-[0.16em]"
              >
                <span>EXPLORE DOCUMENTARY STORY</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" style={{ color: '#DEB275' }} />
              </button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};
