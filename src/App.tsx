import React from 'react';
import { useExperienceStore } from './store/useExperienceStore';
import { SceneCanvas } from './components/canvas/SceneCanvas';
import { ScreenArrival } from './components/ui/ScreenArrival';
import { ScreenDestinationSelect } from './components/ui/ScreenDestinationSelect';
import { ScreenExplorationUI } from './components/ui/ScreenExplorationUI';
import { ScreenArtifactInspection } from './components/ui/ScreenArtifactInspection';
import { ScreenExhibition } from './components/ui/ScreenExhibition';
import { ScreenArtifactDetails } from './components/ui/ScreenArtifactDetails';
import { ScreenDocumentary } from './components/ui/ScreenDocumentary';
import { ScreenLegacy } from './components/ui/ScreenLegacy';
import { ScreenLoading } from './components/ui/ScreenLoading';

export const App: React.FC = () => {
  const state = useExperienceStore((s) => s.state);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-void text-starlight font-sans">
      {/* 1. THREE.JS PLANETARY ENVIRONMENT CANVAS (Arrival & Approved Orbital Sphere Selector) */}
      <SceneCanvas />

      {/* 2. SUBTLE FILM GRAIN & VIGNETTE FOR CINEMATIC DOCUMENTARY TEXTURE */}
      <div className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(8,11,16,0.42)_100%)] opacity-80" />

      {/* 3. EXPERIENCE STATE OVERLAY INTERFACE */}
      {state === 'ARRIVAL' && <ScreenArrival />}
      {state === 'DESTINATION_SELECT' && <ScreenDestinationSelect />}
      {state === 'ENVIRONMENT_LOADING' && <ScreenLoading />}

      {state === 'EXHIBITION' && <ScreenExhibition />}
      {state === 'ARTIFACT_DETAILS' && <ScreenArtifactDetails />}

      {(state === 'GUIDED_INTRO' ||
        state === 'FREE_EXPLORATION' ||
        state === 'RETURN_TO_EXPLORATION') && (
        <ScreenExplorationUI />
      )}

      {(state === 'ARTIFACT_APPROACH' || state === 'ARTIFACT_INSPECTION') && (
        <ScreenArtifactInspection />
      )}

      {state === 'STORY_CHAPTER' && <ScreenDocumentary />}
      {state === 'LEGACY' && <ScreenLegacy />}
    </div>
  );
};

export default App;

