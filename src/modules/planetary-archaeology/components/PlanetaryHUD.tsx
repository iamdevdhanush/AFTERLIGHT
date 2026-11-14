import React, { useState } from 'react';
import {
  ArrowLeft,
  Compass,
  Filter,
  MapPin,
  Search,
  ChevronRight,
  X,
  Layers,
  BookOpen,
  Cpu,
  Award,
} from 'lucide-react';
import { PlanetaryBody, PlanetarySite } from '../types/planetary';
import { PlanetarySearch } from './PlanetarySearch';
import { CATEGORY_STYLES } from './PlanetaryMarkers';

interface PlanetaryHUDProps {
  planet: PlanetaryBody;
  sites: PlanetarySite[];
  selectedSite: PlanetarySite | null;
  onSelectSite: (site: PlanetarySite, targetPlanet?: PlanetaryBody) => void;
  cursorCoords: { lat: number; lon: number; elevationMeters: number | null } | null;
  onExit: () => void;
  onOpenFilters: () => void;
  activeFilterCount: number;
  onOpenStories?: () => void;
  onOpenStudio?: () => void;
  onOpenEducationalHub?: () => void;
}

export const PlanetaryHUD: React.FC<PlanetaryHUDProps> = ({
  planet,
  sites,
  selectedSite,
  onSelectSite,
  cursorCoords,
  onExit,
  onOpenFilters,
  activeFilterCount,
  onOpenStories,
  onOpenStudio,
  onOpenEducationalHub,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [directorySearch, setDirectorySearch] = useState('');

  const filteredDirectorySites = sites.filter((site) => {
    if (!directorySearch.trim()) return true;
    const q = directorySearch.toLowerCase().trim();
    return (
      site.name.toLowerCase().includes(q) ||
      site.mission.toLowerCase().includes(q) ||
      site.regionalFeature.toLowerCase().includes(q) ||
      site.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30 flex flex-col justify-between p-4 sm:p-8">
      {/* 1. Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Brand, Return Button, & Body Badge */}
        <div className="flex items-center space-x-3 pointer-events-auto">
          <button
            type="button"
            onClick={onExit}
            className="flex items-center space-x-2 px-3 py-1.5 bg-[#0D121C]/90 hover:bg-[#1A2333] text-stone-300 hover:text-white rounded-lg border border-[#222E42] text-xs font-mono tracking-wider uppercase transition-colors shadow-lg"
            title="Return to AFTERLIGHT Museum"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AFTERLIGHT MUSEUM</span>
          </button>

          <div className="h-4 w-px bg-[#222E42]" />

          <div className="flex items-center space-x-2 font-mono text-xs tracking-wider">
            <span className="text-white font-semibold uppercase">3D ARCHAEOLOGY</span>
            <span className="text-stone-500">•</span>
            <span
              className={`font-bold ${
                planet === 'moon' ? 'text-slate-300' : 'text-orange-400'
              }`}
            >
              {planet === 'moon' ? 'THE MOON' : 'MARS'}
            </span>
          </div>
        </div>

        {/* Center: Global Autocomplete Search Bar */}
        <div className="flex-1 max-w-lg mx-auto w-full">
          <PlanetarySearch
            currentPlanet={planet}
            onSelectSite={(site, targetPlanet) => onSelectSite(site, targetPlanet)}
          />
        </div>

        {/* Right: Actions, Studio, Stories, Filters & Archive Directory Buttons */}
        <div className="flex items-center space-x-1.5 pointer-events-auto self-end md:self-auto">
          {/* Mission Stories Trigger */}
          {onOpenStories && (
            <button
              type="button"
              onClick={onOpenStories}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#0D121C]/90 hover:bg-[#1A2333] text-amber-300 hover:text-amber-200 rounded-lg border border-amber-500/30 text-xs font-mono tracking-wider uppercase transition-all shadow-lg"
              title="Open 7-Chapter Mission Storytelling Chronicles"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">CHRONICLES</span>
            </button>
          )}

          {/* 3D Hardware Inspection Studio Trigger */}
          {onOpenStudio && (
            <button
              type="button"
              onClick={onOpenStudio}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#0D121C]/90 hover:bg-[#1A2333] text-stone-200 hover:text-white rounded-lg border border-[#222E42] text-xs font-mono tracking-wider uppercase transition-all shadow-lg"
              title="Open 3D Hardware Inspection Studio"
            >
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">3D STUDIO</span>
            </button>
          )}

          {/* Educational Academy Trigger */}
          {onOpenEducationalHub && (
            <button
              type="button"
              onClick={onOpenEducationalHub}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#0D121C]/90 hover:bg-[#1A2333] text-stone-200 hover:text-white rounded-lg border border-[#222E42] text-xs font-mono tracking-wider uppercase transition-all shadow-lg"
              title="Planetary Academy: Glossary, Comparisons, Quiz"
            >
              <Award className="w-3.5 h-3.5 text-[#63F0C8]" />
              <span className="hidden sm:inline">ACADEMY</span>
            </button>
          )}

          {/* Hardware Filter Drawer Trigger */}
          <button
            type="button"
            onClick={onOpenFilters}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-mono tracking-wider uppercase transition-all shadow-lg ${
              activeFilterCount > 0
                ? 'bg-[#182436] border-[#63F0C8] text-white'
                : 'bg-[#0D121C]/90 hover:bg-[#1A2333] border-[#222E42] text-stone-300 hover:text-white'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-[#63F0C8]" />
            <span className="hidden sm:inline">FILTERS</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#63F0C8] text-[#080B10] font-bold text-[9px] flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Directory Drawer Trigger */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="flex items-center space-x-2 px-3.5 py-1.5 bg-[#0D121C]/90 hover:bg-[#1A2333] text-stone-200 hover:text-white rounded-lg border border-[#222E42] text-xs font-mono tracking-wider uppercase transition-colors shadow-lg"
          >
            <Compass className="w-3.5 h-3.5 text-[#63F0C8]" />
            <span className="hidden sm:inline">DIRECTORY</span>
            <span className="font-bold text-[#63F0C8]">({sites.length})</span>
          </button>
        </div>
      </div>

      {/* 2. Collapsible Archive Directory Drawer */}
      {isDrawerOpen && (
        <div className="absolute top-24 right-4 sm:right-8 w-80 sm:w-96 max-h-[70vh] bg-[#090D14]/95 backdrop-blur-xl border border-[#222E42] rounded-xl p-4 shadow-2xl flex flex-col pointer-events-auto overflow-hidden animate-slide-left z-40">
          <div className="flex items-center justify-between pb-3 border-b border-[#1C2636]">
            <span className="font-mono text-xs uppercase tracking-wider text-white font-semibold">
              DOCUMENTED HARDWARE DIRECTORY ({sites.length})
            </span>
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="p-1 rounded hover:bg-white/10 text-stone-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Search inside directory */}
          <div className="my-3 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="Filter by name, rover, site..."
              value={directorySearch}
              onChange={(e) => setDirectorySearch(e.target.value)}
              className="w-full bg-black/50 border border-[#1F2C3F] rounded-lg px-8 py-1.5 text-xs text-white placeholder-stone-500 font-sans focus:outline-none focus:border-[#63F0C8]"
            />
          </div>

          {/* Site List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-96">
            {filteredDirectorySites.map((site) => {
              const isSelected = selectedSite?.id === site.id;
              const cat = CATEGORY_STYLES[site.category] || CATEGORY_STYLES.lander;

              return (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => {
                    onSelectSite(site, site.planet);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg transition-all flex items-center justify-between border ${
                    isSelected
                      ? 'bg-[#182436] border-[#63F0C8] shadow-md'
                      : 'bg-black/30 border-white/5 hover:bg-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="flex items-center space-x-1.5">
                      <span
                        className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold uppercase tracking-wider flex-shrink-0"
                        style={{ backgroundColor: `${cat.primary}25`, color: cat.primary }}
                      >
                        {cat.label}
                      </span>
                      <span className="font-mono text-[11px] text-white font-medium truncate block">
                        {site.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1 font-mono text-[9px] text-stone-400">
                      <span>{site.mission} ({site.year})</span>
                      <span>•</span>
                      <span>{site.latitudeFormatted}, {site.longitudeFormatted}</span>
                      <span>•</span>
                      <span className="text-[#63F0C8]">{site.elevationMeters > 0 ? `+${site.elevationMeters}` : site.elevationMeters}m</span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-500 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Bottom Telemetry Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between font-mono text-xs text-stone-400 pt-3 border-t border-[#1C2636] bg-[#05070A]/85 backdrop-blur-md -mx-4 sm:-mx-8 -mb-4 sm:-mb-8 p-3 sm:px-8">
        {/* Real-time Cursor Geospatial Readout */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="text-[#63F0C8] font-bold">LAT/LON:</span>
            <span className="text-white">
              {cursorCoords
                ? `${cursorCoords.lat >= 0 ? cursorCoords.lat.toFixed(3) + '°N' : Math.abs(cursorCoords.lat).toFixed(3) + '°S'}, ${cursorCoords.lon >= 0 ? cursorCoords.lon.toFixed(3) + '°E' : Math.abs(cursorCoords.lon).toFixed(3) + '°W'}`
                : 'HOVER PLANET'}
            </span>
          </div>

          <span className="text-stone-600">•</span>

          <div className="flex items-center space-x-1.5">
            <span className="text-[#63F0C8] font-bold">ALTIMETRY:</span>
            <span className="text-white">
              {cursorCoords?.elevationMeters !== null && cursorCoords?.elevationMeters !== undefined
                ? `${cursorCoords.elevationMeters > 0 ? '+' : ''}${cursorCoords.elevationMeters.toLocaleString()} m`
                : '—'}
            </span>
          </div>
        </div>

        {/* User Interaction Instructions */}
        <div className="mt-2 sm:mt-0 text-[10px] text-stone-500">
          <span>LEFT-DRAG TO ROTATE · SCROLL TO ZOOM · CLICK ANY SYMBOL TO DISCOVER DOCUMENTED HARDWARE</span>
        </div>
      </div>
    </div>
  );
};
