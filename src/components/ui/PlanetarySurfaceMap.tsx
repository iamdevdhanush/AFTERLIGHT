import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Compass,
  MapPin,
  Crosshair,
  Layers,
  ArrowRight,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';
import { useExperienceStore } from '../../store/useExperienceStore';
import { navigation } from '../../navigation/navigationController';
import { ARTIFACTS } from '../../data/artifacts';
import { DESTINATIONS } from '../../data/destinations';
import { ArtifactData } from '../../types';
import { soundManager } from '../../audio/SoundManager';

interface PlanetarySurfaceMapProps {
  initialPlanet?: 'moon' | 'mars';
  onSelectArtifact?: (artifactId: string) => void;
}

interface SiteMarkerData {
  artifact: ArtifactData;
  xPercent: number; // 0 to 100
  yPercent: number; // 0 to 100
  latDecimal: number;
  lonDecimal: number;
}

/**
 * Verified landing coordinates math:
 * Equirectangular 2:1 cylindrical projection
 * Lon: -180° W to +180° E  -->  X = (Lon + 180) / 360 * 100
 * Lat: +90° N to -90° S    -->  Y = (90 - Lat) / 180 * 100
 */
const SURFACE_SITES: Record<'moon' | 'mars', SiteMarkerData[]> = {
  moon: [
    {
      artifact: ARTIFACTS.apollo11_eagle,
      latDecimal: 0.67408,
      lonDecimal: 23.47297,
      xPercent: ((23.47297 + 180) / 360) * 100, // 56.52%
      yPercent: ((90 - 0.67408) / 180) * 100, // 49.63%
    },
    {
      artifact: ARTIFACTS.apollo_lrv,
      latDecimal: 26.1322,
      lonDecimal: 3.6339,
      xPercent: ((3.6339 + 180) / 360) * 100, // 51.01%
      yPercent: ((90 - 26.1322) / 180) * 100, // 35.48%
    },
    {
      artifact: ARTIFACTS.surveyor3,
      latDecimal: -3.016,
      lonDecimal: -23.418,
      xPercent: ((-23.418 + 180) / 360) * 100, // 43.50%
      yPercent: ((90 - -3.016) / 180) * 100, // 51.68%
    },
    {
      artifact: ARTIFACTS.apollo_alsep,
      latDecimal: -3.009,
      lonDecimal: -23.425,
      // Apollo 12 ALSEP is 180m from Surveyor 3. We apply a slight visual display offset (+0.8%)
      // so visitors can cleanly inspect both distinct markers on the overview map.
      xPercent: ((-23.425 + 180) / 360) * 100 + 0.8,
      yPercent: ((90 - -3.009) / 180) * 100 - 0.6,
    },
  ],
  mars: [
    {
      artifact: ARTIFACTS.sojourner,
      latDecimal: 19.13,
      lonDecimal: -33.22,
      xPercent: ((-33.22 + 180) / 360) * 100, // 40.77%
      yPercent: ((90 - 19.13) / 180) * 100, // 39.37%
    },
    {
      artifact: ARTIFACTS.spirit,
      latDecimal: -14.5718,
      lonDecimal: 175.4785,
      xPercent: ((175.4785 + 180) / 360) * 100, // 98.74%
      yPercent: ((90 - -14.5718) / 180) * 100, // 58.10%
    },
    {
      artifact: ARTIFACTS.opportunity,
      latDecimal: -2.34,
      lonDecimal: -5.33, // 354.67° E = -5.33° W
      xPercent: ((-5.33 + 180) / 360) * 100, // 48.52%
      yPercent: ((90 - -2.34) / 180) * 100, // 51.30%
    },
    {
      artifact: ARTIFACTS.insight,
      latDecimal: 4.502,
      lonDecimal: 135.623,
      xPercent: ((135.623 + 180) / 360) * 100, // 87.67%
      yPercent: ((90 - 4.502) / 180) * 100, // 47.50%
    },
  ],
};

