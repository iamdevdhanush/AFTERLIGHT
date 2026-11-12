import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useExperienceStore } from '../../store/useExperienceStore';

export type PlanetSphereId = 'moon' | 'mars';

interface PlanetSphereProps {
  planetId: PlanetSphereId;
}

export const PLANET_RADIUS = 2.15;

interface PlanetMaterialMaps {
  colorMap: THREE.Texture;
  bumpMap: THREE.Texture;
  roughnessMap: THREE.Texture;
}

function buildDerivedPlanetMaps(
  img: HTMLImageElement,
  planetId: PlanetSphereId
): { bumpMap: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  const width = 1024;
  const height = 512;

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = width;
  srcCanvas.height = height;
  const srcCtx = srcCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bumpCtx = bumpCanvas.getContext('2d');

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = width;
  roughCanvas.height = height;
  const roughCtx = roughCanvas.getContext('2d');

  if (!srcCtx || !bumpCtx || !roughCtx) {
    const fallbackBump = new THREE.CanvasTexture(bumpCanvas);
    const fallbackRough = new THREE.CanvasTexture(roughCanvas);
    return { bumpMap: fallbackBump, roughnessMap: fallbackRough };
  }

  srcCtx.drawImage(img, 0, 0, width, height);
  const pixels = srcCtx.getImageData(0, 0, width, height).data;

  const bumpImg = bumpCtx.createImageData(width, height);
  const roughImg = roughCtx.createImageData(width, height);
  const bumpOut = bumpImg.data;
  const roughOut = roughImg.data;

  // Luminance buffer for fast bandpass relief extraction
  const lum = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    lum[i] = (0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2]) / 255;
  }

  for (let y = 0; y < height; y++) {
    const v = y / height;
    const polarWeight = Math.max(0, (Math.abs(v - 0.5) * 2 - 0.72) / 0.28);

    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const idx = i * 4;
      const r = pixels[idx] / 255;
      const g = pixels[idx + 1] / 255;
      const b = pixels[idx + 2] / 255;
      const l = lum[i];

      const xm = x === 0 ? width - 1 : x - 1;
      const xp = x === width - 1 ? 0 : x + 1;
      const ym = y === 0 ? 0 : y - 1;
      const yp = y === height - 1 ? height - 1 : y + 1;

      const avg =
        (lum[y * width + xm] +
          lum[y * width + xp] +
          lum[ym * width + x] +
          lum[yp * width + x]) *
        0.25;
      const highPass = l - avg;

      if (planetId === 'mars') {
        // Polar ice detection: bright & low-redness ice caps stay smooth and less dusty
        const iceFactor = Math.min(
          1,
          Math.max(0, (l - 0.58) * 3.2) * (0.35 + 0.65 * polarWeight) * Math.max(0, 1.15 - (r - b) * 1.8)
        );
        // Albedo-assisted relief (basalt lows slightly depressed, Tharsis/highlands elevated, craters crispened)
        const baseHeight = 0.45 + (r - 0.45) * 0.25 + highPass * 2.1;
        const clampedBump = Math.max(0, Math.min(1, baseHeight * (1 - iceFactor * 0.65) + iceFactor * 0.52));
        const bVal = Math.round(clampedBump * 255);
        bumpOut[idx] = bVal;
        bumpOut[idx + 1] = bVal;
        bumpOut[idx + 2] = bVal;
        bumpOut[idx + 3] = 255;

        // Roughness: polar ice smoother (~0.74), dark basalt (~0.90), dusty ochre regolith (~0.98 matte)
        const dustiness = Math.max(0, Math.min(1, (r - b) * 1.6));
        const roughVal = Math.max(
          0.74,
          Math.min(0.99, (0.89 + dustiness * 0.09) * (1 - iceFactor * 0.24) + iceFactor * 0.74)
        );
        const rByte = Math.round(roughVal * 255);
        roughOut[idx] = rByte;
        roughOut[idx + 1] = rByte;
        roughOut[idx + 2] = rByte;
        roughOut[idx + 3] = 255;
      } else {
        // Moon roughness map from LROC albedo (matte porous basalt ~0.92, brecciated highlands ~0.99)
        const roughVal = Math.max(0.91, Math.min(0.99, 0.92 + l * 0.07));
        const rByte = Math.round(roughVal * 255);
        roughOut[idx] = rByte;
        roughOut[idx + 1] = rByte;
        roughOut[idx + 2] = rByte;
        roughOut[idx + 3] = 255;

        const bByte = Math.round(Math.max(0, Math.min(1, l + highPass * 1.4)) * 255);
        bumpOut[idx] = bByte;
        bumpOut[idx + 1] = bByte;
        bumpOut[idx + 2] = bByte;
        bumpOut[idx + 3] = 255;
      }
    }
  }

  bumpCtx.putImageData(bumpImg, 0, 0);
  roughCtx.putImageData(roughImg, 0, 0);

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.ClampToEdgeWrapping;
  bumpMap.anisotropy = 4;
  bumpMap.needsUpdate = true;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.ClampToEdgeWrapping;
  roughnessMap.anisotropy = 4;
  roughnessMap.needsUpdate = true;

  return { bumpMap, roughnessMap };
}

