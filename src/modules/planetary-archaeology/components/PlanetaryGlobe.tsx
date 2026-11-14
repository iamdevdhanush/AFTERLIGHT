import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { PlanetaryBody, ImageryLayerType } from '../types/planetary';
import { GLOBE_RADIUS, vector3ToLatLon } from '../services/planetaryMath';
import { PLANETARY_LAYERS, elevationSampler } from '../services/nasaTrekService';
import { buildDerivedPlanetMaps } from '../../../components/canvas/PlanetSphere';

interface PlanetMaterialMaps {
  colorMap: THREE.Texture;
  bumpMap: THREE.Texture;
  roughnessMap: THREE.Texture;
}

interface PlanetaryGlobeProps {
  planet: PlanetaryBody;
  activeLayerType: ImageryLayerType;
  terrainExaggeration: number; // e.g. 1.0 = normal, 2.0 = pronounced
  showGraticule: boolean;
  isAutoRotating: boolean;
  onPointerCoordinate?: (coords: { lat: number; lon: number; elevationMeters: number | null } | null) => void;
  spinGroupRef: React.RefObject<THREE.Group>;
}

// Mars atmospheric limb scattering shell
const MarsAtmosphericGlow: React.FC<{ sunDirection: THREE.Vector3 }> = ({ sunDirection }) => {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uSunDir: { value: sunDirection.clone().normalize() },
        uAtmosphereColor: { value: new THREE.Color('#D97746') },
        uHighSkyColor: { value: new THREE.Color('#98B8DA') },
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
        uniform vec3 uAtmosphereColor;
        uniform vec3 uHighSkyColor;
        varying vec3 vWorldNormal;
        varying vec3 vViewDir;

        void main() {
          float ndotv = clamp(dot(-vWorldNormal, vViewDir), 0.0, 1.0);
          float outerFade = smoothstep(0.0, 0.16, ndotv);
          float limbCurve = pow(clamp(1.0 - ndotv, 0.0, 1.0), 3.6);

          float sunFactor = smoothstep(-0.25, 0.5, dot(vWorldNormal, uSunDir));
          float terminatorGlow = smoothstep(0.3, -0.2, dot(vWorldNormal, uSunDir));
          vec3 finalColor = mix(uAtmosphereColor, uHighSkyColor, terminatorGlow * 0.3);

          float alpha = outerFade * limbCurve * sunFactor * 0.45;
          gl_FragColor = vec4(finalColor, alpha);
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
    <mesh material={material} renderOrder={3}>
      <sphereGeometry args={[GLOBE_RADIUS * 1.032, 64, 64]} />
    </mesh>
  );
};

// Procedural Coordinate Graticule (Equator, Prime Meridian, 30-degree parallels & meridians)
const PlanetaryGraticule: React.FC<{ radius: number }> = ({ radius }) => {
  const lineGeom = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const r = radius * 1.002;

    // Parallels (every 30 degrees latitude from -60 to +60)
    for (let lat = -60; lat <= 60; lat += 30) {
      const phi = (90 - lat) * (Math.PI / 180);
      const ringPoints: THREE.Vector3[] = [];
      const steps = 72;
      for (let i = 0; i <= steps; i++) {
        const theta = (i / steps) * Math.PI * 2;
        ringPoints.push(
          new THREE.Vector3(
            -r * Math.sin(phi) * Math.cos(theta),
            r * Math.cos(phi),
            r * Math.sin(phi) * Math.sin(theta)
          )
        );
      }
      for (let i = 0; i < ringPoints.length - 1; i++) {
        points.push(ringPoints[i], ringPoints[i + 1]);
      }
    }

    // Meridians (every 30 degrees longitude)
    for (let lon = -180; lon < 180; lon += 30) {
      const theta = (lon + 180) * (Math.PI / 180);
      const meridianPoints: THREE.Vector3[] = [];
      const steps = 36;
      for (let i = 0; i <= steps; i++) {
        const phi = (i / steps) * Math.PI;
        meridianPoints.push(
          new THREE.Vector3(
            -r * Math.sin(phi) * Math.cos(theta),
            r * Math.cos(phi),
            r * Math.sin(phi) * Math.sin(theta)
          )
        );
      }
      for (let i = 0; i < meridianPoints.length - 1; i++) {
        points.push(meridianPoints[i], meridianPoints[i + 1]);
      }
    }

    const geom = new THREE.BufferGeometry().setFromPoints(points);
    return geom;
  }, [radius]);

  useEffect(() => {
    return () => {
      lineGeom.dispose();
    };
  }, [lineGeom]);

  return (
    <lineSegments geometry={lineGeom}>
      <lineBasicMaterial color="#63F0C8" transparent opacity={0.16} depthWrite={false} />
    </lineSegments>
  );
};

