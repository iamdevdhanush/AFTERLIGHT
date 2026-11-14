import React from 'react';
import { Compass, Eye, Layers, Mountain, Pause, Play, RotateCcw, Sparkles } from 'lucide-react';
import { PlanetaryBody, ImageryLayerType } from '../types/planetary';
import { PLANETARY_LAYERS } from '../services/nasaTrekService';

interface PlanetaryControlsProps {
  planet: PlanetaryBody;
  onSelectPlanet: (planet: PlanetaryBody) => void;
  activeLayerType: ImageryLayerType;
  onSelectLayer: (layer: ImageryLayerType) => void;
  terrainExaggeration: number;
  onChangeTerrainExaggeration: (scale: number) => void;
  showGraticule: boolean;
  onToggleGraticule: () => void;
  isAutoRotating: boolean;
  onToggleAutoRotate: () => void;
  onResetCamera: () => void;
}

export const PlanetaryControls: React.FC<PlanetaryControlsProps> = ({
  planet,
  onSelectPlanet,
  activeLayerType,
  onSelectLayer,
  terrainExaggeration,
  onChangeTerrainExaggeration,
  showGraticule,
  onToggleGraticule,
  isAutoRotating,
  onToggleAutoRotate,
  onResetCamera,
}) => {
  const activeSpec = PLANETARY_LAYERS[planet][activeLayerType];

  return (
    <div className="flex flex-col space-y-3 pointer-events-auto">
      {/* 1. Planet Selector Tabs */}
      <div className="bg-[#0D121C]/90 backdrop-blur-md p-1.5 rounded-lg border border-[#222E42] shadow-xl flex items-center space-x-1">
        <button
          type="button"
          onClick={() => onSelectPlanet('moon')}
          className={`flex-1 py-2 px-4 rounded text-xs font-mono uppercase tracking-wider font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
            planet === 'moon'
              ? 'bg-[#E8E3D9] text-[#080B10] shadow-md'
              : 'text-[#A5A7A9] hover:text-[#E8E3D9] hover:bg-white/5'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          <span>THE MOON</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectPlanet('mars')}
          className={`flex-1 py-2 px-4 rounded text-xs font-mono uppercase tracking-wider font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
            planet === 'mars'
              ? 'bg-[#D97746] text-[#080B10] shadow-md'
              : 'text-[#A5A7A9] hover:text-[#E8E3D9] hover:bg-white/5'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          <span>MARS</span>
        </button>
      </div>

      {/* 2. NASA Imagery & Terrain Layer Selector */}
      <div className="bg-[#0D121C]/90 backdrop-blur-md p-3.5 rounded-lg border border-[#222E42] shadow-xl space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-mono tracking-wider text-[#A5A7A9] uppercase">
          <span className="flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-[#63F0C8]" />
            <span>NASA Planetary Layer</span>
          </span>
          <span className="text-[#63F0C8] font-medium">{activeSpec.instrument}</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => onSelectLayer('visible')}
            className={`py-1.5 px-2 rounded text-[10px] font-mono uppercase tracking-wider text-center transition-all ${
              activeLayerType === 'visible'
                ? 'bg-[#63F0C8] text-[#080B10] font-bold shadow-sm'
                : 'bg-black/40 text-[#A5A7A9] hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            Optical Albedo
          </button>

          <button
            type="button"
            onClick={() => onSelectLayer('elevation')}
            className={`py-1.5 px-2 rounded text-[10px] font-mono uppercase tracking-wider text-center transition-all ${
              activeLayerType === 'elevation'
                ? 'bg-[#63F0C8] text-[#080B10] font-bold shadow-sm'
                : 'bg-black/40 text-[#A5A7A9] hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            Altimetry Topo
          </button>

          <button
            type="button"
            onClick={() => onSelectLayer('shaded_relief')}
            className={`py-1.5 px-2 rounded text-[10px] font-mono uppercase tracking-wider text-center transition-all ${
              activeLayerType === 'shaded_relief'
                ? 'bg-[#63F0C8] text-[#080B10] font-bold shadow-sm'
                : 'bg-black/40 text-[#A5A7A9] hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            Shaded Relief
          </button>
        </div>

        {/* Layer Metadata Citation */}
        <div className="pt-1 border-t border-[#1C2636] text-[10px] font-sans text-stone-400">
          <span className="text-stone-300 font-medium block">{activeSpec.name}</span>
          <span className="text-stone-400 block mt-0.5 text-[9px]">{activeSpec.resolution} · {activeSpec.citation}</span>
        </div>
      </div>

      {/* 3. 3D Terrain Vertical Exaggeration Slider */}
      <div className="bg-[#0D121C]/90 backdrop-blur-md p-3 rounded-lg border border-[#222E42] shadow-xl space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono tracking-wider text-[#A5A7A9] uppercase">
          <span className="flex items-center space-x-1.5">
            <Mountain className="w-3.5 h-3.5 text-[#63F0C8]" />
            <span>Terrain Relief Exaggeration</span>
          </span>
          <span className="text-white font-semibold">{terrainExaggeration.toFixed(1)}×</span>
        </div>

        <input
          type="range"
          min="0.5"
          max="3.0"
          step="0.1"
          value={terrainExaggeration}
          onChange={(e) => onChangeTerrainExaggeration(parseFloat(e.target.value))}
          className="w-full h-1 bg-[#1A2333] rounded-lg appearance-none cursor-pointer accent-[#63F0C8]"
        />
        <div className="flex justify-between text-[9px] font-mono text-stone-400">
          <span>0.5× (Subtle)</span>
          <span>1.0× (Standard)</span>
          <span>3.0× (Enhanced)</span>
        </div>
      </div>

      {/* 4. Quick Toggles: Graticule, Rotation, Global Reset */}
      <div className="bg-[#0D121C]/90 backdrop-blur-md p-2 rounded-lg border border-[#222E42] shadow-xl flex items-center justify-between space-x-2 text-xs font-mono text-[#A5A7A9]">
        <button
          type="button"
          onClick={onToggleGraticule}
          className={`flex-1 py-1.5 px-2 rounded flex items-center justify-center space-x-1.5 text-[10px] uppercase transition-colors ${
            showGraticule ? 'bg-[#63F0C8]/20 text-[#63F0C8] border border-[#63F0C8]/40' : 'hover:bg-white/5'
          }`}
          title="Toggle Latitude/Longitude Coordinate Graticule"
        >
          <Compass className="w-3 h-3" />
          <span>Graticule</span>
        </button>

        <button
          type="button"
          onClick={onToggleAutoRotate}
          className={`flex-1 py-1.5 px-2 rounded flex items-center justify-center space-x-1.5 text-[10px] uppercase transition-colors ${
            isAutoRotating ? 'bg-white/10 text-white' : 'hover:bg-white/5'
          }`}
          title="Toggle Axial Planetary Rotation"
        >
          {isAutoRotating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          <span>{isAutoRotating ? 'Pause' : 'Spin'}</span>
        </button>

        <button
          type="button"
          onClick={onResetCamera}
          className="flex-1 py-1.5 px-2 rounded flex items-center justify-center space-x-1.5 text-[10px] uppercase hover:bg-white/5 hover:text-white transition-colors"
          title="Reset Camera to Global Orbit"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
