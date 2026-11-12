import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { OpportunityModel } from '../artifacts/OpportunityModel';
import { useExperienceStore } from '../../../store/useExperienceStore';

export const MarsEnvironment: React.FC = () => {
  const noise2D = useMemo(() => createNoise2D(), []);
  const particlesRef = useRef<THREE.Points>(null);
  const graphicsQuality = useExperienceStore((s) => s.graphicsQuality);

  // Resolution based on graphics quality
  const resolution = graphicsQuality === 'high' ? 128 : graphicsQuality === 'medium' ? 96 : 64;

  // Generate procedural terrain geometry with multi-octave fBm
  const { geometry, rockTransforms } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(120, 120, resolution, resolution);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors: number[] = [];

    // Color definitions for Martian geology
    const colorBasalt = new THREE.Color('#3A1E14');
    const colorRedRock = new THREE.Color('#A84722');
    const colorOchreDust = new THREE.Color('#D97843');
    const colorSulfateSand = new THREE.Color('#E39F68');

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Distance from center (Opportunity's location)
      const distFromCenter = Math.sqrt(x * x + z * z);

      // Multi-octave simplex noise
      const n1 = noise2D(x * 0.02, z * 0.02);
      const n2 = noise2D(x * 0.06, z * 0.06) * 0.5;
      const n3 = noise2D(x * 0.15, z * 0.15) * 0.2;

      let elevation = (n1 + n2 + n3) * 3.8;

      // Flatten near Opportunity's immediate landing spot for believable wheel contact
      if (distFromCenter < 5.0) {
        const blend = Math.max(0, (distFromCenter - 1.5) / 3.5);
        elevation *= blend;
      }

      // Endeavour Crater rim rise in distance
      if (z < -20) {
        elevation += Math.pow(Math.abs(z + 20) * 0.18, 1.4);
      }

      pos.setY(i, elevation);

      // Procedural vertex coloring based on elevation and slope
      const normY = THREE.MathUtils.clamp((elevation + 3) / 10, 0, 1);
      const mixedColor = new THREE.Color();

      if (normY < 0.3) {
        mixedColor.copy(colorBasalt).lerp(colorRedRock, normY / 0.3);
      } else if (normY < 0.7) {
        mixedColor.copy(colorRedRock).lerp(colorOchreDust, (normY - 0.3) / 0.4);
      } else {
        mixedColor.copy(colorOchreDust).lerp(colorSulfateSand, (normY - 0.7) / 0.3);
      }

      colors.push(mixedColor.r, mixedColor.g, mixedColor.b);
    }

    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    // Scatter realistic Martian boulders/rocks
    const rocks: { position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] }[] = [];
    const rockCount = graphicsQuality === 'high' ? 80 : 40;

    for (let r = 0; r < rockCount; r++) {
      const angle = (r / rockCount) * Math.PI * 2 + (r % 7);
      const dist = 3.5 + (r * 1.2) % 40;
      const rx = Math.cos(angle) * dist;
      const rz = Math.sin(angle) * dist;

      const nRock = (noise2D(rx * 0.02, rz * 0.02) + noise2D(rx * 0.06, rz * 0.06) * 0.5) * 3.8;
      const ry = (dist < 5.0 ? 0 : nRock) - 0.08;

      const scaleBase = 0.15 + (Math.sin(r * 3) + 1) * 0.25;
      rocks.push({
        position: [rx, ry, rz],
        rotation: [Math.sin(r) * 0.4, r * 1.5, Math.cos(r) * 0.4],
        scale: [scaleBase, scaleBase * 0.65, scaleBase * 0.9],
      });
    }

    return { geometry: geo, rockTransforms: rocks };
  }, [noise2D, resolution, graphicsQuality]);

  // Atmospheric dust particle cloud
  const dustParticles = useMemo(() => {
    const count = graphicsQuality === 'high' ? 1200 : 600;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 70;
      positions[i * 3 + 1] = Math.random() * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 70;
    }
    return positions;
  }, [graphicsQuality]);

  // Animate dust particles slowly drifting in the Martian wind
  useFrame((_, delta) => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += delta * 1.2; // drift along X
        positions[i + 1] += Math.sin(Date.now() * 0.001 + i) * 0.004; // micro bob
        if (positions[i] > 35) positions[i] = -35;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* 1. PLANETARY LIGHTING — Realistic Low-Angle Martian Sunlight */}
      <ambientLight intensity={0.45} color="#45241C" />
      <directionalLight
        position={[25, 18, 30]}
        intensity={2.8}
        color="#FFA372"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={80}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-bias={-0.0005}
      />
      {/* Atmospheric secondary backfill light */}
      <directionalLight position={[-20, 8, -20]} intensity={0.5} color="#683424" />

      {/* Atmospheric Fog */}
      <fog attach="fog" args={['#2B1E17', 15, 75]} />

      {/* 2. PROCEDURAL MARTIAN TERRAIN */}
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial
          vertexColors
          roughness={0.92}
          metalness={0.08}
          flatShading={false}
        />
      </mesh>

      {/* 3. SCATTERED MARTIAN BOULDERS */}
      {rockTransforms.map((tr, idx) => (
        <mesh
          key={idx}
          position={tr.position}
          rotation={tr.rotation}
          scale={tr.scale}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color="#7D3E24" roughness={0.96} metalness={0.05} />
        </mesh>
      ))}

      {/* 4. ATMOSPHERIC DUST DRIFT PARTICLES */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[dustParticles, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          color="#D99A63"
          transparent
          opacity={0.35}
          sizeAttenuation
        />
      </points>

      {/* 5. ARTIFACTS: OPPORTUNITY ROVER & SPIRIT ROVER */}
      <OpportunityModel position={[0, 0.44, 0]} rotation={[0, 0.35, 0]} />

      {/* SPIRIT (MER-A) DISTANT SECTOR MARKER */}
      <group position={[-16, 0.6, -14]} rotation={[0, 0.8, 0]}>
        <OpportunityModel position={[0, 0, 0]} rotation={[0, 1.2, 0]} scale={0.8} artifactId="spirit" />
      </group>

      {/* DISTANT HORIZON CRATER RIM BACKDROP */}
      <group position={[0, -5, -45]}>
        <mesh>
          <cylinderGeometry args={[55, 60, 25, 32, 1, true, -Math.PI / 2, Math.PI]} />
          <meshBasicMaterial color="#1C1411" side={THREE.BackSide} />
        </mesh>
      </group>
    </group>
  );
};
