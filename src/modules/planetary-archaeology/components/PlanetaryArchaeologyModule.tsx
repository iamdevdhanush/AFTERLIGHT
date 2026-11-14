import React, { useState, useMemo } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import {
  PlanetaryBody,
  ImageryLayerType,
  PlanetarySite,
  HardwareFilterOptions,
} from '../types/planetary';
import { getSitesForPlanet, ALL_PLANETARY_SITES } from '../data/planetarySites';
import { getTraversesForPlanet } from '../data/roverTraverses';
import { PlanetaryGlobeCanvas } from './PlanetaryGlobeCanvas';
import { ArtifactDiscoveryPanel } from './ArtifactDiscoveryPanel';
import { RegionalTerrainInspector } from './RegionalTerrainInspector';
import { HardwareFilterDrawer } from './HardwareFilterDrawer';
import { MissionStorytellingExperience } from './MissionStorytellingExperience';
import { HardwareInspectionStudio } from './HardwareInspectionStudio';
import { EducationalHubModal } from './EducationalHubModal';

interface PlanetaryArchaeologyModuleProps {
  initialPlanet?: PlanetaryBody;
  onExit: () => void;
}

export const PlanetaryArchaeologyModule: React.FC<PlanetaryArchaeologyModuleProps> = ({
  initialPlanet = 'moon',
  onExit,
}) => {
  const [planet, setPlanet] = useState<PlanetaryBody>(initialPlanet);
  const [activeLayerType, setActiveLayerType] = useState<ImageryLayerType>('visible');
  const [terrainExaggeration, setTerrainExaggeration] = useState<number>(1.0);
  const [showGraticule, setShowGraticule] = useState<boolean>(false);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);

  const [selectedSite, setSelectedSite] = useState<PlanetarySite | null>(null);
  const [hoveredSiteId, setHoveredSiteId] = useState<string | null>(null);
  const [isInspectingTerrain, setIsInspectingTerrain] = useState<boolean>(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);

  // Phase 3 States: Mission Storytelling, 3D Studio, Educational Hub, Camera Cues
  const [activeMissionStoryId, setActiveMissionStoryId] = useState<string | null>(null);
  const [isInspectionStudioOpen, setIsInspectionStudioOpen] = useState<boolean>(false);
  const [inspectionArtifactId, setInspectionArtifactId] = useState<string>('apollo11_eagle');
  const [isEducationalHubOpen, setIsEducationalHubOpen] = useState<boolean>(false);
  const [cameraCue, setCameraCue] = useState<{
    lat: number;
    lon: number;
    altitudeUnits: number;
  } | null>(null);

  const [cursorCoords, setCursorCoords] = useState<{
    lat: number;
    lon: number;
    elevationMeters: number | null;
  } | null>(null);

  // Filter state
  const [filters, setFilters] = useState<HardwareFilterOptions>({
    planet: 'all',
    searchQuery: '',
    category: 'all',
    disposition: 'all',
    status: 'all',
    confidence: 'all',
    yearRange: [1959, 2024],
    mission: 'all',
  });

  // Base sites & traverses for active planet
  const allPlanetSites = useMemo(() => getSitesForPlanet(planet), [planet]);
  const activeTraverses = useMemo(() => getTraversesForPlanet(planet), [planet]);

  // Distinct mission list for the filter dropdown
  const availableMissions = useMemo(() => {
    const set = new Set<string>();
    allPlanetSites.forEach((s) => set.add(s.mission));
    return Array.from(set).sort();
  }, [allPlanetSites]);

  // Active filter count (excluding default values)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category !== 'all') count++;
    if (filters.disposition !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.confidence !== 'all') count++;
    if (filters.mission !== 'all') count++;
    if (filters.yearRange[0] > 1959 || filters.yearRange[1] < 2024) count++;
    return count;
  }, [filters]);

  // Filtered sites applying all user criteria
  const filteredSites = useMemo(() => {
    return allPlanetSites.filter((site) => {
      // 1. Hardware Category filter
      if (filters.category !== 'all' && site.category !== filters.category) {
        return false;
      }
      // 2. Hardware Disposition filter (separate from status!)
      if (filters.disposition !== 'all' && site.disposition !== filters.disposition) {
        return false;
      }
      // 3. Operational Status filter
      if (filters.status !== 'all' && site.status !== filters.status) {
        return false;
      }
      // 4. Location Confidence filter
      if (filters.confidence !== 'all' && site.locationConfidence !== filters.confidence) {
        return false;
      }
      // 5. Mission filter
      if (filters.mission !== 'all' && site.mission !== filters.mission) {
        return false;
      }
      // 6. Launch Year Range filter
      if (site.year < filters.yearRange[0] || site.year > filters.yearRange[1]) {
        return false;
      }

      return true;
    });
  }, [allPlanetSites, filters]);

  // Handle switching between Moon and Mars
  const handleSelectPlanet = (newPlanet: PlanetaryBody) => {
    if (newPlanet === planet) return;
    setPlanet(newPlanet);
    setSelectedSite(null);
    setIsInspectingTerrain(false);
    setCameraCue(null);
  };

  // Handle selecting a site (from marker click, directory click, or search selection)
  const handleSelectSite = (site: PlanetarySite, targetPlanet?: PlanetaryBody) => {
    if (targetPlanet && targetPlanet !== planet) {
      setPlanet(targetPlanet);
    }
    setSelectedSite(site);
    setIsAutoRotating(false); // Pause auto-rotation when focusing on an artifact
    setCameraCue(null);
  };

  // Handle closing discovery panel
  const handleClosePanel = () => {
    setSelectedSite(null);
    setIsInspectingTerrain(false);
    setCameraCue(null);
  };

  // Handle opening 7-chapter storytelling experience
  const handleOpenCompleteStory = (storyId: string) => {
    setActiveMissionStoryId(storyId);
  };

  // Handle camera synchronization from story chapters
  const handleStoryCameraCue = (
    lat: number,
    lon: number,
    altitudeUnits: number,
    storyPlanet: PlanetaryBody
  ) => {
    if (storyPlanet !== planet) {
      setPlanet(storyPlanet);
    }
    setCameraCue({ lat, lon, altitudeUnits });
    setIsAutoRotating(false);
  };

  // Handle opening 3D Hardware Inspection Studio
  const handleOpenStudio = (artifactId?: string) => {
    const idToUse = artifactId || (planet === 'moon' ? 'apollo11_eagle' : 'opportunity');
    setInspectionArtifactId(idToUse);
    setIsInspectionStudioOpen(true);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#05070A] text-white font-sans select-none">
      {/* 1. 3D WebGL Planetary Globe Canvas with Rover Traverses, Markers & Camera Sync */}
      <PlanetaryGlobeCanvas
        planet={planet}
        activeLayerType={activeLayerType}
        terrainExaggeration={terrainExaggeration}
        showGraticule={showGraticule}
        isAutoRotating={isAutoRotating}
        sites={filteredSites}
        traverses={activeTraverses}
        selectedSite={selectedSite}
        hoveredSiteId={hoveredSiteId}
        onHoverSite={setHoveredSiteId}
        onSelectSite={(s) => handleSelectSite(s)}
        onPointerCoordinate={setCursorCoords}
        cameraCue={cameraCue}
      />

      {/* NASA Trek Technical Header Box (Matching Reference Screenshots) */}
      <div className="absolute top-6 left-6 z-30 pointer-events-none select-none">
        <div className="border border-[#B45309]/60 bg-black/45 backdrop-blur-[2px] px-3.5 py-2.5 shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]" />
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#F59E0B] font-semibold">
              3D {planet === 'moon' ? 'MOON' : 'MARS'} ORBITAL GLOBE
            </span>
          </div>
          <div className="font-mono text-[9px] tracking-[0.14em] uppercase text-[#F59E0B]/70">
            DRAG TO ROTATE GLOBE · SCROLL TO ZOOM · CLICK BEACON PIN FOR DOSSIER
          </div>
        </div>

        {/* Exit link below technical box */}
        <div className="mt-2 pointer-events-auto">
          <button
            onClick={onExit}
            className="font-mono text-[9px] tracking-[0.14em] uppercase text-stone-500 hover:text-amber-400 transition-colors flex items-center gap-1.5 px-2 py-1 bg-black/40 border border-stone-800/60 hover:border-amber-500/40"
          >
            ← MUSEUM CATALOG
          </button>
        </div>
      </div>

      {/* Top-right: Planet Switcher & Minimal Phase 3 Explorer Links */}
      <div className="absolute top-6 right-6 z-30 flex flex-col items-end gap-2 pointer-events-auto select-none">
        <div className="flex items-center gap-1.5 bg-black/50 border border-stone-800/80 p-0.5 shadow-md">
          {(['moon', 'mars'] as PlanetaryBody[]).map((p) => (
            <button
              key={p}
              onClick={() => handleSelectPlanet(p)}
              className={`font-mono text-[10px] tracking-[0.16em] uppercase px-3 py-1 transition-all duration-200 ${
                planet === p
                  ? 'bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : 'text-stone-500 hover:text-stone-300 border border-transparent'
              }`}
            >
              {p === 'moon' ? 'MOON' : 'MARS'}
            </button>
          ))}
        </div>

        {/* Minimal Explorer Action Shortcuts */}
        <div className="flex items-center gap-2.5 font-mono text-[8.5px] tracking-[0.12em] uppercase text-stone-500 bg-black/40 px-2 py-1 border border-stone-800/40">
          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className="hover:text-amber-400 transition-colors flex items-center gap-1"
          >
            {activeFilterCount > 0 && (
              <span className="w-3.5 h-3.5 rounded-full bg-amber-400 text-black text-[7px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            FILTERS
          </button>
          <span className="text-stone-700">·</span>
          <button
            onClick={() => handleOpenCompleteStory(planet === 'moon' ? 'apollo11_eagle' : 'opportunity')}
            className="hover:text-amber-400 transition-colors"
          >
            STORIES
          </button>
          <span className="text-stone-700">·</span>
          <button
            onClick={() => handleOpenStudio()}
            className="hover:text-amber-400 transition-colors"
          >
            3D STUDIO
          </button>
          <span className="text-stone-700">·</span>
          <button
            onClick={() => setIsEducationalHubOpen(true)}
            className="hover:text-amber-400 transition-colors"
          >
            ACADEMY
          </button>
        </div>
      </div>

      {/* Bottom Attribution Bar (Matching Reference Screenshots) */}
      <div className="absolute bottom-0 left-0 right-0 z-30 px-6 py-3 flex items-center justify-between pointer-events-none select-none bg-gradient-to-t from-black/90 via-black/40 to-transparent">
        <div className="font-mono text-[9px] tracking-[0.12em] text-stone-500">
          NASA Planetary Data System (PDS) &amp; Solar System Treks (trek.nasa.gov) · USGS Astrogeology Science Center
        </div>
        <div className="flex items-center gap-4 pointer-events-auto">
          <a
            href="https://trek.nasa.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[9px] tracking-[0.12em] text-stone-500 hover:text-amber-400 transition-colors duration-200"
          >
            NASA Treks Portal ↗
          </a>
          <span className="text-stone-700">·</span>
          <a
            href={planet === 'moon' ? 'https://quickmap.lroc.asu.edu' : 'https://trek.nasa.gov/mars'}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[9px] tracking-[0.12em] text-stone-500 hover:text-amber-400 transition-colors duration-200"
          >
            {planet === 'moon' ? 'LROC QuickMap' : 'Mars Trek'}
          </a>

          {/* Settings / Controls Toggle Icon (Matches circular button in reference screenshot) */}
          <button
            type="button"
            onClick={() => setIsFilterDrawerOpen((prev) => !prev)}
            title="Toggle Filter & Hardware Tools"
            className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-200 ml-1 ${
              isFilterDrawerOpen || activeFilterCount > 0
                ? 'border-amber-400 text-amber-400 bg-amber-400/20'
                : 'border-stone-800 bg-black/60 text-stone-500 hover:text-stone-300 hover:border-stone-600'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5. Comprehensive Artifact Discovery Panel (Right Drawer) */}
      {selectedSite && !activeMissionStoryId && !isInspectionStudioOpen && !isEducationalHubOpen && (
        <ArtifactDiscoveryPanel
          site={selectedSite}
          onClose={handleClosePanel}
          onInspectTerrain={() => setIsInspectingTerrain(!isInspectingTerrain)}
          onReframeCamera={() => handleSelectSite(selectedSite)}
          onOpenCompleteStory={handleOpenCompleteStory}
          onOpenHardwareInspection={handleOpenStudio}
        />
      )}

      {/* 6. Regional Terrain Altimetry Inspector */}
      {isInspectingTerrain && selectedSite && (
        <RegionalTerrainInspector
          site={selectedSite}
          planet={planet}
          onClose={() => setIsInspectingTerrain(false)}
        />
      )}

      {/* 7. Slide-Out Forgotten Hardware Filters Drawer */}
      <HardwareFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onChangeFilters={setFilters}
        totalSitesCount={allPlanetSites.length}
        filteredSitesCount={filteredSites.length}
        availableMissions={availableMissions}
      />

      {/* 8. Phase 3: 7-Chapter Mission Storytelling Experience */}
      {activeMissionStoryId && (
        <MissionStorytellingExperience
          storyId={activeMissionStoryId}
          onClose={() => {
            setActiveMissionStoryId(null);
            setCameraCue(null);
          }}
          onCameraCue={handleStoryCameraCue}
          onOpenHardwareInspection={(id) => {
            handleOpenStudio(id);
          }}
          onSelectStory={(id) => setActiveMissionStoryId(id)}
        />
      )}

      {/* 9. Phase 3: 3D Hardware Inspection Studio (Turntable, Exploded View, NASA Badge) */}
      {isInspectionStudioOpen && (
        <HardwareInspectionStudio
          initialArtifactId={inspectionArtifactId}
          onClose={() => setIsInspectionStudioOpen(false)}
        />
      )}

      {/* 10. Phase 3: Educational Hub (Glossary, Mission Comparisons, Knowledge Challenge) */}
      {isEducationalHubOpen && (
        <EducationalHubModal
          onClose={() => setIsEducationalHubOpen(false)}
          initialTab="glossary"
        />
      )}
    </div>
  );
};
