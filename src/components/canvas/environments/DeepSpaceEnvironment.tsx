import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VoyagerModel } from '../artifacts/VoyagerModel';

export const DeepSpaceEnvironment: React.FC = () => {
  const starsRef = useRef<THREE.Points>(null);

  // Generate 4,000 multi-spectral deep space stars
  const { starPositions, starColors } = useMemo(() => {
    const count = 4000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const spectralColors = [
      new THREE.Color('#9BB0FF'), // Class O/B (Deep Blue)
      new THREE.Color('#CAD8FF'), // Class A (White-Blue)
      new THREE.Color('#FFFFFF'), // Class F (Pure White)
      new THREE.Color('#FFF4E8'), // Class G (Warm Yellow)
      new THREE.Color('#FFD2A1'), // Class K (Orange)
      new THREE.Color('#FF9876'), // Class M (Red)
    ];

    for (let i = 0; i < count; i++) {
      // Distribute on large spherical shell
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 90 + Math.random() * 60;

      const sinPhi = Math.sin(phi);
      positions[i * 3] = r * sinPhi * Math.cos(theta);
      positions[i * 3 + 1] = r * sinPhi * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const color = spectralColors[Math.floor(Math.random() * spectralColors.length)];
      const brightness = 0.4 + Math.random() * 0.6;
      colors[i * 3] = color.r * brightness;
      colors[i * 3 + 1] = color.g * brightness;
      colors[i * 3 + 2] = color.b * brightness;
    }

    return { starPositions: positions, starColors: colors };
  }, []);

  // Hyperbolic Trajectory Line curving into the unknown
  const trajectoryPoints = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let t = -30; t <= 30; t += 1) {
      const z = t;
      // Hyperbola: x = sqrt(1 + z^2/b^2)*a
      const x = Math.sqrt(1 + (z * z) / 25) * 4 - 8;
      const y = Math.sin(t * 0.08) * 2 - 1;
      pts.push(new THREE.Vector3(x, y, z));
    }
    return pts;
  }, []);

  const curveGeo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(trajectoryPoints);
    return new THREE.BufferGeometry().setFromPoints(curve.getPoints(120));
  }, [trajectoryPoints]);

  const trajectoryLine = useMemo(() => {
    const mat = new THREE.LineDashedMaterial({
      color: '#D99A63',
      dashSize: 0.8,
      gapSize: 0.4,
      transparent: true,
      opacity: 0.35,
    });
    const line = new THREE.Line(curveGeo, mat);
    line.computeLineDistances();
    return line;
  }, [curveGeo]);

  useFrame(() => {
    if (starsRef.current) {
      starsRef.current.rotation.y += 0.00004;
    }
  });

  return (
    <group>
      {/* 1. LIGHTING — Distant Sun as a Point Source & Interstellar Fill */}
      <ambientLight intensity={0.15} color="#101524" />
      <directionalLight
        position={[-40, 25, 50]}
        intensity={3.2}
        color="#F8FAFC"
        castShadow
      />
      {/* Cosmic background back-scatter */}
      <directionalLight position={[40, -20, -50]} intensity={0.4} color="#3E4C6D" />

      {/* 2. DEEP MULTI-SPECTRAL STARFIELD */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[starPositions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[starColors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.65}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation
        />
      </points>

      {/* 3. DISTANT SUN (MAGNITUDE −21 PINPOINT) */}
      <group position={[-40, 25, 50]}>
        <mesh>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
        <mesh scale={2.4}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshBasicMaterial color="#FFEBA6" transparent opacity={0.2} />
        </mesh>
      </group>

      {/* 4. HYPERBOLIC ESCAPE TRAJECTORY SPLINE */}
      <primitive object={trajectoryLine} />

      {/* 5. VOYAGER 1 SPACECRAFT */}
      <VoyagerModel position={[0, 0, 0]} rotation={[0.2, 0.6, 0.1]} />
    </group>
  );
};
