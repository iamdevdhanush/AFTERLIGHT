import React, { useMemo, useRef, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useExperienceStore } from '../../../store/useExperienceStore';

interface ApolloEagleModelProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export const ApolloEagleModel: React.FC<ApolloEagleModelProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0.45, 0],
  scale = 1.25,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const hoverArtifact = useExperienceStore((s) => s.hoverArtifact);
  const selectArtifact = useExperienceStore((s) => s.selectArtifact);
  const selectedArtifactId = useExperienceStore((s) => s.selectedArtifactId);
  const state = useExperienceStore((s) => s.state);

  const isSelected = selectedArtifactId === 'apollo11_eagle';
  const isExploration = state === 'FREE_EXPLORATION';

  // Load official NASA 3D model
  const { scene } = useGLTF('/models/apollo_lunar_module.glb', '/draco/');

  // Clone and configure materials with physically accurate lunar PBR
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.material) {
          const enhanceMaterial = (mat: THREE.Material) => {
            if (mat instanceof THREE.MeshStandardMaterial) {
              const name = mat.name.toLowerCase();

              // Gold Kapton / Mylar thermal insulation foil
              if (
                name.includes('blinn1') ||
                name.includes('blinn9') ||
                name.includes('blinn10') ||
                mat.color.r > 0.6 && mat.color.b < 0.2
              ) {
                mat.metalness = 0.92;
                mat.roughness = 0.28;
                mat.color.set('#E5B342'); // Authentic Apollo gold foil color
              }
              // Black nickel heat-resistant foil (engine surrounds & quadrants)
              else if (
                name.includes('blinn6') ||
                (mat.color.r < 0.1 && mat.color.g < 0.1 && mat.color.b < 0.1)
              ) {
                mat.metalness = 0.65;
                mat.roughness = 0.45;
                mat.color.set('#16181A');
              }
              // Titanium / anodized aluminum struts & ascent stage skin
              else if (
                name.includes('blinn4') ||
                name.includes('blinn3') ||
                name.includes('initial')
              ) {
                mat.metalness = 0.85;
                mat.roughness = 0.35;
                mat.color.set('#C2C7CE');
              } else {
                mat.metalness = Math.max(mat.metalness, 0.7);
                mat.roughness = Math.min(mat.roughness, 0.4);
              }

              mat.envMapIntensity = 1.2;
              mat.needsUpdate = true;
            }
          };

          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(enhanceMaterial);
          } else {
            enhanceMaterial(mesh.material);
          }
        }
      }
    });

    return clone;
  }, [scene]);

  // Subtle floating micro-shimmer when selected
  useFrame(({ clock }) => {
    if (isSelected && groupRef.current) {
      // Subtle stabilization
    }
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (isExploration) {
      setHovered(true);
      hoverArtifact('apollo11_eagle');
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = () => {
    setHovered(false);
    hoverArtifact(null);
    document.body.style.cursor = 'default';
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (isExploration) {
      selectArtifact('apollo11_eagle');
    }
  };

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {/* 1. OFFICIAL NASA APOLLO LUNAR MODULE 3D MODEL */}
      {/* Note: bounding box base is at Y=0.102m, so -0.102 aligns footpads to Y=0 */}
      <primitive object={clonedScene} scale={scale} position={[0, -0.102 * scale, 0]} />

      {/* 2. RESTRAINED GROUND BEACON (ONLY IN FREE EXPLORATION) */}
      {isExploration && (
        <group position={[0, 0.02, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[4.2, 4.25, 64]} />
            <meshBasicMaterial
              color={hovered ? '#D99A63' : '#E8E3D9'}
              transparent
              opacity={hovered ? 0.8 : 0.25}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}

      {/* 3. HISTORIC TRANQUILITY BASE ELEMENTS NEARBY */}
      {/* Early Apollo Scientific Experiments Package (EASEP) */}
      <group position={[-5.8, 0, 4.2]} rotation={[0, 0.6, 0]}>
        {/* Passive Seismic Experiment Package (PSEP) */}
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.7, 0.45, 0.55]} />
          <meshStandardMaterial color="#BFC4CA" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Laser Ranging Retro-Reflector (LRRR) */}
        <group position={[1.4, 0, 0.3]} rotation={[0.4, -0.3, 0]}>
          <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.8, 0.55, 0.2]} />
            <meshStandardMaterial color="#9EA3A8" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Retro-reflector corner-cube prisms */}
          <mesh position={[0, 0.3, 0.11]}>
            <planeGeometry args={[0.65, 0.4]} />
            <meshStandardMaterial color="#2E3C48" metalness={0.95} roughness={0.1} />
          </mesh>
        </group>
      </group>

      {/* The American Flag planted in lunar regolith */}
      <group position={[4.8, 0, -3.2]} rotation={[0, -0.4, 0]}>
        {/* Flagstaff pole */}
        <mesh position={[0, 1.1, 0]} castShadow>
          <cylinderGeometry args={[0.018, 0.018, 2.2, 16]} />
          <meshStandardMaterial color="#D8DDE3" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Horizontal crossbar holding flag rigid in vacuum */}
        <mesh position={[0.55, 2.18, 0]}>
          <boxGeometry args={[1.1, 0.015, 0.015]} />
          <meshStandardMaterial color="#D8DDE3" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Flag fabric */}
        <mesh position={[0.55, 1.75, 0]} castShadow receiveShadow>
          <planeGeometry args={[1.1, 0.85]} />
          <meshStandardMaterial
            color="#D43D3D"
            roughness={0.8}
            metalness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Displaced regolith / Astronaut bootprint paths */}
      <group position={[0, 0.01, 0]}>
        {/* Footprint trail from ladder to flag */}
        {[-0.8, -0.4, 0, 0.4, 0.8, 1.2, 1.6, 2.0, 2.4, 2.8, 3.2, 3.6, 4.0].map((step, i) => (
          <mesh
            key={i}
            position={[step * 1.1 + Math.sin(i) * 0.15, 0, -step * 0.7 + (i % 2 === 0 ? 0.12 : -0.12)]}
            rotation={[-Math.PI / 2, 0, -0.5]}
          >
            <planeGeometry args={[0.18, 0.32]} />
            <meshStandardMaterial
              color="#22252A" // Darker disturbed regolith
              roughness={0.98}
              metalness={0.02}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
};

useGLTF.preload('/models/apollo_lunar_module.glb');