export const PlanetaryGlobe: React.FC<PlanetaryGlobeProps> = ({
  planet,
  activeLayerType,
  terrainExaggeration,
  showGraticule,
  isAutoRotating,
  onPointerCoordinate,
  spinGroupRef,
}) => {
  const { gl, camera } = useThree();

  const [maps, setMaps] = useState<PlanetMaterialMaps | null>(null);

  const isDraggingRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const dragVelocityRef = useRef({ x: 0, y: 0 });
  const manualRotXRef = useRef(0);

  const activeSpec = PLANETARY_LAYERS[planet][activeLayerType];

  // Astronomical axial obliquity
  // Moon: 1.54° (0.0268 rad) to ecliptic
  // Mars: 25.19° (0.4396 rad) to orbital plane
  const axialTilt: [number, number, number] = useMemo(() => {
    return planet === 'moon' ? [-0.026, 0, -0.06] : [-0.18, 0, -0.42];
  }, [planet]);

  // Primary sun illumination vector
  const sunDirection = useMemo(() => {
    return planet === 'moon'
      ? new THREE.Vector3(8.5, 2.8, 5.5).normalize()
      : new THREE.Vector3(8.2, 3.0, 5.8).normalize();
  }, [planet]);

  // Set initial orientation so signature features (Tycho, Tranquillitatis on Moon; Valles Marineris on Mars) face camera
  useEffect(() => {
    if (spinGroupRef.current) {
      spinGroupRef.current.rotation.y = planet === 'moon' ? -1.45 : -0.95;
      spinGroupRef.current.rotation.x = 0.04;
      manualRotXRef.current = 0.04;
      dragVelocityRef.current = { x: 0, y: 0 };
    }
  }, [planet, spinGroupRef]);

  // Robust texture loader with derived PBR bump and roughness maps
  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    const createdTextures: THREE.Texture[] = [];

    // Preload DEM into elevation sampler for real-time altimetry
    elevationSampler.preloadDem(planet, activeSpec.localDemUrl || activeSpec.localTextureUrl);

    if (planet === 'moon') {
      let colorTex: THREE.Texture | null = null;
      let demTex: THREE.Texture | null = null;

      loader.load(
        activeSpec.localTextureUrl,
        (tex) => {
          if (cancelled) {
            tex.dispose();
            return;
          }
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 16;
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
        },
        undefined,
        (err) => {
          console.warn(`Could not load primary texture ${activeSpec.localTextureUrl}`, err);
        }
      );

      loader.load(
        activeSpec.localDemUrl || '/textures/moon/ldem_3_8bit.jpg',
        (dem) => {
          if (cancelled) {
            dem.dispose();
            return;
          }
          dem.colorSpace = THREE.NoColorSpace;
          dem.anisotropy = 8;
          dem.wrapS = THREE.RepeatWrapping;
          dem.wrapT = THREE.ClampToEdgeWrapping;
          demTex = dem;
          createdTextures.push(dem);

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
        },
        undefined,
        (err) => {
          console.warn(`Could not load DEM texture ${activeSpec.localDemUrl}`, err);
        }
      );
    } else {
      loader.load(
        activeSpec.localTextureUrl,
        (tex) => {
          if (cancelled) {
            tex.dispose();
            return;
          }
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 16;
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
        },
        undefined,
        (err) => {
          console.warn(`Could not load Mars texture ${activeSpec.localTextureUrl}`, err);
        }
      );
    }

    return () => {
      cancelled = true;
      setMaps(null);
      createdTextures.forEach((t) => t.dispose());
    };
  }, [planet, activeLayerType, activeSpec.localTextureUrl, activeSpec.localDemUrl]);

  // Pointer drag controls for smooth planetary rotation
  useEffect(() => {
    const dom = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      // Only drag with primary left mouse button or touch
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      isDraggingRef.current = true;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      dragVelocityRef.current = { x: 0, y: 0 };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };

      dragVelocityRef.current.y = dx * 0.005;
      dragVelocityRef.current.x = dy * 0.0035;

      if (spinGroupRef.current) {
        spinGroupRef.current.rotation.y += dragVelocityRef.current.y;
        manualRotXRef.current = Math.max(
          -0.85,
          Math.min(0.85, manualRotXRef.current + dragVelocityRef.current.x)
        );
        spinGroupRef.current.rotation.x = manualRotXRef.current;
      }
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [gl, spinGroupRef]);

  // Inertia and planetary auto-rotation frame loop
  useFrame((_, delta) => {
    const group = spinGroupRef.current;
    if (!group) return;

    const dt = Math.min(delta, 0.05);

    if (!isDraggingRef.current) {
      if (Math.abs(dragVelocityRef.current.y) > 0.0001 || Math.abs(dragVelocityRef.current.x) > 0.0001) {
        group.rotation.y += dragVelocityRef.current.y;
        manualRotXRef.current = Math.max(
          -0.85,
          Math.min(0.85, manualRotXRef.current + dragVelocityRef.current.x)
        );
        group.rotation.x = manualRotXRef.current;
        dragVelocityRef.current.x *= 0.92;
        dragVelocityRef.current.y *= 0.92;
      } else if (isAutoRotating) {
        const autoSpeed = planet === 'moon' ? 0.025 : 0.035;
        group.rotation.y += autoSpeed * dt;
      }
    }
  });

  // Raycast hover handler to compute surface latitude, longitude, and altimetry under cursor
  const handlePointerMove = (e: any) => {
    if (!onPointerCoordinate || !e.point || !spinGroupRef.current) return;
    e.stopPropagation();

    // Transform world hit point into planetary local coordinates
    const localPoint = spinGroupRef.current.worldToLocal(e.point.clone());
    const coords = vector3ToLatLon(localPoint);
    const elevation = elevationSampler.getSampledElevation(planet, coords.lat, coords.lon);

    onPointerCoordinate({
      lat: coords.lat,
      lon: coords.lon,
      elevationMeters: elevation,
    });
  };

  const handlePointerOut = () => {
    if (onPointerCoordinate) {
      onPointerCoordinate(null);
    }
  };

  // Displacement scale based on planet physical relief and user terrain exaggeration
  // Moon: relief span ~20 km (~1.1% of radius) -> base scale 0.035
  // Mars: relief span ~29 km (~0.85% of radius) -> base scale 0.045
  const displacementScale = useMemo(() => {
    const base = planet === 'moon' ? 0.032 : 0.042;
    return base * terrainExaggeration;
  }, [planet, terrainExaggeration]);

  const segments = 160; // 160x160 vertices for smoother silhouette

  return (
    <group rotation={axialTilt}>
      <group ref={spinGroupRef}>
        {/* Main Planetary Terrain Mesh */}
        <mesh
          castShadow
          receiveShadow
          onPointerMove={handlePointerMove}
          onPointerOut={handlePointerOut}
        >
          <sphereGeometry args={[GLOBE_RADIUS, segments, segments]} />
          {maps ? (
            <meshPhysicalMaterial
              key={`${planet}-${activeLayerType}-mapped`}
              map={maps.colorMap}
              bumpMap={maps.bumpMap}
              bumpScale={planet === 'moon' ? 0.085 * terrainExaggeration : 0.065 * terrainExaggeration}
              displacementMap={planet === 'moon' ? maps.bumpMap : undefined}
              displacementScale={planet === 'moon' ? 0.034 * terrainExaggeration : 0}
              displacementBias={planet === 'moon' ? -0.017 * terrainExaggeration : 0}
              roughnessMap={maps.roughnessMap}
              roughness={1.0}
              metalness={0.0}
              specularIntensity={planet === 'moon' ? 0.04 : 0.07}
              envMapIntensity={0}
            />
          ) : (
            <meshStandardMaterial
              key={`${planet}-base`}
              color={planet === 'moon' ? '#7A7C80' : '#A85233'}
              roughness={0.9}
            />
          )}
        </mesh>

        {/* Geospatial Coordinate Graticule Grid */}
        {showGraticule && <PlanetaryGraticule radius={GLOBE_RADIUS} />}
      </group>

      {/* Atmospheric Limb Scattering Glow for Mars */}
      {planet === 'mars' && <MarsAtmosphericGlow sunDirection={sunDirection} />}
    </group>
  );
};
