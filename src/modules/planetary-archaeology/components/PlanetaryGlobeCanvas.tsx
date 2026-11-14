import React, { useRef, useEffect, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { PlanetaryBody, ImageryLayerType, PlanetarySite, RoverTraverse, RoverWaypoint } from '../types/planetary';
import { PlanetaryGlobe } from './PlanetaryGlobe';
import { PlanetaryMarkers } from './PlanetaryMarkers';
import { RoverTraversePath3D } from './RoverTraversePath3D';
import { GLOBE_RADIUS, getRegionalInspectionCamera, latLonToVector3 } from '../services/planetaryMath';

interface PlanetaryGlobeCanvasProps {
  planet: PlanetaryBody;
  activeLayerType: ImageryLayerType;
  terrainExaggeration: number;
  showGraticule: boolean;
  isAutoRotating: boolean;
  sites: PlanetarySite[];
  traverses: RoverTraverse[];
  selectedSite: PlanetarySite | null;
  hoveredSiteId: string | null;
  onHoverSite: (id: string | null) => void;
  onSelectSite: (site: PlanetarySite) => void;
  onSelectWaypoint?: (wp: RoverWaypoint) => void;
  onPointerCoordinate?: (coords: { lat: number; lon: number; elevationMeters: number | null } | null) => void;
  cameraCue?: { lat: number; lon: number; altitudeUnits: number } | null;
}

// Background starfield
const ArchivalStarfield: React.FC = () => {
  const points = React.useMemo(() => {
    const count = 900;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    let seed = 42;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    for (let i = 0; i < count; i++) {
      const u = rand();
      const v = rand();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = 95 + rand() * 50;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const bright = 0.3 + Math.pow(rand(), 2.0) * 0.7;
      colors[i * 3] = bright;
      colors[i * 3 + 1] = bright;
      colors[i * 3 + 2] = bright * 1.08;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geom;
  }, []);

  return (
    <points geometry={points}>
      <pointsMaterial size={0.22} vertexColors transparent opacity={0.55} depthWrite={false} />
    </points>
  );
};

// Internal Camera Choreographer
const CameraTransitionManager: React.FC<{
  selectedSite: PlanetarySite | null;
  cameraCue?: { lat: number; lon: number; altitudeUnits: number } | null;
  planet: PlanetaryBody;
  spinGroupRef: React.RefObject<THREE.Group>;
  controlsRef: React.RefObject<any>;
}> = ({ selectedSite, cameraCue, planet, spinGroupRef, controlsRef }) => {
  const { camera } = useThree();
  const prevSiteIdRef = useRef<string | null>(null);
  const prevPlanetRef = useRef<PlanetaryBody>(planet);

  // Animate camera when storytelling sends a camera cue
  useEffect(() => {
    if (cameraCue) {
      const localCuePos = latLonToVector3(
        cameraCue.lat,
        cameraCue.lon,
        GLOBE_RADIUS,
        0.04
      );
      const group = spinGroupRef.current;
      const worldCuePos = group ? group.localToWorld(localCuePos.clone()) : localCuePos;
      const altitude = Math.max(0.6, cameraCue.altitudeUnits);
      const { cameraPos, targetPos } = getRegionalInspectionCamera(worldCuePos, GLOBE_RADIUS, altitude);

      gsap.to(camera.position, {
        x: cameraPos.x,
        y: cameraPos.y,
        z: cameraPos.z,
        duration: 2.0,
        ease: 'power2.inOut',
        onUpdate: () => {
          if (controlsRef.current) {
            controlsRef.current.target.copy(targetPos);
            controlsRef.current.update();
          }
        },
      });
    }
  }, [cameraCue, camera, controlsRef, spinGroupRef]);

  // Animate camera when switching planets
  useEffect(() => {
    if (prevPlanetRef.current !== planet) {
      prevPlanetRef.current = planet;

      // Smooth camera reset for new planetary body
      const targetPos = new THREE.Vector3(0, 0, 9.8);
      gsap.to(camera.position, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: 1.4,
        ease: 'power3.inOut',
        onUpdate: () => {
          if (controlsRef.current) {
            controlsRef.current.target.set(0, 0, 0);
            controlsRef.current.update();
          }
        },
      });

      // Reset planet spin rotation so iconic features face forward
      if (spinGroupRef.current) {
        gsap.to(spinGroupRef.current.rotation, {
          y: planet === 'moon' ? -1.45 : -0.95,
          x: 0.04,
          duration: 1.2,
          ease: 'power2.out',
        });
      }
    }
  }, [planet, camera, controlsRef, spinGroupRef]);

  // Animate camera when selecting a specific landing site (Global-to-Regional transition)
  useEffect(() => {
    if (selectedSite && selectedSite.id !== prevSiteIdRef.current) {
      prevSiteIdRef.current = selectedSite.id;

      // Calculate site position in planet's local space
      const localSitePos = latLonToVector3(
        selectedSite.latitude,
        selectedSite.longitude,
        GLOBE_RADIUS,
        0.04
      );

      // Get world coordinates taking current spin rotation into account
      const group = spinGroupRef.current;
      const worldSitePos = group ? group.localToWorld(localSitePos.clone()) : localSitePos;

      // Calculate regional oblique camera position
      const { cameraPos, targetPos } = getRegionalInspectionCamera(worldSitePos, GLOBE_RADIUS, 1.6);

      // Smooth GSAP camera transition from global to regional perspective
      gsap.to(camera.position, {
        x: cameraPos.x,
        y: cameraPos.y,
        z: cameraPos.z,
        duration: 1.8,
        ease: 'power2.inOut',
        onUpdate: () => {
          if (controlsRef.current) {
            controlsRef.current.target.copy(targetPos);
            controlsRef.current.update();
          }
        },
      });
    } else if (!selectedSite && prevSiteIdRef.current) {
      // Returned from site inspection to global orbit
      prevSiteIdRef.current = null;
      gsap.to(camera.position, {
        x: 0,
        y: 0,
        z: 9.8,
        duration: 1.5,
        ease: 'power2.out',
        onUpdate: () => {
          if (controlsRef.current) {
            controlsRef.current.target.set(0, 0, 0);
            controlsRef.current.update();
          }
        },
      });
    }
  }, [selectedSite, camera, controlsRef, spinGroupRef]);

  return null;
};

export const PlanetaryGlobeCanvas: React.FC<PlanetaryGlobeCanvasProps> = ({
  planet,
  activeLayerType,
  terrainExaggeration,
  showGraticule,
  isAutoRotating,
  sites,
  traverses,
  selectedSite,
  hoveredSiteId,
  onHoverSite,
  onSelectSite,
  onSelectWaypoint,
  onPointerCoordinate,
  cameraCue,
}) => {
  const spinGroupRef = useRef<THREE.Group>(null);
  const controlsRef = useRef<any>(null);

  // Directional sun light position: authentic 3/4 illumination with sharp curved terminator
  const sunPosition: [number, number, number] =
    planet === 'moon' ? [8.5, 2.8, 5.5] : [8.2, 3.0, 5.8];

  return (
    <div className="absolute inset-0 w-full h-full bg-[#000000] overflow-hidden select-none">
      <Canvas
        camera={{ position: [0, 0, 9.8], fov: 38, near: 0.1, far: 500 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
      >
        {/* Background Cosmos */}
        <ArchivalStarfield />

        {/* Primary Solar Directional Illumination (Daylight side with crisp terminator) */}
        <directionalLight
          position={sunPosition}
          intensity={planet === 'moon' ? 2.8 : 2.6}
          color={planet === 'moon' ? '#FFF9F0' : '#FFF2E0'}
          castShadow
        />

        {/* Cold Space / Earthshine fill on night side */}
        <directionalLight
          position={[-9, -1, -4]}
          intensity={planet === 'moon' ? 0.22 : 0.18}
          color={planet === 'moon' ? '#7A96B8' : '#734E40'}
        />

        {/* Subtle Cosmic Ambient Illumination */}
        <ambientLight intensity={0.035} color="#8A92A0" />

        {/* Camera Transition Choreographer */}
        <CameraTransitionManager
          selectedSite={selectedSite}
          cameraCue={cameraCue}
          planet={planet}
          spinGroupRef={spinGroupRef}
          controlsRef={controlsRef}
        />

        {/* Orbit Controls (Zoom in/out, Pan, Orbit) */}
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.65}
          zoomSpeed={0.85}
          panSpeed={0.5}
          minDistance={4.2}
          maxDistance={22.0}
          enablePan={false}
        />

        {/* 3D Planetary Globe & Markers */}
        <Suspense fallback={null}>
          <PlanetaryGlobe
            planet={planet}
            activeLayerType={activeLayerType}
            terrainExaggeration={terrainExaggeration}
            showGraticule={showGraticule}
            isAutoRotating={isAutoRotating}
            onPointerCoordinate={onPointerCoordinate}
            spinGroupRef={spinGroupRef}
          />

          {/* Markers & Rover Traversal Routes rotate synchronously with the globe */}
          <group ref={spinGroupRef}>
            {/* 3D Rover Traversal Paths */}
            {traverses.map((traverse) => (
              <RoverTraversePath3D
                key={traverse.id}
                traverse={traverse}
                isSelectedRover={selectedSite?.traverseId === traverse.id}
                onSelectWaypoint={onSelectWaypoint}
              />
            ))}

            {/* Hardware Location Markers */}
            <PlanetaryMarkers
              sites={sites}
              selectedSiteId={selectedSite?.id || null}
              hoveredSiteId={hoveredSiteId}
              onHoverSite={onHoverSite}
              onSelectSite={onSelectSite}
              spinGroupRef={spinGroupRef}
            />
          </group>
        </Suspense>
      </Canvas>
    </div>
  );
};
