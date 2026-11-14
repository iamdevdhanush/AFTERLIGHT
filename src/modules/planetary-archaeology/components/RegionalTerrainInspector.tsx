import React from 'react';
import { Mountain, ArrowLeft, Layers, Info, CheckCircle2 } from 'lucide-react';
import { PlanetarySite, PlanetaryBody } from '../types/planetary';
import { ELEVATION_DATUM_BOUNDS } from '../services/nasaTrekService';

interface RegionalTerrainInspectorProps {
  site: PlanetarySite;
  planet: PlanetaryBody;
  onClose: () => void;
}

export const RegionalTerrainInspector: React.FC<RegionalTerrainInspectorProps> = ({
  site,
  planet,
  onClose,
}) => {
  const bounds = ELEVATION_DATUM_BOUNDS[planet];
  const instrument = planet === 'moon' ? 'LOLA Laser Altimeter' : 'MOLA Laser Altimeter';
  const satellite = planet === 'moon' ? 'Lunar Reconnaissance Orbiter (LRO)' : 'Mars Global Surveyor (MGS)';

  // Calculate percentage along the elevation scale
  const elevationPct = Math.max(
    0,
    Math.min(
      100,
      ((site.elevationMeters - bounds.minMeters) / (bounds.maxMeters - bounds.minMeters)) * 100
    )
  );

  return (
    <div className="absolute top-20 left-6 z-40 max-w-sm w-full bg-[#0B1019]/95 backdrop-blur-xl border border-[#223147] rounded-xl p-5 shadow-2xl pointer-events-auto select-none animate-fade-in space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1C2636] pb-3">
        <div className="flex items-center space-x-2">
          <Mountain className="w-4 h-4 text-[#63F0C8]" />
          <span className="font-mono text-xs uppercase tracking-wider text-white font-semibold">
            REGIONAL TERRAIN ALTIMETRY
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-white/10 text-stone-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Site Name & Region */}
      <div>
        <span className="font-mono text-[10px] text-stone-400 uppercase tracking-widest block">
          {site.mission}
        </span>
        <h3 className="font-serif text-lg text-white font-medium">
          {site.name}
        </h3>
        <span className="text-xs text-[#63F0C8] font-mono block mt-0.5">
          {site.regionalFeature}
        </span>
      </div>

      {/* Surface Elevation Gauge */}
      <div className="p-3.5 bg-black/40 rounded-lg border border-white/5 space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="font-mono text-[10px] text-stone-400 uppercase tracking-wider">
            MEASURED DATUM ELEVATION
          </span>
          <span className="font-mono text-lg font-bold text-[#63F0C8]">
            {site.elevationMeters > 0 ? `+${site.elevationMeters.toLocaleString()}` : site.elevationMeters.toLocaleString()} m
          </span>
        </div>

        {/* Visual Hypsometric Bar */}
        <div className="w-full h-2 bg-gradient-to-r from-blue-900 via-emerald-700 via-amber-600 to-red-600 rounded-full relative overflow-hidden">
          {/* Indicator Marker */}
          <div
            className="absolute top-0 bottom-0 w-1.5 bg-white shadow-lg ring-2 ring-white"
            style={{ left: `${elevationPct}%` }}
          />
        </div>

        <div className="flex justify-between text-[9px] font-mono text-stone-400">
          <span>{bounds.minMeters.toLocaleString()} m (Basin Depths)</span>
          <span>{bounds.maxMeters.toLocaleString()} m (Highland Peaks)</span>
        </div>
      </div>

      {/* Scientific Instrument Authenticity Note */}
      <div className="p-3 rounded bg-[#101824] border border-[#1C2A3D] space-y-1.5 text-xs">
        <div className="flex items-center space-x-1.5 text-emerald-400 font-mono text-[10px] font-semibold tracking-wider">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>REAL LASER ALTIMETRY DATA</span>
        </div>
        <p className="text-stone-300 font-sans text-[11px] leading-relaxed">
          Elevation measured directly by NASA {instrument} aboard {satellite}. Unlike terrestrial sea level, planetary elevation is calculated relative to a reference sphere of radius {bounds.datumRadiusKm} km.
        </p>
      </div>

      {/* Topographic Relief Context */}
      <div className="text-[11px] font-sans text-stone-300 leading-relaxed space-y-1">
        <span className="font-mono text-[10px] uppercase tracking-wider text-stone-400 block font-semibold">
          TOPOGRAPHIC CONTEXT
        </span>
        <p>{site.geologicalContext}</p>
      </div>
    </div>
  );
};
