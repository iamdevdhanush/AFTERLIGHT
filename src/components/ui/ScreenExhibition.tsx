import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Volume2,
  VolumeX,
  Search,
  X,
  SlidersHorizontal,
  Compass,
  Sparkles,
  Globe,
  Layers,
} from 'lucide-react';
import { useExperienceStore } from '../../store/useExperienceStore';
import { ARTIFACTS, EXHIBITION_COLLECTIONS } from '../../data/artifacts';
import { DESTINATIONS } from '../../data/destinations';
import { getDestinationTheme } from '../../theme/tokens';
import { DestinationId, ArtifactCategory, HardwareStatus, ArtifactData } from '../../types';
import { ScreenArtifactDetails } from './ScreenArtifactDetails';
import { PlanetarySurfaceMap } from './PlanetarySurfaceMap';
import { navigation } from '../../navigation/navigationController';
import { soundManager } from '../../audio/SoundManager';

export const ScreenExhibition: React.FC = () => {
  const currentDestination = useExperienceStore((s) => s.currentDestination);
  const enterPlanetaryArchaeology = useExperienceStore((s) => s.enterPlanetaryArchaeology);
  const selectedArtifactId = useExperienceStore((s) => s.selectedArtifactId);
  const selectArtifact = useExperienceStore((s) => s.selectArtifact);
  const returnToExhibition = useExperienceStore((s) => s.returnToExhibition);
  const returnToDestinations = useExperienceStore((s) => s.returnToDestinations);
  const isAudioMuted = useExperienceStore((s) => s.isAudioMuted);
  const toggleAudio = useExperienceStore((s) => s.toggleAudio);
  const isSfxMuted = useExperienceStore((s) => s.isSfxMuted);
  const toggleSfx = useExperienceStore((s) => s.toggleSfx);
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);

  // Exhibition exploration mode: stored in store and synced with URL
  const exhibitionView = useExperienceStore((s) => s.exhibitionView);
  const setExhibitionView = useExperienceStore((s) => s.setExhibitionView);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDestFilter, setSelectedDestFilter] = useState<DestinationId | 'all'>(currentDestination);
  const [selectedCategory, setSelectedCategory] = useState<ArtifactCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<HardwareStatus | 'all'>('all');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const validDest = currentDestination === 'mars' ? 'mars' : 'moon';
  const dest = DESTINATIONS[validDest] || DESTINATIONS.moon;
  const destTheme = getDestinationTheme(validDest);

  // Sync destination filter if currentDestination changes externally
  React.useEffect(() => {
    setSelectedDestFilter(validDest);
  }, [validDest]);

  // All artifacts or destination-scoped artifacts
  const allArtifacts = useMemo(() => {
    return Object.values(ARTIFACTS).filter(
      (item) => item.destination === 'moon' || item.destination === 'mars'
    );
  }, []);

  // Filtered artifacts
  const filteredExhibits = useMemo(() => {
    return allArtifacts.filter((item) => {
      // 1. Destination filter
      if (selectedDestFilter !== 'all' && item.destination !== selectedDestFilter) {
        return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // 3. Status filter
      if (selectedStatus !== 'all' && item.status !== selectedStatus) {
        return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchCallsign = item.callsign.toLowerCase().includes(q);
        const matchMission = item.mission.toLowerCase().includes(q);
        const matchDescription = item.shortDescription.toLowerCase().includes(q) || item.brief.toLowerCase().includes(q);
        return matchName || matchCallsign || matchMission || matchDescription;
      }

      return true;
    });
  }, [allArtifacts, selectedDestFilter, selectedCategory, selectedStatus, searchQuery]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedDestFilter !== validDest ||
    selectedCategory !== 'all' ||
    selectedStatus !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDestFilter(validDest);
    setSelectedCategory('all');
    setSelectedStatus('all');
  };

  const headline =
    selectedDestFilter === 'mars'
      ? 'THE MACHINES THAT EXPLORED ANOTHER WORLD'
      : 'THE MACHINES WE LEFT BEHIND';

  const supportingText =
    selectedDestFilter === 'mars'
      ? 'Discover the mobile geological laboratories that braved dust storms and traversed craters across the Red Planet.'
      : 'Explore the rovers, landers, and scientific hardware preserved in the undisturbed lunar vacuum.';

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

  // Distinct featured artifact (when viewing destination collection without complex filters)
  const isStandardView = !searchQuery.trim() && selectedCategory === 'all' && selectedStatus === 'all';
  const featuredArtifact = isStandardView && filteredExhibits.length > 0 ? filteredExhibits[0] : null;
  const supportingExhibits = isStandardView && featuredArtifact ? filteredExhibits.slice(1) : filteredExhibits;

  return (
    <div className="fixed inset-0 z-30 bg-obsidian text-bone overflow-y-auto overflow-x-hidden select-none">
      {/* 1. Minimal Sticky Top Navigation Header */}
      <header className="sticky top-0 z-20 bg-obsidian/90 backdrop-blur-sm border-b border-meteorite px-6 md:px-14 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4 md:space-x-6 min-w-0">
          <button
            type="button"
            onClick={returnToDestinations}
            className="group shrink-0 inline-flex items-center space-x-2 text-xs font-mono tracking-[0.16em] text-stone-secondary hover:text-bone transition-colors uppercase"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>DESTINATIONS</span>
          </button>

          <span className="text-meteorite font-mono text-xs hidden sm:inline">/</span>

          <div className="hidden sm:flex items-center space-x-2 font-mono text-xs tracking-[0.18em] uppercase truncate">
            <span className="text-stone-secondary">AFTERLIGHT</span>
            <span className="text-meteorite">/</span>
            <span style={{ color: destTheme.accent }}>
              {selectedDestFilter === 'all' ? 'ALL ARCHIVES' : dest.name}
            </span>
          </div>
        </div>

        {/* Right Tools: 3D Map shortcut & Ambient Audio Toggle */}
        <div className="flex items-center space-x-3">
          {(selectedDestFilter === 'moon' || selectedDestFilter === 'mars' || currentDestination === 'moon' || currentDestination === 'mars') && (
            <button
              type="button"
              onClick={enterPlanetaryArchaeology}
              className="inline-flex items-center space-x-2 px-3 py-1.5 bg-black/60 hover:bg-black/90 text-amber-400 hover:text-amber-300 border border-amber-500/40 hover:border-amber-400 font-mono text-[10px] tracking-[0.16em] uppercase transition-all duration-200"
              title="Launch Interactive 3D Planetary Map"
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">3D PLANETARY MAP</span>
            </button>
          )}

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
        </div>
      </header>

      {/* 2. Main Museum Exhibition Canvas */}
      <main className="max-w-7xl mx-auto px-6 md:px-14 pt-10 pb-28 space-y-12">
        {/* Curatorial Exhibition Heading & Sector Scope */}
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
            CURATED ARCHIVE · 0{filteredExhibits.length} ARTIFACTS · {destTheme.character}
          </span>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-bone tracking-tight leading-[1.02]">
            {headline}
          </h1>

          <p className="font-sans text-sm md:text-base text-stone-secondary leading-relaxed max-w-2xl font-light">
            {supportingText}
          </p>
        </motion.section>

        {/* 3. Refined Multi-Dimensional Filtering & Search Bar */}
        <section aria-label="Collection search and filters" className="space-y-4 pt-2">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Exploration View Mode Switcher: COLLECTION vs SURFACE MAP */}
            <div className="inline-flex items-center p-1 bg-surface border border-meteorite rounded-sm shrink-0">
              <button
                type="button"
                onClick={() => setExhibitionView('collection')}
                className={`inline-flex items-center space-x-2 px-3.5 py-1.5 font-mono text-xs tracking-[0.16em] uppercase rounded-sm transition-colors ${
                  exhibitionView === 'collection'
                    ? 'bg-obsidian text-bone border border-meteorite/80 shadow-sm font-semibold'
                    : 'text-stone-secondary hover:text-bone'
                }`}
              >
                <Layers
                  className="w-3.5 h-3.5"
                  style={{ color: exhibitionView === 'collection' ? destTheme.accent : undefined }}
                />
                <span>COLLECTION</span>
              </button>
              <button
                type="button"
                onClick={() => setExhibitionView('map')}
                className={`inline-flex items-center space-x-2 px-3.5 py-1.5 font-mono text-xs tracking-[0.16em] uppercase rounded-sm transition-colors ${
                  exhibitionView === 'map'
                    ? 'bg-obsidian text-bone border border-meteorite/80 shadow-sm font-semibold'
                    : 'text-stone-secondary hover:text-bone'
                }`}
              >
                <Globe
                  className="w-3.5 h-3.5"
                  style={{ color: exhibitionView === 'map' ? destTheme.accent : undefined }}
                />
                <span>SURFACE MAP</span>
              </button>
            </div>

            {/* Search Input (Collection Mode) */}
            {exhibitionView === 'collection' && (
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search artifacts, missions, callsigns..."
                  aria-label="Search artifacts"
                  className="w-full bg-surface-raised border border-meteorite pl-10 pr-9 py-2 text-xs font-mono tracking-wider text-bone placeholder:text-stone-muted focus:outline-none focus:border-signal transition-colors rounded-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-muted hover:text-bone p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Filter Toggle & Results Count */}
            {exhibitionView === 'collection' && (
              <div className="flex items-center space-x-3 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => {
                    const next = !isFilterPanelOpen;
                    if (next) soundManager.playNavModalOpen();
                    else soundManager.playNavModalClose();
                    setIsFilterPanelOpen(next);
                  }}
                  className={`inline-flex items-center space-x-2 px-3.5 py-2 border rounded-sm transition-colors uppercase tracking-[0.14em] ${
                    isFilterPanelOpen || hasActiveFilters
                      ? 'border-signal text-signal bg-signal/10'
                      : 'border-meteorite text-stone-secondary hover:text-bone hover:bg-surface'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>FILTERS {hasActiveFilters && '✦'}</span>
                </button>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-stone-muted hover:text-signal transition-colors tracking-widest uppercase text-[10px]"
                  >
                    RESET
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Collapsible Filter Panel */}
          <AnimatePresence>
            {exhibitionView === 'collection' && isFilterPanelOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden border border-meteorite bg-surface-raised p-5 rounded-sm space-y-4"
              >
                {/* Destination Filter */}
                <div className="space-y-2">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-stone-muted uppercase block">
                    DESTINATION / SECTOR
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'moon', 'mars'] as const).map((dId) => {
                      const isSel = selectedDestFilter === dId;
                      const label =
                        dId === 'all'
                          ? 'ALL DESTINATIONS'
                          : dId === 'moon'
                          ? 'THE MOON'
                          : 'MARS';
                      return (
                        <button
                          key={dId}
                          type="button"
                          onClick={() => {
                            setSelectedDestFilter(dId);
                            if (dId === 'moon' || dId === 'mars') {
                              navigation.toExhibition(dId, exhibitionView);
                            }
                          }}
                          className={`px-3 py-1 text-[11px] font-mono tracking-wider uppercase transition-colors rounded-sm border ${
                            isSel
                              ? 'border-signal bg-signal text-obsidian font-semibold'
                              : 'border-meteorite text-stone-secondary hover:text-bone hover:bg-surface'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hardware Category Filter */}
                <div className="space-y-2">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-stone-muted uppercase block">
                    HARDWARE CATEGORY
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {([
                      'all',
                      'Complete Spacecraft',
                      'Hardware Component',
                      'Scientific Instrument',
                      'Landing Equipment',
                    ] as const).map((cat) => {
                      const isSel = selectedCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3 py-1 text-[11px] font-mono tracking-wider uppercase transition-colors rounded-sm border ${
                            isSel
                              ? 'border-signal bg-signal text-obsidian font-semibold'
                              : 'border-meteorite text-stone-secondary hover:text-bone hover:bg-surface'
                          }`}
                        >
                          {cat === 'all' ? 'ALL CATEGORIES' : cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Operational / Physical Status Filter */}
                <div className="space-y-2">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-stone-muted uppercase block">
                    STATUS ON SITE
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {([
                      'all',
                      'abandoned',
                      'inactive',
                      'non-operational',
                      'travelling',
                    ] as const).map((st) => {
                      const isSel = selectedStatus === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setSelectedStatus(st)}
                          className={`px-3 py-1 text-[11px] font-mono tracking-wider uppercase transition-colors rounded-sm border ${
                            isSel
                              ? 'border-signal bg-signal text-obsidian font-semibold'
                              : 'border-meteorite text-stone-secondary hover:text-bone hover:bg-surface'
                          }`}
                        >
                          {st === 'all' ? 'ALL STATUSES' : st}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* 4. Exploration View Canvas: Surface Map vs Collection Gallery */}
        {exhibitionView === 'map' ? (
          <motion.section
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="pt-2"
          >
            <PlanetarySurfaceMap
              initialPlanet={selectedDestFilter === 'mars' ? 'mars' : 'moon'}
              onSelectArtifact={(id) => selectArtifact(id)}
            />
          </motion.section>
        ) : (
          <>
            {/* Featured Exhibit Centerpiece (when applicable) */}
            {featuredArtifact && (
              <motion.div
                layoutId={`exhibit-card-${featuredArtifact.id}`}
                onClick={() => selectArtifact(featuredArtifact.id)}
                className="cursor-pointer group relative border border-meteorite bg-surface-raised overflow-hidden shadow-2xl transition-all duration-300 hover:border-signal"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                  {/* Featured Visual Image */}
                  <div className="lg:col-span-8 relative aspect-[16/10] overflow-hidden bg-surface">
                    <motion.img
                      layoutId={`exhibit-image-${featuredArtifact.id}`}
                      src={featuredArtifact.heroImage}
                      alt={featuredArtifact.name}
                      className="w-full h-full object-cover object-center filter brightness-95 group-hover:brightness-100 group-hover:scale-[1.02] transition-all duration-700 ease-out"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-obsidian/80 via-transparent to-transparent lg:hidden" />

                    {/* Featured Badge */}
                    <span className="absolute top-4 left-4 font-mono text-[10px] tracking-[0.2em] uppercase text-obsidian bg-signal px-3 py-1 font-semibold shadow-md">
                      FEATURED ARTIFACT
                    </span>

                    {/* Category Pill */}
                    <span className="absolute bottom-4 left-4 font-mono text-[9px] tracking-[0.16em] uppercase text-stone-secondary bg-surface/90 px-2.5 py-1 border border-meteorite/60">
                      {featuredArtifact.category}
                    </span>
                  </div>

                  {/* Featured Exhibit Story Content */}
                  <div className="lg:col-span-4 p-8 sm:p-10 flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between font-mono text-[11px] tracking-[0.18em] uppercase">
                        <span style={{ color: getDestinationTheme(featuredArtifact.destination).accent }} className="font-semibold">
                          {featuredArtifact.mission}
                        </span>
                        <span className="text-stone-muted">{featuredArtifact.year}</span>
                      </div>

                      <motion.h2
                        layoutId={`exhibit-title-${featuredArtifact.id}`}
                        className="font-serif text-3xl sm:text-4xl text-bone tracking-tight leading-tight group-hover:text-signal transition-colors"
                      >
                        {featuredArtifact.name}
                      </motion.h2>

                      <p className="font-sans text-xs sm:text-sm text-stone-secondary leading-relaxed font-light">
                        {featuredArtifact.shortDescription}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-meteorite space-y-4">
                      <div className="font-mono text-[10px] tracking-[0.14em] text-stone-muted uppercase flex items-center space-x-2">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: getDestinationTheme(featuredArtifact.destination).accent }}
                        />
                        <span className="truncate">{featuredArtifact.statusLabel}</span>
                      </div>

                      <div className="inline-flex items-center space-x-2.5 font-mono text-xs uppercase tracking-[0.18em] text-signal font-semibold group-hover:translate-x-1 transition-transform">
                        <span>EXAMINE ARTIFACT</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 5. Asymmetric Editorial Exhibit Gallery Grid */}
            <section
              aria-label="Artifact Collection"
              className="grid grid-cols-1 lg:grid-cols-12 gap-y-16 lg:gap-x-12 items-start pt-4"
            >
              {supportingExhibits.length === 0 ? (
                <div className="col-span-12 py-16 text-center space-y-3 border border-meteorite/40 bg-surface/30">
                  <Compass className="w-8 h-8 text-stone-muted mx-auto" />
                  <p className="font-serif text-2xl text-bone">No matching artifacts found.</p>
                  <p className="font-sans text-xs text-stone-secondary font-light max-w-sm mx-auto">
                    No items match your active filters. Try resetting search terms or switching destinations.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="mt-2 px-5 py-2 border border-signal text-signal text-xs font-mono uppercase tracking-widest hover:bg-signal hover:text-obsidian transition-colors"
                  >
                    RESET ALL FILTERS
                  </button>
                </div>
              ) : (
                supportingExhibits.map((artifact, index) => {
                  const itemTheme = getDestinationTheme(artifact.destination);

                  return (
                    <motion.article
                      key={artifact.id}
                      layoutId={`exhibit-card-${artifact.id}`}
                      onClick={() => selectArtifact(artifact.id)}
                      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.55,
                        delay: reducedMotion ? 0 : index * 0.06,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className={`cursor-pointer group ${getAsymmetricLayout(index)} focus:outline-none`}
                    >
                      {/* Photograph Plate */}
                      <div
                        className={`relative w-full ${getAspectClass(index)} overflow-hidden bg-surface border border-meteorite/70 group-hover:border-signal transition-colors duration-400 shadow-xl`}
                      >
                        <motion.img
                          layoutId={`exhibit-image-${artifact.id}`}
                          src={artifact.heroImage}
                          alt={`${artifact.name} — ${artifact.mission}`}
                          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03] brightness-95 group-hover:brightness-100"
                          loading={index < 2 ? 'eager' : 'lazy'}
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-obsidian/75 via-transparent to-transparent" />

                        {/* Plate Index Badge */}
                        <span className="pointer-events-none absolute top-4 left-4 font-mono text-[10px] tracking-[0.2em] text-bone bg-obsidian/85 px-2.5 py-1 border border-meteorite/70">
                          0{index + (featuredArtifact ? 2 : 1)}
                        </span>

                        {/* Category Pill */}
                        <span className="pointer-events-none absolute bottom-4 left-4 font-mono text-[9px] tracking-[0.16em] uppercase text-stone-secondary bg-surface/90 px-2 py-0.5 border border-meteorite/50">
                          {artifact.category}
                        </span>
                      </div>

                      {/* Exhibit Caption Strip */}
                      <div className="pt-5 space-y-2.5 border-b border-meteorite pb-6 group-hover:border-stone-secondary transition-colors duration-300">
                        <div className="flex items-center justify-between font-mono text-[11px] tracking-[0.18em] uppercase">
                          <span style={{ color: itemTheme.accent }} className="font-semibold">
                            {artifact.mission}
                          </span>
                          <span className="text-stone-muted">{artifact.year}</span>
                        </div>

                        <motion.h2
                          layoutId={`exhibit-title-${artifact.id}`}
                          className="font-serif text-2xl sm:text-3xl text-bone tracking-tight transition-colors duration-300 group-hover:text-signal"
                        >
                          {artifact.name}
                        </motion.h2>

                        <p className="font-sans text-xs sm:text-sm text-stone-secondary leading-relaxed font-light max-w-xl">
                          {artifact.shortDescription}
                        </p>

                        <div
                          className="pt-2 inline-flex items-center space-x-2.5 font-mono text-[11px] tracking-[0.2em] uppercase transition-colors"
                          style={{ color: itemTheme.accent }}
                        >
                          <span>EXAMINE ARTIFACT</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform duration-200" />
                        </div>
                      </div>
                    </motion.article>
                  );
                })
              )}
            </section>
          </>
        )}
      </main>

      {/* 6. SIGNATURE INTERACTION — EXPANDED ARTIFACT DETAIL OVERLAY */}
      <AnimatePresence>
        {selectedArtifactId && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Translucent Blurred Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              onClick={returnToExhibition}
              className="fixed inset-0 bg-obsidian/85 backdrop-blur-xl"
            />

            {/* Seamless Expanded Presentation Container */}
            <motion.div
              layoutId={`exhibit-card-${selectedArtifactId}`}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 min-h-screen"
            >
              <ScreenArtifactDetails onClose={returnToExhibition} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