const MarsAtmosphereLimb: React.FC<{ sunDirection: THREE.Vector3 }> = ({ sunDirection }) => {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uSunDir: { value: sunDirection.clone().normalize() },
        uColor: { value: new THREE.Color('#E28554') },
        uHighColor: { value: new THREE.Color('#A8C4E0') },
      },
      vertexShader: `
        varying vec3 vWorldNormal;
        varying vec3 vViewDir;

        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldNormal = normalize(mat3(modelMatrix) * normal);
          vViewDir = normalize(cameraPosition - worldPos.xyz);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uSunDir;
        uniform vec3 uColor;
        uniform vec3 uHighColor;
        varying vec3 vWorldNormal;
        varying vec3 vViewDir;

        void main() {
          // BackSide shell normals: ndotv = 0 at outer space edge, ~0.28 hugging planetary surface
          float ndotv = clamp(dot(-vWorldNormal, vViewDir), 0.0, 1.0);
          float outerFade = smoothstep(0.0, 0.18, ndotv);
          float limbCurve = pow(clamp(1.0 - ndotv, 0.0, 1.0), 3.8);

          // Restrict limb scattering smoothly to the sunlit hemisphere & terminator
          float sunFactor = smoothstep(-0.2, 0.55, dot(vWorldNormal, uSunDir));
          float terminatorTint = smoothstep(0.35, -0.15, dot(vWorldNormal, uSunDir));
          vec3 scatterColor = mix(uColor, uHighColor, terminatorTint * 0.22);

          float alpha = outerFade * limbCurve * sunFactor * 0.42;
          gl_FragColor = vec4(scatterColor, alpha);
        }
      `,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [sunDirection]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  return (
    <mesh material={material} renderOrder={2}>
      <sphereGeometry args={[PLANET_RADIUS * 1.036, 72, 72]} />
    </mesh>
  );
};