const PLANET_METADATA = {
  moon: {
    name: 'THE MOON',
    sector: 'NEAR SIDE & EQUATORIAL BASINS',
    texture: '/textures/moon/lroc_color_2k.jpg',
    accentColor: '#DEB275',
    sensorAgency: 'NASA LROC (Lunar Reconnaissance Orbiter Camera)',
    projection: 'Equirectangular Cylindrical (2048 × 1024)',
    sitesCount: 4,
  },
  mars: {
    name: 'MARS',
    sector: 'CHRYSE, MERIDIANI, GUSEV & ELYSIUM',
    texture: '/textures/mars/mars_color_2k.jpg',
    accentColor: '#F05A38',
    sensorAgency: 'NASA MGS / Viking Mars Global Color Mosaic',
    projection: 'Equirectangular Cylindrical (2048 × 1024)',
    sitesCount: 4,
  },
};

export const PlanetarySurfaceMap: React.FC<PlanetarySurfaceMapProps> = ({
  initialPlanet = 'moon',
  onSelectArtifact,
}) => {
  const currentDestination = useExperienceStore((s) => s.currentDestination);
  const selectArtifact = useExperienceStore((s) => s.selectArtifact);
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);

  // Active planet tab
  const [activePlanet, setActivePlanet] = useState<'moon' | 'mars'>(
    initialPlanet === 'mars' || currentDestination === 'mars' ? 'mars' : 'moon'
  );

  // Sync active planet tab with store/prop changes
  useEffect(() => {
    const valid = currentDestination === 'mars' || initialPlanet === 'mars' ? 'mars' : 'moon';
    setActivePlanet(valid);
  }, [currentDestination, initialPlanet]);

  // Pan and Zoom Transform State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

  // Overlays
  const [showGrid, setShowGrid] = useState(true);
  const [hoveredSite, setHoveredSite] = useState<SiteMarkerData | null>(null);
  const [cursorCoords, setCursorCoords] = useState<{ lat: string; lon: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const planetMeta = PLANET_METADATA[activePlanet];
  const sites = SURFACE_SITES[activePlanet];

  // Reset zoom & pan when switching planet
  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handlePlanetChange = (planet: 'moon' | 'mars') => {
    if (planet !== activePlanet) {
      if (planet === 'mars') soundManager.playNavMarsSelected();
      else soundManager.playNavMoonSelected();
    }
    setActivePlanet(planet);
    handleResetView();
    setHoveredSite(null);
    if (currentDestination !== planet) {
      navigation.toExhibition(planet, 'map', true);
    }
  };

  // Zoom controls (clamped 1x to 4x)
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  // Dragging to pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // 1. Coordinate tracking under cursor
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      // Unproject taking zoom and pan into account
      const normX = (clientX - rect.width / 2 - pan.x) / (rect.width * zoom) + 0.5;
      const normY = (clientY - rect.height / 2 - pan.y) / (rect.height * zoom) + 0.5;

      if (normX >= 0 && normX <= 1 && normY >= 0 && normY <= 1) {
        const lon = normX * 360 - 180;
        const lat = 90 - normY * 180;
        const latStr = `${Math.abs(lat).toFixed(1)}° ${lat >= 0 ? 'N' : 'S'}`;
        const lonStr = `${Math.abs(lon).toFixed(1)}° ${lon >= 0 ? 'E' : 'W'}`;
        setCursorCoords({ lat: latStr, lon: lonStr });
      } else {
        setCursorCoords(null);
      }
    }

    // 2. Pan updating
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    // Constrain pan within zoomed bounds
    const maxPanX = ((zoom - 1) * (containerRef.current?.clientWidth || 800)) / 2;
    const maxPanY = ((zoom - 1) * (containerRef.current?.clientHeight || 400)) / 2;

    const newX = Math.max(-maxPanX, Math.min(maxPanX, panStartRef.current.x + dx));
    const newY = Math.max(-maxPanY, Math.min(maxPanY, panStartRef.current.y + dy));

    setPan({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Focus directly onto a site
  const handleFocusSite = (site: SiteMarkerData) => {
    const targetZoom = 2.5;
    setZoom(targetZoom);
    if (containerRef.current) {
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      // Calculate pan offset to bring marker to center
      const offsetX = -(site.xPercent / 100 - 0.5) * (width * targetZoom);
      const offsetY = -(site.yPercent / 100 - 0.5) * (height * targetZoom);

      const maxPanX = ((targetZoom - 1) * width) / 2;
      const maxPanY = ((targetZoom - 1) * height) / 2;

      setPan({
        x: Math.max(-maxPanX, Math.min(maxPanX, offsetX)),
        y: Math.max(-maxPanY, Math.min(maxPanY, offsetY)),
      });
    }
    setHoveredSite(site);
  };

  // Open detailed artifact view
  const handleInspectArtifact = (artifactId: string) => {
    if (onSelectArtifact) {
      onSelectArtifact(artifactId);
    } else {
      selectArtifact(artifactId);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* 1. Header Toolbar: Planet Switcher, Mode Toggles & Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-meteorite pb-4">
        {/* Planet Tabs */}
        <div className="inline-flex items-center space-x-1 p-1 bg-surface border border-meteorite rounded-sm">
          <button
            type="button"
            onClick={() => handlePlanetChange('moon')}
            className={`px-3.5 py-1.5 font-mono text-xs tracking-[0.16em] uppercase rounded-sm transition-colors ${
              activePlanet === 'moon'
                ? 'bg-obsidian text-[#DEB275] border border-[#DEB275]/50 shadow-sm font-semibold'
                : 'text-stone-secondary hover:text-bone'
            }`}
          >
            THE MOON (4 SITES)
          </button>
          <button
            type="button"
            onClick={() => handlePlanetChange('mars')}
            className={`px-3.5 py-1.5 font-mono text-xs tracking-[0.16em] uppercase rounded-sm transition-colors ${
              activePlanet === 'mars'
                ? 'bg-obsidian text-[#F05A38] border border-[#F05A38]/50 shadow-sm font-semibold'
                : 'text-stone-secondary hover:text-bone'
            }`}
          >
            MARS (4 SITES)
          </button>
        </div>

        {/* Map View Controls & Coordinate HUD */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          {cursorCoords && (
            <div className="hidden md:flex items-center space-x-1.5 text-stone-muted px-2.5 py-1 bg-surface-raised border border-meteorite rounded-sm text-[11px]">
              <Crosshair className="w-3 h-3 text-stone-secondary" />
              <span>
                {cursorCoords.lat} · {cursorCoords.lon}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Latitude / Longitude Grid"
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 border rounded-sm transition-colors uppercase tracking-wider text-[11px] ${
              showGrid
                ? 'border-[#DEB275] text-[#DEB275] bg-[#DEB275]/10'
                : 'border-meteorite text-stone-muted hover:text-bone'
            }`}
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>GRID {showGrid ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Map Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`relative w-full aspect-[2/1] min-h-[360px] max-h-[580px] bg-[#0A0D0E] border border-meteorite overflow-hidden select-none ${
          zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-crosshair'
        }`}
      >
        {/* Orbital Basemap Image Canvas */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.25s ease-out',
          }}
          className="relative w-full h-full"
        >
          <img
            src={planetMeta.texture}
            alt={planetMeta.name}
            className="w-full h-full object-fill pointer-events-none"
            draggable={false}
          />

          {/* Coordinate Grid Overlay */}
          {showGrid && (
            <div className="absolute inset-0 pointer-events-none opacity-40">
              {/* Latitude parallels (every 30°) */}
              <div className="absolute inset-x-0 top-[16.66%] border-b border-stone-muted/30 border-dashed" />
              <div className="absolute inset-x-0 top-[33.33%] border-b border-stone-muted/30 border-dashed" />
              <div className="absolute inset-x-0 top-[50%] border-b border-amber-accent/50" />
              <div className="absolute inset-x-0 top-[66.66%] border-b border-stone-muted/30 border-dashed" />
              <div className="absolute inset-x-0 top-[83.33%] border-b border-stone-muted/30 border-dashed" />

              {/* Longitude meridians (every 60°) */}
              <div className="absolute inset-y-0 left-[16.66%] border-r border-stone-muted/30 border-dashed" />
              <div className="absolute inset-y-0 left-[33.33%] border-r border-stone-muted/30 border-dashed" />
              <div className="absolute inset-y-0 left-[50%] border-r border-amber-accent/50" />
              <div className="absolute inset-y-0 left-[66.66%] border-r border-stone-muted/30 border-dashed" />
              <div className="absolute inset-y-0 left-[83.33%] border-r border-stone-muted/30 border-dashed" />

              {/* Equator & Prime Meridian Labels */}
              <div className="absolute left-2 top-[48%] font-mono text-[8px] text-stone-muted uppercase tracking-widest">
                EQUATOR 0°
              </div>
              <div className="absolute left-[50.5%] top-2 font-mono text-[8px] text-stone-muted uppercase tracking-widest">
                0° MERIDIAN
              </div>
            </div>
          )}

          {/* Interactive Landing Site Markers */}
          {sites.map((site) => {
            const isHovered = hoveredSite?.artifact.id === site.artifact.id;
            return (
              <div
                key={site.artifact.id}
                style={{
                  left: `${site.xPercent}%`,
                  top: `${site.yPercent}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
                onMouseEnter={() => setHoveredSite(site)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleInspectArtifact(site.artifact.id);
                }}
              >
                {/* Marker Button */}
                <button
                  type="button"
                  aria-label={`Inspect ${site.artifact.name} at ${site.artifact.coordinates.latitude}`}
                  className="relative flex items-center justify-center p-3 focus:outline-none"
                >
                  {/* Outer Pulsing Radar Ring */}
                  <span
                    style={{ backgroundColor: planetMeta.accentColor }}
                    className="absolute w-8 h-8 rounded-full animate-ping opacity-50"
                  />

                  {/* High-visibility Target Ring */}
                  <span
                    style={{ borderColor: planetMeta.accentColor }}
                    className={`relative w-4 h-4 rounded-full border-2 bg-obsidian flex items-center justify-center shadow-lg transition-transform ${
                      isHovered ? 'scale-125' : 'group-hover:scale-115'
                    }`}
                  >
                    <span
                      style={{ backgroundColor: planetMeta.accentColor }}
                      className="w-1.5 h-1.5 rounded-full"
                    />
                  </span>

                  {/* Marker Name Label Badge */}
                  <div
                    style={{ borderColor: isHovered ? planetMeta.accentColor : '#343A39' }}
                    className="absolute left-full ml-2 whitespace-nowrap bg-obsidian/95 border px-2 py-0.5 rounded-xs shadow-md pointer-events-none transition-colors"
                  >
                    <span className="font-mono text-[9px] tracking-wider uppercase text-bone font-medium">
                      {site.artifact.mission}
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Viewport Zoom & Reset Overlay Controls */}
        <div className="absolute bottom-4 right-4 z-20 flex items-center space-x-1.5 bg-obsidian/90 backdrop-blur-sm border border-meteorite p-1 rounded-sm shadow-xl">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            aria-label="Zoom In"
            className="p-1.5 text-stone-secondary hover:text-bone hover:bg-surface rounded-sm transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            aria-label="Zoom Out"
            className="p-1.5 text-stone-secondary hover:text-bone hover:bg-surface rounded-sm transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            title="Reset Planetary View"
            aria-label="Reset Planetary View"
            className="p-1.5 text-stone-secondary hover:text-bone hover:bg-surface rounded-sm transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Top-Left Sensor / Source Provenance Badge */}
        <div className="pointer-events-none absolute top-3 left-3 z-10 font-mono text-[9px] tracking-[0.16em] text-stone-muted uppercase bg-obsidian/85 px-2.5 py-1 border border-meteorite/60 backdrop-blur-xs">
          <span>{planetMeta.sensorAgency}</span>
          <span className="text-meteorite mx-1.5">·</span>
          <span>{planetMeta.projection}</span>
        </div>

        {/* Hovered Site Interactive Detail Tooltip Card */}
        <AnimatePresence>
          {hoveredSite && (
            <motion.div
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              className="absolute bottom-4 left-4 z-20 w-80 bg-surface-raised/95 backdrop-blur-md border border-meteorite p-4 rounded-sm shadow-2xl space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <span
                    style={{ color: planetMeta.accentColor }}
                    className="font-mono text-[9px] tracking-[0.18em] uppercase font-semibold block"
                  >
                    {hoveredSite.artifact.mission} · {hoveredSite.artifact.year}
                  </span>
                  <h4 className="font-serif text-sm text-bone font-medium leading-tight">
                    {hoveredSite.artifact.name}
                  </h4>
                </div>
                <div className="w-12 h-9 shrink-0 overflow-hidden border border-meteorite rounded-xs">
                  <img
                    src={hoveredSite.artifact.heroImage}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-t border-meteorite/60 pt-2 text-stone-muted">
                <div>
                  <span className="text-stone-secondary block">COORDINATES</span>
                  <span className="text-bone">
                    {hoveredSite.artifact.coordinates.latitude}
                  </span>
                </div>
                <div>
                  <span className="text-stone-secondary block">LONGITUDE</span>
                  <span className="text-bone">
                    {hoveredSite.artifact.coordinates.longitude}
                  </span>
                </div>
                <div className="col-span-2 truncate">
                  <span className="text-stone-secondary block">LANDING BASIN</span>
                  <span className="text-bone truncate">
                    {hoveredSite.artifact.locationName}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleInspectArtifact(hoveredSite.artifact.id)}
                style={{ borderColor: planetMeta.accentColor }}
                className="w-full py-1.5 px-3 bg-surface hover:bg-surface-raised border text-bone font-mono text-[10px] tracking-wider uppercase transition-colors flex items-center justify-center space-x-1.5"
              >
                <span>OPEN ARTIFACT INSPECTION</span>
                <ArrowRight className="w-3 h-3" style={{ color: planetMeta.accentColor }} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Surface Directory: Quick Jump Strip for Verified Landing Sites */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-stone-muted font-medium">
            VERIFIED {planetMeta.name} LANDING SITES ({sites.length})
          </span>
          <span className="font-mono text-[10px] tracking-wider uppercase text-stone-muted">
            CLICK TO LOCATE ON SURFACE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {sites.map((site) => {
            const isHovered = hoveredSite?.artifact.id === site.artifact.id;
            return (
              <div
                key={site.artifact.id}
                className={`p-3 border rounded-sm transition-all text-left bg-surface-raised/60 hover:bg-surface-raised space-y-2 cursor-pointer ${
                  isHovered ? 'border-[#DEB275]' : 'border-meteorite hover:border-meteorite/80'
                }`}
                onClick={() => handleFocusSite(site)}
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span style={{ color: planetMeta.accentColor }} className="font-medium">
                    {site.artifact.mission}
                  </span>
                  <span className="text-stone-muted">{site.artifact.year}</span>
                </div>

                <div className="font-serif text-xs text-bone font-medium truncate">
                  {site.artifact.name}
                </div>

                <div className="font-mono text-[9px] text-stone-muted truncate flex items-center justify-between pt-1 border-t border-meteorite/50">
                  <span className="truncate">{site.artifact.locationName.split('(')[0]}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInspectArtifact(site.artifact.id);
                    }}
                    className="text-[#DEB275] hover:underline uppercase shrink-0 font-medium ml-2"
                  >
                    INSPECT →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

