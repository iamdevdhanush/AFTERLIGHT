import React, { useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useExperienceStore } from '../../../store/useExperienceStore';

interface VoyagerModelProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export const VoyagerModel: React.FC<VoyagerModelProps> = ({
  position = [0, 0, 0],
  rotation = [0.2, 0.5, 0.1],
  scale = 1,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const hoverArtifact = useExperienceStore((s) => s.hoverArtifact);
  const selectArtifact = useExperienceStore((s) => s.selectArtifact);
  const state = useExperienceStore((s) => s.state);

  const isExploration = state === 'FREE_EXPLORATION';

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current && state === 'FREE_EXPLORATION') {
      // Gentle interstellar drift
      groupRef.current.position.y = position[1] + Math.sin(t * 0.4) * 0.12;
      groupRef.current.rotation.z = rotation[2] + Math.sin(t * 0.2) * 0.05;
    }
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (isExploration) {
      setHovered(true);
      hoverArtifact('voyager1');
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
      selectArtifact('voyager1');
    }
  };

  const whiteDishMat = new THREE.MeshStandardMaterial({
    color: '#ECEEF0',
    metalness: 0.1,
    roughness: 0.3,
  });

  const busMat = new THREE.MeshStandardMaterial({
    color: '#32373D',
    metalness: 0.7,
    roughness: 0.4,
  });

  const goldRecordMat = new THREE.MeshStandardMaterial({
    color: '#E5B158',
    metalness: 0.95,
    roughness: 0.2,
  });

  const boomMat = new THREE.MeshStandardMaterial({
    color: '#84888D',
    metalness: 0.8,
    roughness: 0.4,
  });

  const rtgCanisterMat = new THREE.MeshStandardMaterial({
    color: '#2A2D30',
    metalness: 0.5,
    roughness: 0.6,
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={scale}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {/* Selection / Contextual Halo in Interstellar Space */}
      {isExploration && (
        <group>
          <mesh rotation={[Math.PI / 4, 0, 0]}>
            <ringGeometry args={[4.2, 4.28, 64]} />
            <meshBasicMaterial
              color={hovered ? '#D99A63' : '#63F0C8'}
              transparent
              opacity={hovered ? 0.9 : 0.35}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}

      {/* 1. HIGH-GAIN DISH ANTENNA (3.7 METERS) */}
      <group position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {/* Parabolic Reflector Dish */}
        <mesh material={whiteDishMat} castShadow>
          <sphereGeometry args={[2.4, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.4]} />
        </mesh>
        {/* Sub-reflector Tripod Feed */}
        <group position={[0, 0, 1.2]}>
          <mesh material={whiteDishMat}>
            <sphereGeometry args={[0.22, 16, 16]} />
          </mesh>
          <mesh position={[0, 0.4, -0.6]} rotation={[0.4, 0, 0]} material={boomMat}>
            <cylinderGeometry args={[0.015, 0.015, 1.2, 8]} />
          </mesh>
          <mesh position={[-0.35, -0.2, -0.6]} rotation={[-0.2, 0, 0.4]} material={boomMat}>
            <cylinderGeometry args={[0.015, 0.015, 1.2, 8]} />
          </mesh>
          <mesh position={[0.35, -0.2, -0.6]} rotation={[-0.2, 0, -0.4]} material={boomMat}>
            <cylinderGeometry args={[0.015, 0.015, 1.2, 8]} />
          </mesh>
        </group>
      </group>

      {/* 2. SPACECRAFT BUS (10-SIDED RING HULL) */}
      <group position={[0, 0, -0.9]}>
        <mesh material={busMat} castShadow>
          <cylinderGeometry args={[1.1, 1.1, 0.65, 10]} />
        </mesh>

        {/* 3. THE GOLDEN RECORD */}
        <group position={[1.12, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh material={goldRecordMat}>
            <cylinderGeometry args={[0.42, 0.42, 0.02, 32]} />
          </mesh>
          {/* Cover central spindle and etched symbolic lines */}
          <mesh position={[0, 0.015, 0]} material={goldRecordMat}>
            <ringGeometry args={[0.1, 0.38, 32]} />
          </mesh>
        </group>

        {/* 4. MAGNETOMETER BOOM (13 METERS EXTENSION) */}
        <group position={[0, -0.4, 0]} rotation={[0.8, -0.4, 0]}>
          <mesh position={[0, 0, -3.2]} rotation={[Math.PI / 2, 0, 0]} material={boomMat}>
            <cylinderGeometry args={[0.035, 0.035, 6.4, 8]} />
          </mesh>
          {/* Low-field Magnetometer Sensor at tip */}
          <mesh position={[0, 0, -6.4]} material={rtgCanisterMat}>
            <boxGeometry args={[0.2, 0.2, 0.3]} />
          </mesh>
        </group>

        {/* 5. RTG POWER BOOM (3 NUCLEAR GENERATORS) */}
        <group position={[-0.8, 0.3, 0]} rotation={[0.2, 0.8, 0]}>
          <mesh position={[-1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={boomMat}>
            <cylinderGeometry args={[0.04, 0.04, 2.4, 8]} />
          </mesh>
          {/* 3 Tandem RTG Canisters with thermal cooling fins */}
          {[-1.6, -2.1, -2.6].map((x, i) => (
            <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={rtgCanisterMat}>
              <cylinderGeometry args={[0.22, 0.22, 0.45, 16]} />
            </mesh>
          ))}
        </group>

        {/* 6. SCIENCE SCAN PLATFORM (CAMERAS, SPECTROMETERS) */}
        <group position={[0.8, 0.4, 0]} rotation={[-0.3, -0.6, 0]}>
          <mesh position={[0.9, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={boomMat}>
            <cylinderGeometry args={[0.04, 0.04, 1.8, 8]} />
          </mesh>
          <mesh position={[1.8, 0, 0]} material={busMat}>
            <boxGeometry args={[0.5, 0.4, 0.6]} />
          </mesh>
          {/* Narrow Angle Camera barrel */}
          <mesh position={[1.9, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]} material={whiteDishMat}>
            <cylinderGeometry args={[0.12, 0.12, 0.5, 16]} />
          </mesh>
        </group>
      </group>
    </group>
  );
};
