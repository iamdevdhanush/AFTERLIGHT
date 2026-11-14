import React, { useEffect } from 'react';
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
import { PlanetaryArchaeologyModule } from './modules/planetary-archaeology';
import { navigation } from './navigation/navigationController';

export const App: React.FC = () => {
  const state = useExperienceStore((s) => s.state);
  const currentDestination = useExperienceStore((s) => s.currentDestination);
  const setState = useExperienceStore((s) => s.setState);

  // Initialize browser history and route synchronization
  useEffect(() => {
    navigation.init();
  }, []);

  const isKnownState =
    state === 'ARRIVAL' ||
    state === 'DESTINATION_SELECT' ||
    state === 'ENVIRONMENT_LOADING' ||
    state === 'EXHIBITION' ||
    state === 'ARTIFACT_DETAILS' ||
    state === 'GUIDED_INTRO' ||
    state === 'FREE_EXPLORATION' ||
    state === 'RETURN_TO_EXPLORATION' ||
    state === 'ARTIFACT_APPROACH' ||
    state === 'ARTIFACT_INSPECTION' ||
    state === 'STORY_CHAPTER' ||
    state === 'LEGACY' ||
    state === 'PLANETARY_ARCHAEOLOGY';

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

      {(state === 'EXHIBITION' || state === 'ARTIFACT_DETAILS') && <ScreenExhibition />}

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

      {/* 4. ISOLATED 3D PLANETARY ARCHAEOLOGY MODULE (Moon & Mars Real Surface Data) */}
      {state === 'PLANETARY_ARCHAEOLOGY' && (
        <PlanetaryArchaeologyModule
          initialPlanet={currentDestination === 'mars' ? 'mars' : 'moon'}
          onExit={() => setState('DESTINATION_SELECT')}
        />
      )}

      {/* 5. RECOVERY FALLBACK FOR INVALID OR UNRECOGNIZED STATE */}
      {!isKnownState && <ScreenArrival />}
    </div>
  );
};

export default App;

