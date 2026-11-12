import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, ArrowLeft, HelpCircle, Eye, Settings2, Sparkles } from 'lucide-react';
import { useExperienceStore } from '../../store/useExperienceStore';
import { DESTINATIONS } from '../../data/destinations';
import { ARTIFACTS } from '../../data/artifacts';

export const ScreenExplorationUI: React.FC = () => {
  const currentDestination = useExperienceStore((s) => s.currentDestination);
  const hoveredArtifactId = useExperienceStore((s) => s.hoveredArtifactId);
  const selectArtifact = useExperienceStore((s) => s.selectArtifact);
  const returnToDestinations = useExperienceStore((s) => s.returnToDestinations);
  const isAudioMuted = useExperienceStore((s) => s.isAudioMuted);
  const toggleAudio = useExperienceStore((s) => s.toggleAudio);
  const discoveredArtifacts = useExperienceStore((s) => s.discoveredArtifacts);
  const graphicsQuality = useExperienceStore((s) => s.graphicsQuality);
  const setGraphicsQuality = useExperienceStore((s) => s.setGraphicsQuality);
  const toggleAiGuide = useExperienceStore((s) => s.toggleAiGuide);

  const [showSettings, setShowSettings] = useState(false);

  const destData = DESTINATIONS[currentDestination];
  const hoveredArtifact = hoveredArtifactId ? ARTIFACTS[hoveredArtifactId] : null;

  return (
    <div className="relative z-10 w-full h-full flex flex-col justify-between p-6 md:p-10 pointer-events-none select-none">
      {/* Top HUD: Minimal & Restrained */}
      <div className="flex items-center justify-between">
        {/* Left: Wordmark & Current Destination */}
        <div className="flex items-center space-x-4">
          <button
            onClick={returnToDestinations}
            className="pointer-events-auto px-3 py-1.5 bg-space-800/90 hover:bg-gold hover:text-void text-starlight transition-colors duration-200 border border-starlight/15 flex items-center space-x-2 text-xs font-mono tracking-wider"
            title="Return to Destination Selector"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-medium">SECTOR SELECTOR</span>
          </button>

          <div className="h-4 w-px bg-starlight/20" />

          <div className="flex items-center space-x-2 font-mono text-xs tracking-wider">
            <span className="uppercase text-starlight font-semibold">
              AFTERLIGHT
            </span>
            <span className="text-starlight/40">•</span>
            <span className="text-gold font-medium">
              {destData.name}
            </span>
          </div>
        </div>

        {/* Right: Sound, Settings, AI Guide */}
        <div className="flex items-center space-x-3 pointer-events-auto">
          {/* Ask Archive AI pill */}
          <button
            onClick={() => toggleAiGuide()}
            className="flex items-center space-x-2 px-3.5 py-1.5 bg-space-800/90 hover:bg-space-700 text-starlight border border-starlight/15 text-xs font-mono tracking-wider transition-colors duration-200"
          >
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span className="hidden md:inline font-medium">ASK THE ARCHIVE</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleAudio}
            className="p-2 bg-space-800/90 hover:bg-space-700 text-starlight border border-starlight/15 transition-colors duration-200"
            title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isAudioMuted ? (
              <VolumeX className="w-4 h-4 text-starlight/40" />
            ) : (
              <Volume2 className="w-4 h-4 text-gold" />
            )}
          </button>

          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-space-800/90 hover:bg-space-700 text-starlight border border-starlight/15 transition-colors duration-200"
            title="Settings"
          >
            <Settings2 className="w-4 h-4 text-starlight/70" />
          </button>
        </div>
      </div>

      {/* Settings Dropdown Popover */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="pointer-events-auto absolute top-20 right-10 w-64 bg-space-800/95 border border-starlight/15 p-4 space-y-4 shadow-2xl backdrop-blur-md"
          >
            <div className="font-mono text-xs text-starlight tracking-widest pb-2 border-b border-starlight/10 flex justify-between">
              <span>ENVIRONMENT SETTINGS</span>
            </div>

            <div className="space-y-2">
              <span className="block font-mono text-[10px] text-dust tracking-widest">
                GRAPHICS FIDELITY
              </span>
              <div className="grid grid-cols-3 gap-1">
                {(['low', 'medium', 'high'] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => setGraphicsQuality(q)}
                    className={`py-1 text-[10px] font-mono uppercase tracking-wider ${
                      graphicsQuality === q
                        ? 'bg-gold text-void font-bold'
                        : 'bg-space-700 text-dust hover:bg-space-600'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center Contextual Hover Card (When user hovers over an artifact in 3D scene) */}
      <div className="my-auto flex justify-center">
        <AnimatePresence>
          {hoveredArtifact && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25 }}
              onClick={() => selectArtifact(hoveredArtifact.id)}
              className="pointer-events-auto cursor-pointer p-6 bg-space-900/95 border border-gold/50 backdrop-blur-md max-w-md w-full shadow-2xl space-y-3 hover:border-gold transition-colors duration-200"
            >
              <div className="flex items-center justify-between text-xs font-mono tracking-wider">
                <span className="text-gold flex items-center space-x-2 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold animate-ping" />
                  <span>ARTIFACT LOCATED</span>
                </span>
                <span className="text-starlight/70">
                  {hoveredArtifact.coordinates.planetaryRegion}
                </span>
              </div>

              <div className="space-y-0.5">
                <h3 className="font-serif text-3xl text-starlight tracking-tight">
                  {hoveredArtifact.name}
                </h3>
                <p className="font-mono text-xs text-starlight/70">
                  {hoveredArtifact.callsign}
                </p>
              </div>

              <p className="font-sans text-xs md:text-sm text-starlight/85 leading-relaxed font-light line-clamp-2">
                {hoveredArtifact.brief}
              </p>

              <div className="pt-2 flex items-center justify-between text-xs font-mono text-gold border-t border-starlight/10">
                <span className="flex items-center space-x-1.5 font-medium">
                  <Eye className="w-3.5 h-3.5" />
                  <span>CLICK TO INSPECT ARTIFACT</span>
                </span>
                <span className="text-starlight/60">
                  {hoveredArtifact.coordinates.latitude}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Exploration HUD: Controls Guide & Subtle Discovery Progress */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-starlight/70 border-t border-starlight/10 pt-4">
        {/* Navigation Instructions */}
        <div className="flex items-center space-x-6 tracking-wider">
          <span className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-space-800 text-starlight border border-starlight/20 font-medium">
              DRAG
            </span>
            <span>ROTATE CAMERA</span>
          </span>
          <span className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-space-800 text-starlight border border-starlight/20 font-medium">
              SCROLL
            </span>
            <span>ZOOM</span>
          </span>
          <span className="flex items-center space-x-2 hidden sm:inline-flex">
            <span className="px-2 py-0.5 bg-space-800 text-starlight border border-starlight/20 font-medium">
              W / A / S / D
            </span>
            <span>PAN</span>
          </span>
        </div>

        {/* Discovery Progress Meter */}
        <div className="flex items-center space-x-3">
          <span className="text-xs tracking-wider text-starlight/50">
            DISCOVERY PROGRESS:
          </span>
          <div className="flex items-center space-x-1.5">
            {[...Array(destData.artifactsCount)].map((_, i) => {
              const isDiscovered = discoveredArtifacts.length > i;
              return (
                <div
                  key={i}
                  className={`w-6 h-1 transition-colors duration-500 ${
                    isDiscovered ? 'bg-gold' : 'bg-space-700'
                  }`}
                />
              );
            })}
          </div>
          <span className="font-mono text-xs text-starlight font-medium">
            {Math.min(discoveredArtifacts.length, destData.artifactsCount)} / {destData.artifactsCount}
          </span>
        </div>
      </div>
    </div>
  );
};

