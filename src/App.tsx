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
import { SpaceshipCursor } from './components/ui/SpaceshipCursor';
import { PlanetaryArchaeologyModule } from './modules/planetary-archaeology';
import { navigation } from './navigation/navigationController';
import { AriaLiveAnnouncer } from './components/ui/AriaLiveAnnouncer';
import { TeacherModeModal } from './components/ui/TeacherModeModal';
import { WebGLFallbackGallery } from './components/canvas/WebGLFallbackGallery';

export const App: React.FC = () => {
  const state = useExperienceStore((s) => s.state);
  const currentDestination = useExperienceStore((s) => s.currentDestination);
  const setState = useExperienceStore((s) => s.setState);
  const isTeacherModeOpen = useExperienceStore((s) => s.isTeacherModeOpen);
  const toggleTeacherMode = useExperienceStore((s) => s.toggleTeacherMode);
  const webglAvailable = useExperienceStore((s) => s.webglAvailable);
  const setWebglAvailable = useExperienceStore((s) => s.setWebglAvailable);

  // Initialize browser history and route synchronization & detect WebGL
  useEffect(() => {
    navigation.init();

    // WebGL capability probe
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglAvailable(false);
      }
    } catch {
      setWebglAvailable(false);
    }

    // Auto-open teacher mode if ?teacher=true in URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('teacher') === 'true') {
        toggleTeacherMode(true);
      }
    }
  }, [setWebglAvailable, toggleTeacherMode]);

  // Graceful 2D Archival Gallery Fallback if WebGL is disabled or unsupported
  if (!webglAvailable) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-void text-starlight font-sans">
        <WebGLFallbackGallery onRetry={() => setWebglAvailable(true)} />
        <AriaLiveAnnouncer />
      </div>
    );
  }

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

      {/* 6. HARDWARE-ACCELERATED SPACESHIP CURSOR OVERLAY */}
      <SpaceshipCursor />

      {/* 7. SCREEN-READER LIVE ANNOUNCER (WCAG 2.2 AA) */}
      <AriaLiveAnnouncer />

      {/* 8. TEACHER & EDUCATOR TOOLKIT MODAL */}
      {isTeacherModeOpen && <TeacherModeModal onClose={() => toggleTeacherMode(false)} />}
    </div>
  );
};

export default App;

