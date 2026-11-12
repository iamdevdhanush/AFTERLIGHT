import React, { useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useExperienceStore } from '../../../store/useExperienceStore';

interface OpportunityModelProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  artifactId?: string;
}

export const OpportunityModel: React.FC<OpportunityModelProps> = ({
  position = [0, 0.45, 0],
  rotation = [0, 0.25, 0],
  scale = 1,
  artifactId = 'opportunity',
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const dishRef = useRef<THREE.Group>(null);
  const armRef = useRef<THREE.Group>(null);

  const [hovered, setHovered] = useState(false);
  const hoverArtifact = useExperienceStore((s) => s.hoverArtifact);
  const selectArtifact = useExperienceStore((s) => s.selectArtifact);
  const selectedArtifactId = useExperienceStore((s) => s.selectedArtifactId);
  const state = useExperienceStore((s) => s.state);

  const isSelected = selectedArtifactId === artifactId;
  const isExploration = state === 'FREE_EXPLORATION';

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (dishRef.current) {
      // Subtle antenna micro-tracking
      dishRef.current.rotation.y = Math.sin(t * 0.15) * 0.08 + 0.3;
    }
    if (armRef.current && isSelected) {
      // Subtle scientific micro-adjustment when inspected
      armRef.current.rotation.z = -0.2 + Math.sin(t * 0.4) * 0.02;
    }
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (isExploration) {
      setHovered(true);
      hoverArtifact(artifactId);
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
      selectArtifact(artifactId);
    }
  };

  // Materials with authentic Martian weathering
  const goldFoilMat = new THREE.MeshStandardMaterial({
    color: '#D4AF37',
    metalness: 0.85,
    roughness: 0.35,
  });

  const solarCellMat = new THREE.MeshStandardMaterial({
    color: '#121820',
    metalness: 0.6,
    roughness: 0.25,
  });

  const solarGridMat = new THREE.MeshStandardMaterial({
    color: '#B08850',
    metalness: 0.7,
    roughness: 0.4,
  });

  const titaniumMat = new THREE.MeshStandardMaterial({
    color: '#8A8D91',
    metalness: 0.75,
    roughness: 0.45,
  });

  const wheelMat = new THREE.MeshStandardMaterial({
    color: '#655042', // Machined aluminum with Martian iron dust coating
    metalness: 0.5,
    roughness: 0.7,
  });

  const opticsLensMat = new THREE.MeshStandardMaterial({
    color: '#1a334d',
    metalness: 0.9,
    roughness: 0.1,
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
      {/* GROUND CONTEXTUAL BEACON / COORDINATE RING */}
      {isExploration && (
        <group position={[0, -0.4, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.8, 1.84, 64]} />
            <meshBasicMaterial
              color={hovered ? '#D99A63' : '#63F0C8'}
              transparent
              opacity={hovered ? 0.9 : 0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.2, 2.22, 64]} />
            <meshBasicMaterial
              color="#D99A63"
              transparent
              opacity={hovered ? 0.4 : 0.15}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}

      {/* 1. CHASSIS / WARM ELECTRONICS BOX (WEB) */}
      <group position={[0, 0.45, 0]}>
        {/* Main faceted body */}
        <mesh material={goldFoilMat} castShadow receiveShadow>
          <boxGeometry args={[1.1, 0.45, 1.4]} />
        </mesh>
        {/* Rear equipment bay */}
        <mesh position={[0, 0.05, 0.85]} material={titaniumMat} castShadow>
          <boxGeometry args={[0.9, 0.35, 0.3]} />
        </mesh>

        {/* 2. SOLAR ARRAYS (Triangular bat-wing panels) */}
        {/* Central panel */}
        <mesh position={[0, 0.24, 0]} material={solarCellMat} castShadow receiveShadow>
          <boxGeometry args={[1.06, 0.02, 1.36]} />
        </mesh>
        {/* Solar grid trim */}
        <mesh position={[0, 0.25, 0]} material={solarGridMat}>
          <boxGeometry args={[1.08, 0.01, 0.04]} />
        </mesh>
        <mesh position={[0, 0.25, 0.4]} material={solarGridMat}>
          <boxGeometry args={[1.08, 0.01, 0.04]} />
        </mesh>
        <mesh position={[0, 0.25, -0.4]} material={solarGridMat}>
          <boxGeometry args={[1.08, 0.01, 0.04]} />
        </mesh>

        {/* Left Solar Wing */}
        <group position={[-0.9, 0.23, 0]}>
          <mesh material={solarCellMat} castShadow>
            <cylinderGeometry args={[0.4, 0.7, 0.02, 3]} />
          </mesh>
          <mesh position={[0.3, 0, 0]} material={titaniumMat}>
            <boxGeometry args={[0.4, 0.03, 0.9]} />
          </mesh>
        </group>

        {/* Right Solar Wing */}
        <group position={[0.9, 0.23, 0]} rotation={[0, Math.PI, 0]}>
          <mesh material={solarCellMat} castShadow>
            <cylinderGeometry args={[0.4, 0.7, 0.02, 3]} />
          </mesh>
          <mesh position={[0.3, 0, 0]} material={titaniumMat}>
            <boxGeometry args={[0.4, 0.03, 0.9]} />
          </mesh>
        </group>

        {/* 3. PANCAM MAST ASSEMBLY (PMA) */}
        <group position={[0.25, 0.24, -0.45]}>
          {/* Vertical mast column */}
          <mesh position={[0, 0.65, 0]} material={titaniumMat} castShadow>
            <cylinderGeometry args={[0.035, 0.04, 1.3, 16]} />
          </mesh>
          {/* Mast strut bracing */}
          <mesh position={[-0.15, 0.35, 0]} rotation={[0, 0, -0.4]} material={titaniumMat}>
            <cylinderGeometry args={[0.015, 0.015, 0.8, 8]} />
          </mesh>

          {/* Panoramic Camera Head Assembly */}
          <group position={[0, 1.32, 0]}>
            {/* Azimuth actuator block */}
            <mesh material={titaniumMat}>
              <boxGeometry args={[0.26, 0.1, 0.16]} />
            </mesh>
            {/* Stereo Left & Right Pancam Bar */}
            <mesh position={[0, 0.1, 0]} material={titaniumMat}>
              <boxGeometry args={[0.45, 0.08, 0.08]} />
            </mesh>
            {/* Left Pancam Optic */}
            <mesh position={[-0.18, 0.1, -0.05]} rotation={[Math.PI / 2, 0, 0]} material={opticsLensMat}>
              <cylinderGeometry args={[0.035, 0.035, 0.06, 16]} />
            </mesh>
            {/* Right Pancam Optic */}
            <mesh position={[0.18, 0.1, -0.05]} rotation={[Math.PI / 2, 0, 0]} material={opticsLensMat}>
              <cylinderGeometry args={[0.035, 0.035, 0.06, 16]} />
            </mesh>
            {/* Navcam wide stereo pair (inner) */}
            <mesh position={[-0.07, 0.04, -0.05]} rotation={[Math.PI / 2, 0, 0]} material={opticsLensMat}>
              <cylinderGeometry args={[0.02, 0.02, 0.04, 12]} />
            </mesh>
            <mesh position={[0.07, 0.04, -0.05]} rotation={[Math.PI / 2, 0, 0]} material={opticsLensMat}>
              <cylinderGeometry args={[0.02, 0.02, 0.04, 12]} />
            </mesh>
            {/* Sun sensor disc */}
            <mesh position={[0, 0.16, 0.04]} material={solarCellMat}>
              <cylinderGeometry args={[0.04, 0.04, 0.01, 16]} />
            </mesh>
          </group>
        </group>

        {/* 4. HIGH-GAIN DISH ANTENNA (HGA) */}
        <group ref={dishRef} position={[-0.32, 0.32, 0.45]} rotation={[-0.4, 0.3, 0]}>
          {/* Gimbal gimbal mount */}
          <mesh material={titaniumMat}>
            <cylinderGeometry args={[0.04, 0.04, 0.12, 12]} />
          </mesh>
          {/* Parabolic reflector bowl */}
          <mesh position={[0, 0.1, 0]} rotation={[0, 0, 0]} material={titaniumMat} castShadow>
            <sphereGeometry args={[0.26, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
          </mesh>
          {/* Sub-reflector feed horn tripod */}
          <mesh position={[0, 0.22, 0]} material={goldFoilMat}>
            <coneGeometry args={[0.03, 0.14, 8]} />
          </mesh>
        </group>

        {/* Low-gain whip antenna */}
        <mesh position={[0.38, 0.5, 0.55]} material={titaniumMat}>
          <cylinderGeometry args={[0.008, 0.01, 0.65, 8]} />
        </mesh>

        {/* 5. INSTRUMENT DEPLOYMENT DEVICE (ROBOTIC ARM) */}
        <group ref={armRef} position={[0, -0.1, -0.72]} rotation={[-0.2, 0, 0]}>
          {/* Shoulder joint */}
          <mesh material={titaniumMat}>
            <sphereGeometry args={[0.06, 12, 12]} />
          </mesh>
          {/* Bicep strut */}
          <mesh position={[0, -0.18, 0.05]} rotation={[-0.4, 0, 0]} material={titaniumMat}>
            <cylinderGeometry args={[0.025, 0.025, 0.38, 12]} />
          </mesh>
          {/* Elbow joint */}
          <mesh position={[0, -0.32, 0.15]} material={titaniumMat}>
            <sphereGeometry args={[0.05, 12, 12]} />
          </mesh>
          {/* Forearm strut */}
          <mesh position={[0, -0.42, 0.05]} rotation={[0.5, 0, 0]} material={titaniumMat}>
            <cylinderGeometry args={[0.022, 0.022, 0.28, 12]} />
          </mesh>
          {/* Sensor Turret Head (RAT, APXS, Mössbauer, Microscopic Imager) */}
          <group position={[0, -0.52, -0.05]}>
            <mesh material={titaniumMat}>
              <cylinderGeometry args={[0.08, 0.08, 0.09, 16]} />
            </mesh>
            <mesh position={[0.06, 0, 0]} material={goldFoilMat}>
              <cylinderGeometry args={[0.03, 0.03, 0.05, 8]} />
            </mesh>
            <mesh position={[-0.06, 0, 0]} material={wheelMat}>
              <cylinderGeometry args={[0.035, 0.035, 0.04, 8]} />
            </mesh>
          </group>
        </group>
      </group>

      {/* 6. ROCKER-BOGIE 6-WHEEL SUSPENSION */}
      {/* Port (Left) Suspension System */}
      <group position={[-0.65, 0, 0]}>
        {/* Main Rocker link */}
        <mesh position={[0, 0.18, 0]} rotation={[0.1, 0, 0]} material={titaniumMat}>
          <boxGeometry args={[0.06, 0.06, 1.4]} />
        </mesh>
        {/* Bogie link */}
        <mesh position={[0, 0.05, 0.45]} rotation={[-0.2, 0, 0]} material={titaniumMat}>
          <boxGeometry args={[0.05, 0.05, 0.85]} />
        </mesh>

        {/* Front Left Wheel */}
        <group position={[-0.1, -0.15, -0.7]}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={wheelMat} castShadow>
            <cylinderGeometry args={[0.18, 0.18, 0.16, 24]} />
          </mesh>
          {/* Cleats/treads */}
          <mesh rotation={[0, 0, Math.PI / 2]} material={titaniumMat}>
            <cylinderGeometry args={[0.185, 0.185, 0.02, 12]} />
          </mesh>
        </group>

        {/* Middle Left Wheel */}
        <group position={[-0.1, -0.15, 0.15]}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={wheelMat} castShadow>
            <cylinderGeometry args={[0.18, 0.18, 0.16, 24]} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} material={titaniumMat}>
            <cylinderGeometry args={[0.185, 0.185, 0.02, 12]} />
          </mesh>
        </group>

        {/* Rear Left Wheel */}
        <group position={[-0.1, -0.15, 0.85]}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={wheelMat} castShadow>
            <cylinderGeometry args={[0.18, 0.18, 0.16, 24]} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} material={titaniumMat}>
            <cylinderGeometry args={[0.185, 0.185, 0.02, 12]} />
          </mesh>
        </group>
      </group>

      {/* Starboard (Right) Suspension System */}
      <group position={[0.65, 0, 0]}>
        {/* Main Rocker link */}
        <mesh position={[0, 0.18, 0]} rotation={[0.1, 0, 0]} material={titaniumMat}>
          <boxGeometry args={[0.06, 0.06, 1.4]} />
        </mesh>
        {/* Bogie link */}
        <mesh position={[0, 0.05, 0.45]} rotation={[-0.2, 0, 0]} material={titaniumMat}>
          <boxGeometry args={[0.05, 0.05, 0.85]} />
        </mesh>

        {/* Front Right Wheel */}
        <group position={[0.1, -0.15, -0.7]}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={wheelMat} castShadow>
            <cylinderGeometry args={[0.18, 0.18, 0.16, 24]} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} material={titaniumMat}>
            <cylinderGeometry args={[0.185, 0.185, 0.02, 12]} />
          </mesh>
        </group>

        {/* Middle Right Wheel */}
        <group position={[0.1, -0.15, 0.15]}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={wheelMat} castShadow>
            <cylinderGeometry args={[0.18, 0.18, 0.16, 24]} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} material={titaniumMat}>
            <cylinderGeometry args={[0.185, 0.185, 0.02, 12]} />
          </mesh>
        </group>

        {/* Rear Right Wheel */}
        <group position={[0.1, -0.15, 0.85]}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={wheelMat} castShadow>
            <cylinderGeometry args={[0.18, 0.18, 0.16, 24]} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} material={titaniumMat}>
            <cylinderGeometry args={[0.185, 0.185, 0.02, 12]} />
          </mesh>
        </group>
      </group>

      {/* WHEEL RUTS / TRACKS IN MARTIAN SOIL */}
      <group position={[0, -0.44, 4]}>
        {/* Left Track */}
        <mesh position={[-0.75, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.22, 8]} />
          <meshStandardMaterial color="#883B1B" roughness={0.95} />
        </mesh>
        {/* Right Track */}
        <mesh position={[0.75, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.22, 8]} />
          <meshStandardMaterial color="#883B1B" roughness={0.95} />
        </mesh>
      </group>
    </group>
  );
};
