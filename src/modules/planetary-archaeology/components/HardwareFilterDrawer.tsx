import React from 'react';
import { Filter, X, RotateCcw, Check, Calendar, Layers, ShieldCheck, Tag } from 'lucide-react';
import { HardwareFilterOptions, HardwareCategory, HardwareDisposition, HardwareStatus, LocationConfidence, PlanetaryBody } from '../types/planetary';
import { CATEGORY_STYLES } from './PlanetaryMarkers';

interface HardwareFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: HardwareFilterOptions;
  onChangeFilters: (newFilters: HardwareFilterOptions) => void;
  totalSitesCount: number;
  filteredSitesCount: number;
  availableMissions: string[];
}

export const HardwareFilterDrawer: React.FC<HardwareFilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onChangeFilters,
  totalSitesCount,
  filteredSitesCount,
  availableMissions,
}) => {
  if (!isOpen) return null;

  const categories: { id: HardwareCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All Categories' },
    { id: 'rover', label: 'Rovers' },
    { id: 'descent_stage', label: 'Descent Stages' },
    { id: 'lander', label: 'Landers' },
    { id: 'scientific_instrument', label: 'Instruments' },
    { id: 'alsep', label: 'ALSEP Packages' },
    { id: 'discarded_component', label: 'Discarded Components' },
    { id: 'impact_site', label: 'Impact Sites' },
  ];

  const dispositions: { id: HardwareDisposition | 'all'; label: string; desc: string }[] = [
    { id: 'all', label: 'All Dispositions', desc: 'Show all hardware arrangements' },
    { id: 'intentionally_left_behind', label: 'Intentionally Left Behind', desc: 'Apollo descent stages, science stations, retroreflectors' },
    { id: 'operational_on_surface', label: 'Operational on Surface', desc: 'Active rovers and observatories' },
    { id: 'decommissioned', label: 'Decommissioned In Situ', desc: 'Completed surface missions preserved intact' },
    { id: 'discarded', label: 'Discarded Equipment', desc: 'Jettisoned heat shields, backshells, parachutes, carts' },
    { id: 'impacted', label: 'Crashed / Impacted', desc: 'Saturn S-IVB booster impacts, impactor probes, crash sites' },
  ];

  const statuses: { id: HardwareStatus | 'all'; label: string }[] = [
    { id: 'all', label: 'All Statuses' },
    { id: 'operational', label: 'Active / Operational' },
    { id: 'inactive', label: 'Inactive / Silent' },
    { id: 'decommissioned', label: 'Decommissioned' },
    { id: 'destroyed', label: 'Destroyed on Impact' },
  ];

  const confidences: { id: LocationConfidence | 'all'; label: string }[] = [
    { id: 'all', label: 'All Confidences' },
    { id: 'confirmed', label: 'Confirmed (Orbital Imagery)' },
    { id: 'approximate', label: 'Approximate (Telemetry)' },
    { id: 'estimated', label: 'Estimated Trajectory' },
  ];

  const handleReset = () => {
    onChangeFilters({
      planet: filters.planet,
      searchQuery: '',
      category: 'all',
      disposition: 'all',
      status: 'all',
      confidence: 'all',
      yearRange: [1959, 2024],
      mission: 'all',
    });
  };

  return (
    <div className="fixed inset-y-0 left-0 w-full sm:w-[420px] bg-[#090D14]/98 backdrop-blur-2xl border-r border-[#1F2C3F] z-50 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto animate-slide-right select-none pointer-events-auto">
      <div className="space-y-6">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#1C2636] pb-4">
          <div className="flex items-center space-x-2.5">
            <Filter className="w-4 h-4 text-[#63F0C8]" />
            <span className="font-mono text-xs uppercase tracking-wider text-white font-bold">
              FORGOTTEN HARDWARE FILTERS
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded hover:bg-white/10 text-stone-400 hover:text-white transition-colors"
              title="Reset Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded hover:bg-white/10 text-stone-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Count Meter */}
        <div className="p-3 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between font-mono text-xs">
          <span className="text-stone-400 uppercase text-[10px] tracking-wider">MATCHING RECORDS</span>
          <span className="text-[#63F0C8] font-bold">
            {filteredSitesCount} of {totalSitesCount} Artifacts
          </span>
        </div>

        {/* 1. Hardware Category */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 block font-semibold">
            HARDWARE CATEGORY
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {categories.map((c) => {
              const isSelected = filters.category === c.id;
              const catStyle = c.id !== 'all' ? CATEGORY_STYLES[c.id] : null;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onChangeFilters({ ...filters, category: c.id })}
                  className={`py-2 px-3 rounded-md text-left text-xs font-mono transition-all flex items-center space-x-2 border ${
                    isSelected
                      ? 'bg-[#162132] border-[#63F0C8] text-white font-semibold'
                      : 'bg-black/25 border-white/5 text-stone-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {catStyle && (
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: catStyle.primary }}
                    />
                  )}
                  <span className="truncate">{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Hardware Disposition (Intentionally Left Behind vs Discarded vs Decommissioned) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#63F0C8] block font-semibold">
              HARDWARE DISPOSITION
            </span>
            <span className="text-[9px] font-mono text-stone-500">SEPARATE FROM STATUS</span>
          </div>
          <div className="space-y-1.5">
            {dispositions.map((d) => {
              const isSelected = filters.disposition === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onChangeFilters({ ...filters, disposition: d.id })}
                  className={`w-full text-left p-2.5 rounded-md border transition-all text-xs font-mono ${
                    isSelected
                      ? 'bg-[#162132] border-[#63F0C8] text-white'
                      : 'bg-black/25 border-white/5 text-stone-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>{d.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#63F0C8]" />}
                  </div>
                  <span className="text-[10px] font-sans text-stone-500 block mt-0.5 font-normal">
                    {d.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Operational Status */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 block font-semibold">
            OPERATIONAL STATUS
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {statuses.map((s) => {
              const isSelected = filters.status === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onChangeFilters({ ...filters, status: s.id })}
                  className={`py-1.5 px-3 rounded-md text-left text-xs font-mono transition-all border ${
                    isSelected
                      ? 'bg-[#162132] border-[#63F0C8] text-white font-semibold'
                      : 'bg-black/25 border-white/5 text-stone-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="truncate">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Launch Year Timeline Range */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 uppercase tracking-widest">
            <span className="font-semibold">LAUNCH YEAR TIMELINE</span>
            <span className="text-[#63F0C8] font-bold">
              {filters.yearRange[0]} — {filters.yearRange[1]}
            </span>
          </div>

          <div className="flex items-center space-x-3 pt-1">
            <span className="text-[10px] font-mono text-stone-500">1959</span>
            <input
              type="range"
              min="1959"
              max="2024"
              value={filters.yearRange[0]}
              onChange={(e) =>
                onChangeFilters({
                  ...filters,
                  yearRange: [parseInt(e.target.value), filters.yearRange[1]],
                })
              }
              className="flex-1 h-1 bg-[#1A2333] rounded appearance-none accent-[#63F0C8] cursor-pointer"
            />
            <input
              type="range"
              min="1959"
              max="2024"
              value={filters.yearRange[1]}
              onChange={(e) =>
                onChangeFilters({
                  ...filters,
                  yearRange: [filters.yearRange[0], parseInt(e.target.value)],
                })
              }
              className="flex-1 h-1 bg-[#1A2333] rounded appearance-none accent-[#63F0C8] cursor-pointer"
            />
            <span className="text-[10px] font-mono text-stone-500">2024</span>
          </div>
        </div>

        {/* 5. Mission Filter */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 block font-semibold">
            MISSION
          </span>
          <select
            value={filters.mission}
            onChange={(e) => onChangeFilters({ ...filters, mission: e.target.value })}
            className="w-full bg-black/50 border border-[#1F2C3F] rounded-lg p-2.5 text-xs text-white font-mono outline-none focus:border-[#63F0C8]"
          >
            <option value="all">All Missions</option>
            {availableMissions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Drawer Bottom Action */}
      <div className="pt-6 border-t border-[#1C2636]">
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 bg-[#63F0C8] hover:bg-[#85F5D4] text-[#080B10] rounded-lg font-mono text-xs uppercase tracking-wider font-bold transition-all shadow-lg"
        >
          APPLY & VIEW {filteredSitesCount} SITES
        </button>
      </div>
    </div>
  );
};
