import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, MapPin, ShieldCheck, Activity } from 'lucide-react';
import { CATEGORY_STYLES } from './PlanetaryMarkers';
import { HardwareCategory } from '../types/planetary';

export const HardwareLegend: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const categories = Object.entries(CATEGORY_STYLES) as [
    HardwareCategory,
    (typeof CATEGORY_STYLES)[HardwareCategory]
  ][];

  return (
    <div className="bg-[#090D14]/90 backdrop-blur-md border border-[#222E42] rounded-xl p-3 shadow-xl select-none pointer-events-auto text-xs font-mono transition-all">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-stone-300 hover:text-white transition-colors"
      >
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-3.5 h-3.5 text-[#63F0C8]" />
          <span className="uppercase tracking-wider text-[11px] font-semibold text-white">
            HARDWARE SYMBOLS & LEGEND
          </span>
        </div>
        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {isExpanded && (
        <div className="pt-3 mt-3 border-t border-[#1C2636] space-y-3 animate-fade-in text-[10px]">
          {/* Categories Grid */}
          <div className="space-y-1.5">
            <span className="text-[9px] uppercase tracking-widest text-stone-500 font-semibold block">
              HARDWARE CATEGORIES
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {categories.map(([key, item]) => (
                <div key={key} className="flex items-center space-x-2 py-0.5">
                  <span
                    className="w-4 h-4 rounded flex items-center justify-center font-bold text-[10px] flex-shrink-0"
                    style={{ backgroundColor: `${item.primary}25`, color: item.primary }}
                  >
                    {item.glyph}
                  </span>
                  <span className="text-stone-300 truncate">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Traverse Route Indicator */}
          <div className="pt-2 border-t border-white/5 space-y-1">
            <span className="text-[9px] uppercase tracking-widest text-stone-500 font-semibold block">
              TRAVERSAL ROUTES
            </span>
            <div className="flex items-center space-x-2">
              <span className="w-5 h-0.5 bg-gradient-to-r from-amber-400 to-cyan-400 rounded-full" />
              <span className="text-stone-300">Documented Rover Surface Paths</span>
            </div>
          </div>

          {/* Location Confidence Levels */}
          <div className="pt-2 border-t border-white/5 space-y-1">
            <span className="text-[9px] uppercase tracking-widest text-stone-500 font-semibold block">
              CONFIDENCE RATINGS
            </span>
            <div className="space-y-1 text-stone-400">
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Confirmed — Resolved in LROC/HiRISE imagery</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Approximate — Telemetry & Doppler tracking</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                <span>Estimated — Descent trajectory reconstruction</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
