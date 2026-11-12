import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useExperienceStore } from '../../store/useExperienceStore';
import { CameraDirector } from './CameraDirector';
import { MarsEnvironment } from './environments/MarsEnvironment';
import { MoonEnvironment } from './environments/MoonEnvironment';
import { DeepSpaceEnvironment } from './environments/DeepSpaceEnvironment';
import { PlanetSphere } from './PlanetSphere';

export const SceneCanvas: React.FC = () => {
  const state = useExperienceStore((s) => s.state);
  const currentDestination = useExperienceStore((s) => s.currentDestination);

  // During ARRIVAL, render the photorealistic lunar arrival landscape with rising Earth
  const activeEnvironment =
    state === 'ARRIVAL'
      ? 'moon'
      : currentDestination;

  const showOrbitalPlanet =
    (state === 'DESTINATION_SELECT' || state === 'ENVIRONMENT_LOADING') &&
    (activeEnvironment === 'moon' || activeEnvironment === 'mars');

  // Museum exhibition & detail screens render dedicated photography/models over #080B10
  const isMuseumEditorialView =
    state === 'EXHIBITION' ||
    state === 'ARTIFACT_DETAILS' ||
    state === 'STORY_CHAPTER' ||
    state === 'LEGACY';

  if (isMuseumEditorialView) {
    return <div className="absolute inset-0 w-full h-full z-0 bg-[#080B10]" />;
  }

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-auto z-0 overflow-hidden bg-[#000000]">
      <Canvas
        shadows
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
          stencil: false,
          depth: true,
          toneMappingExposure: 1.0,
        }}
        dpr={[1, Math.min(2, window.devicePixelRatio)]}
        camera={{ position: [0, 2.5, 12], fov: 42, near: 0.1, far: 400 }}
      >
        <CameraDirector />
        <Suspense fallback={null}>
          {showOrbitalPlanet ? (
            <PlanetSphere planetId={activeEnvironment} />
          ) : (
            <>
              {activeEnvironment === 'moon' && <MoonEnvironment />}
              {activeEnvironment === 'mars' && <MarsEnvironment />}
              {activeEnvironment === 'deep_space' && <DeepSpaceEnvironment />}
            </>
          )}
        </Suspense>
      </Canvas>
    </div>
  );
};

