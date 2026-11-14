import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Compass, ArrowRight, CornerDownLeft, Sparkles } from 'lucide-react';
import { PlanetarySite, PlanetaryBody } from '../types/planetary';
import { ALL_PLANETARY_SITES } from '../data/planetarySites';
import { CATEGORY_STYLES } from './PlanetaryMarkers';

interface PlanetarySearchProps {
  currentPlanet: PlanetaryBody;
  onSelectSite: (site: PlanetarySite, targetPlanet: PlanetaryBody) => void;
}

export const PlanetarySearch: React.FC<PlanetarySearchProps> = ({
  currentPlanet,
  onSelectSite,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Suggested quick searches
  const QUICK_SUGGESTIONS = [
    'Opportunity Rover',
    'Apollo 11 Eagle',
    'Curiosity Rover',
    'Perseverance & Ingenuity',
    'Apollo 15 LRV',
    'Apollo 13 S-IVB Impact',
    'InSight SEIS',
    'Surveyor 3',
  ];

  // Search matching across all Moon and Mars sites
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();

    return ALL_PLANETARY_SITES.filter((site) => {
      const matchName = site.name.toLowerCase().includes(q);
      const matchMission = site.mission.toLowerCase().includes(q);
      const matchHardware = site.hardwareType.toLowerCase().includes(q);
      const matchRegion = site.regionalFeature.toLowerCase().includes(q);
      const matchCategory = site.category.toLowerCase().includes(q);
      const matchOperator = site.operator.toLowerCase().includes(q);
      const matchYear = site.year.toString().includes(q);

      return (
        matchName ||
        matchMission ||
        matchHardware ||
        matchRegion ||
        matchCategory ||
        matchOperator ||
        matchYear
      );
    }).slice(0, 8); // Top 8 matches
  }, [query]);

  // Keyboard navigation (/ to focus, arrows to navigate, Enter to select, Esc to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      } else if (isOpen && results.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (results[selectedIndex]) {
            handleChooseSite(results[selectedIndex]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Click outside to dismiss
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChooseSite = (site: PlanetarySite) => {
    setQuery('');
    setIsOpen(false);
    onSelectSite(site, site.planet);
  };

  return (
    <div ref={containerRef} className="relative pointer-events-auto select-none w-full max-w-md">
      {/* Search Bar Input */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 absolute left-3.5 text-stone-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search planetary equipment (e.g. Opportunity Rover, Apollo 11)..."
          className="w-full bg-[#090D14]/90 backdrop-blur-md border border-[#222E42] focus:border-[#63F0C8] rounded-xl pl-10 pr-16 py-2.5 text-xs text-white placeholder-stone-400 font-sans shadow-xl transition-all outline-none"
        />

        <div className="absolute right-3 flex items-center space-x-1.5">
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setIsOpen(false);
              }}
              className="p-1 rounded-full text-stone-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-white/10 text-stone-400 font-mono text-[9px]">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* Autocomplete Results Dropdown */}
      {isOpen && (
        <div className="absolute top-12 left-0 right-0 bg-[#090D14]/95 backdrop-blur-xl border border-[#222E42] rounded-xl shadow-2xl p-2 z-50 overflow-hidden animate-slide-down">
          {results.length > 0 ? (
            <div className="space-y-1">
              <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-stone-400 border-b border-white/5 flex justify-between">
                <span>FOUND {results.length} DOCUMENTED ARTIFACTS</span>
                <span>PRESS ENTER TO FOCUS</span>
              </div>
              {results.map((site, idx) => {
                const isSelected = idx === selectedIndex;
                const cat = CATEGORY_STYLES[site.category] || CATEGORY_STYLES.lander;
                const isDiffPlanet = site.planet !== currentPlanet;

                return (
                  <button
                    key={site.id}
                    type="button"
                    onClick={() => handleChooseSite(site)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left p-2.5 rounded-lg transition-all flex items-center justify-between border ${
                      isSelected
                        ? 'bg-[#162132] border-[#63F0C8] text-white shadow-md'
                        : 'bg-black/30 border-transparent text-stone-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider"
                          style={{ backgroundColor: `${cat.primary}25`, color: cat.primary }}
                        >
                          {cat.label}
                        </span>

                        <span
                          className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider ${
                            site.planet === 'moon' ? 'bg-slate-700 text-slate-200' : 'bg-orange-950 text-orange-300'
                          }`}
                        >
                          {site.planet === 'moon' ? 'Moon' : 'Mars'}
                        </span>

                        <span className="font-mono text-xs font-semibold text-white truncate">
                          {site.name}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 mt-1 text-[10px] font-mono text-stone-400">
                        <span>{site.mission}</span>
                        <span>•</span>
                        <span>{site.latitudeFormatted}, {site.longitudeFormatted}</span>
                        {isDiffPlanet && (
                          <>
                            <span>•</span>
                            <span className="text-[#63F0C8]">Will switch to {site.planet.toUpperCase()}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-stone-400 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          ) : query.trim() ? (
            <div className="p-4 text-center text-xs font-mono text-stone-400">
              No documented NASA hardware matches "{query}".
            </div>
          ) : (
            // Quick suggestion chips when input is empty
            <div className="p-2 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block px-1">
                POPULAR MISSIONS & FORGOTTEN HARDWARE
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setQuery(item);
                      setIsOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white border border-white/5 text-[11px] font-sans transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