export const OrbitalStarfield: React.FC = () => {
  const starGeometry = useMemo(() => {
    const count = 1350;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    // Deterministic PRNG so starfield stays consistent across mounts
    let seed = 19690720;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    const tints = [
      new THREE.Color('#F2F4F8'),
      new THREE.Color('#FFF3DF'),
      new THREE.Color('#DCE7FA'),
      new THREE.Color('#FFD9B3'),
    ];

    for (let i = 0; i < count; i++) {
      const u = rand();
      const v = rand();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = 90 + rand() * 55;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const tint = tints[Math.floor(rand() * tints.length)];
      const brightness = 0.25 + Math.pow(rand(), 2.2) * 0.75;
      colors[i * 3] = tint.r * brightness;
      colors[i * 3 + 1] = tint.g * brightness;
      colors[i * 3 + 2] = tint.b * brightness;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geom;
  }, []);

  useEffect(() => {
    return () => {
      starGeometry.dispose();
    };
  }, [starGeometry]);

  return (
    <points geometry={starGeometry}>
      <pointsMaterial
        size={0.28}
        vertexColors
        transparent
        opacity={0.78}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};

export const PlanetSphere: React.FC<PlanetSphereProps> = ({ planetId }) => {
  const spinGroupRef = useRef<THREE.Group>(null);
  const isDraggingRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const dragVelocityRef = useRef({ x: 0, y: 0 });
  const manualRotXRef = useRef(0);

  const [maps, setMaps] = useState<PlanetMaterialMaps | null>(null);

  const { gl } = useThree();
  const state = useExperienceStore((s) => s.state);
  const graphicsQuality = useExperienceStore((s) => s.graphicsQuality);
  const isRotationPaused = useExperienceStore((s) => s.isRotationPaused);
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);

  const segments = graphicsQuality === 'high' ? 128 : graphicsQuality === 'medium' ? 72 : 48;

  // Primary solar direction: crisp 3/4 side illumination with curved terminator
  const sunDirection = useMemo(
    () =>
      planetId === 'moon'
        ? new THREE.Vector3(7.4, 2.2, 6.2)
        : new THREE.Vector3(7.2, 2.4, 6.4),
    [planetId]
  );

  // Lazy load active planet's textures only and dispose cleanly when planet changes/unmounts
  useEffect(() => {
    let cancelled = false;
    const manager = new THREE.LoadingManager();
    const loader = new THREE.TextureLoader(manager);
    const createdTextures: THREE.Texture[] = [];

    if (planetId === 'moon') {
      let colorTex: THREE.Texture | null = null;
      let demTex: THREE.Texture | null = null;

      loader.load('/textures/moon/lroc_color_2k.jpg', (tex) => {
        if (cancelled) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        colorTex = tex;
        createdTextures.push(tex);

        const derived = buildDerivedPlanetMaps(tex.image as HTMLImageElement, 'moon');
        derived.bumpMap.dispose(); // LOLA DEM is used directly for Moon elevation
        createdTextures.push(derived.roughnessMap);

        if (demTex) {
          setMaps({
            colorMap: colorTex,
            bumpMap: demTex,
            roughnessMap: derived.roughnessMap,
          });
        }
      });

      loader.load('/textures/moon/ldem_3_8bit.jpg', (tex) => {
        if (cancelled) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.NoColorSpace;
        tex.anisotropy = 4;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        demTex = tex;
        createdTextures.push(tex);

        if (colorTex) {
          const derived = buildDerivedPlanetMaps(colorTex.image as HTMLImageElement, 'moon');
          derived.bumpMap.dispose();
          createdTextures.push(derived.roughnessMap);
          setMaps({
            colorMap: colorTex,
            bumpMap: demTex,
            roughnessMap: derived.roughnessMap,
          });
        }
      });
    } else {
      loader.load('/textures/mars/mars_color_2k.jpg', (tex) => {
        if (cancelled) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        createdTextures.push(tex);

        const derived = buildDerivedPlanetMaps(tex.image as HTMLImageElement, 'mars');
        createdTextures.push(derived.bumpMap, derived.roughnessMap);

        setMaps({
          colorMap: tex,
          bumpMap: derived.bumpMap,
          roughnessMap: derived.roughnessMap,
        });
      });
    }

    return () => {
      cancelled = true;
      setMaps(null);
      createdTextures.forEach((t) => t.dispose());
    };
  }, [planetId]);

  // Reset initial planetary longitude so signature features face the camera cleanly
  useEffect(() => {
    if (!spinGroupRef.current) return;
    // Moon near-side maria (Tycho, Mare Serenitatis/Tranquillitatis) faces forward
    // Mars Valles Marineris + Tharsis/Syrtis face forward nicely
    spinGroupRef.current.rotation.y = planetId === 'moon' ? -1.45 : -0.95;
    spinGroupRef.current.rotation.x = 0.04;
    manualRotXRef.current = 0.04;
    dragVelocityRef.current = { x: 0, y: 0 };
  }, [planetId]);

  // Interactive drag-to-rotate during DESTINATION_SELECT
  useEffect(() => {
    const dom = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      if (useExperienceStore.getState().state !== 'DESTINATION_SELECT') return;
      isDraggingRef.current = true;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      dragVelocityRef.current = { x: 0, y: 0 };
      dom.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      if (useExperienceStore.getState().state !== 'DESTINATION_SELECT') {
        isDraggingRef.current = false;
        dom.style.cursor = '';
        return;
      }
      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };

      dragVelocityRef.current.y = dx * 0.0055;
      dragVelocityRef.current.x = dy * 0.004;

      if (spinGroupRef.current) {
        spinGroupRef.current.rotation.y += dragVelocityRef.current.y;
        manualRotXRef.current = Math.max(
          -0.65,
          Math.min(0.65, manualRotXRef.current + dragVelocityRef.current.x)
        );
        spinGroupRef.current.rotation.x = manualRotXRef.current;
      }
    };

    const onPointerUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      dom.style.cursor = '';
    };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.style.cursor = '';
    };
  }, [gl]);

  // Subtle slow axial rotation + smooth drag inertia
  useFrame((_, delta) => {
    const group = spinGroupRef.current;
    if (!group) return;

    const dt = Math.min(delta, 0.05);

    if (!isDraggingRef.current) {
      // Inertial decay after pointer release
      if (Math.abs(dragVelocityRef.current.y) > 0.0001 || Math.abs(dragVelocityRef.current.x) > 0.0001) {
        group.rotation.y += dragVelocityRef.current.y;
        manualRotXRef.current = Math.max(
          -0.65,
          Math.min(0.65, manualRotXRef.current + dragVelocityRef.current.x)
        );
        group.rotation.x = manualRotXRef.current;
        dragVelocityRef.current.x *= 0.92;
        dragVelocityRef.current.y *= 0.92;
      } else if (!isRotationPaused && !reducedMotion && state === 'DESTINATION_SELECT') {
        const autoSpeed = planetId === 'moon' ? 0.024 : 0.03;
        group.rotation.y += autoSpeed * dt;
      } else if (state === 'ENVIRONMENT_LOADING') {
        // Gentle orbital rotation during approach dive
        group.rotation.y += 0.015 * dt;
      }
    }
  });

  // Real astronomical obliquity (tilting Mars North Polar Cap faintly toward viewer)
  const axialTilt: [number, number, number] =
    planetId === 'moon' ? [-0.04, 0, -0.116] : [-0.22, 0, -0.34];

  return (
    <group>
      <color attach="background" args={['#000000']} />

      {/* Crisp deep-space starfield surrounding the complete planetary globe */}
      <OrbitalStarfield />

      {/* Primary Solar Illumination: sharp day/night terminator */}
      <directionalLight
        position={[sunDirection.x, sunDirection.y, sunDirection.z]}
        intensity={planetId === 'moon' ? 3.15 : 2.95}
        color={planetId === 'moon' ? '#FFF9F0' : '#FFF4E6'}
      />

      {/* Subtle night-side fill (Earthshine on Moon; minimal reflected scatter on Mars) so entire spherical silhouette reads against black space */}
      <directionalLight
        position={[-7.5, 0.5, 3.5]}
        intensity={planetId === 'moon' ? 0.24 : 0.22}
        color={planetId === 'moon' ? '#8FA3BA' : '#855846'}
      />

      {/* Subtle ambient bounce to preserve terminator detail without crushing shadow limb into void */}
      <ambientLight intensity={planetId === 'moon' ? 0.052 : 0.06} color="#A6ACB8" />

      {/* Obliquity group */}
      <group rotation={axialTilt}>
        <group ref={spinGroupRef}>
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[PLANET_RADIUS, segments, segments]} />
            {maps ? (
              <meshPhysicalMaterial
                key={`${planetId}-mapped`}
                map={maps.colorMap}
                bumpMap={maps.bumpMap}
                bumpScale={planetId === 'moon' ? 0.085 : 0.065}
                displacementMap={planetId === 'moon' ? maps.bumpMap : undefined}
                displacementScale={planetId === 'moon' ? 0.034 : 0}
                displacementBias={planetId === 'moon' ? -0.017 : 0}
                roughnessMap={maps.roughnessMap}
                roughness={1.0}
                metalness={0.0}
                specularIntensity={planetId === 'moon' ? 0.04 : 0.07}
                envMapIntensity={0}
              />
            ) : (
              <meshStandardMaterial
                key={`${planetId}-base`}
                color={planetId === 'moon' ? '#8C8D8F' : '#B25838'}
                roughness={0.92}
                metalness={0.02}
              />
            )}
          </mesh>
        </group>

        {/* Subtle atmospheric limb scattering ONLY on Mars (Moon remains completely airless) */}
        {planetId === 'mars' && <MarsAtmosphereLimb sunDirection={sunDirection} />}
      </group>
    </group>
  );
};
