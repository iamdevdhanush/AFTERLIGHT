import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ApolloEagleModel } from './artifacts/ApolloEagleModel';
import { OpportunityModel } from './artifacts/OpportunityModel';
import { VoyagerModel } from './artifacts/VoyagerModel';

interface Artifact3DStageProps {
  artifactId: string;
}

/**
 * Isolated museum hardware 3D turntable for verified models (Eagle, MER rovers, Voyager 1).
 * Uses studio three-point lighting against pure #06080D without terrain clutter.
 */
export const Artifact3DStage: React.FC<Artifact3DStageProps> = ({ artifactId }) => {
  const camConfig: { pos: [number, number, number]; target: [number, number, number] } =
    artifactId === 'apollo11_eagle'
      ? { pos: [6.4, 3.6, 8.8], target: [0, 2.2, 0] }
      : artifactId === 'voyager1'
      ? { pos: [4.2, 2.2, 5.4], target: [0, 0, 0] }
      : { pos: [2.8, 1.8, 3.6], target: [0, 0.55, 0] };

  return (
    <div className="relative w-full h-full min-h-[340px] bg-[#06080D]">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: camConfig.pos, fov: 38, near: 0.1, far: 120 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#06080D']} />
        <ambientLight intensity={0.35} color="#DCE4F0" />
        <directionalLight position={[8, 10, 6]} intensity={2.6} color="#FFF7EC" castShadow />
        <directionalLight position={[-6, 3, -5]} intensity={0.75} color="#7D96B2" />
        <directionalLight position={[0, -5, 4]} intensity={0.25} color="#D99A63" />

        <Suspense fallback={null}>
          {artifactId === 'apollo11_eagle' && (
            <ApolloEagleModel position={[0, 0, 0]} rotation={[0, 0.4, 0]} scale={1.15} />
          )}
          {(artifactId === 'opportunity' || artifactId === 'spirit') && (
            <OpportunityModel
              position={[0, 0.35, 0]}
              rotation={[0, 0.45, 0]}
              scale={1.0}
              artifactId={artifactId}
            />
          )}
          {artifactId === 'voyager1' && (
            <VoyagerModel position={[0, 0, 0]} rotation={[0.15, 0.4, 0.05]} scale={0.95} />
          )}
        </Suspense>

        <OrbitControls
          target={camConfig.target}
          enablePan={false}
          enableDamping
          dampingFactor={0.07}
          minDistance={2.2}
          maxDistance={15}
          autoRotate
          autoRotateSpeed={0.55}
        />
      </Canvas>

      <div className="pointer-events-none absolute bottom-3 left-4 font-mono text-[10px] tracking-[0.18em] text-starlight/45 uppercase">
        DRAG TO ORBIT · SCROLL TO ZOOM
      </div>
    </div>
  );
};

