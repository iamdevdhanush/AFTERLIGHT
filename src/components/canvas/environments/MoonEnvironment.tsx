import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { ApolloEagleModel } from '../artifacts/ApolloEagleModel';
import { EarthGlobe } from './EarthGlobe';
import { useExperienceStore } from '../../../store/useExperienceStore';
import {
  buildFracturedBrecciaGeometries,
  buildLunarPBRMaps,
  buildLunarTerrainData,
  createSeededRng,
  LunarRockInstance,
} from './lunarGeology';

/**
 * Sparse, restrained distant vacuum stars strictly above the horizon
 * with zero atmospheric haze, color nebulae, or artificial glow.
 */
const LunarSkyStars: React.FC = () => {
  const starGeo = useMemo(() => {
    const count = 420;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const rand = createSeededRng(19690716);

    for (let i = 0; i < count; i++) {
      const u = rand();
      // Keep stars cleanly in upper celestial dome above lunar horizon
      const theta = u * Math.PI * 2;
      const phi = Math.acos(0.08 + rand() * 0.92);
      const r = 210 + rand() * 55;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const b = 0.25 + Math.pow(rand(), 2.8) * 0.65;
      const warmth = (rand() - 0.5) * 0.08;
      colors[i * 3] = b * (1 + warmth);
      colors[i * 3 + 1] = b;
      colors[i * 3 + 2] = b * (1 - warmth);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  useEffect(() => {
    return () => {
      starGeo.dispose();
    };
  }, [starGeo]);

  return (
    <points geometry={starGeo}>
      <pointsMaterial
        size={0.42}
        vertexColors
        transparent
        opacity={0.44}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};

/**
 * Renders an instanced group of fractured basalt breccia rocks anchored into the terrain.
 */
const InstancedRockVariant: React.FC<{
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  instances: LunarRockInstance[];
}> = ({ geometry, material, instances }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || instances.length === 0) return;

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const rand = createSeededRng(4201 + instances.length * 17);

    instances.forEach((inst, idx) => {
      dummy.position.set(...inst.position);
      dummy.rotation.set(...inst.rotation);
      dummy.scale.set(...inst.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(idx, dummy.matrix);

      // Subtle authentic basalt mineral darkening/dust variation per rock
      const shade = 0.78 + rand() * 0.34;
      color.setRGB(shade * 1.02, shade * 1.0, shade * 0.97);
      mesh.setColorAt(idx, color);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [instances]);

  if (instances.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, instances.length]}
      castShadow
      receiveShadow
    />
  );
};

export const MoonEnvironment: React.FC = () => {
  const graphicsQuality = useExperienceStore((s) => s.graphicsQuality);
  const resolution = graphicsQuality === 'high' ? 200 : graphicsQuality === 'medium' ? 150 : 104;

  // Load real NASA LROC color mosaic & LOLA lunar elevation dataset
  const [lrocTexture, lolaTexture] = useTexture([
    '/textures/moon/lroc_color_2k.jpg',
    '/textures/moon/ldem_3_8bit.jpg',
  ]);

  const pbrMaps = useMemo(
    () => buildLunarPBRMaps(lrocTexture, lolaTexture),
    [lrocTexture, lolaTexture]
  );

  const terrainData = useMemo(
    () => buildLunarTerrainData(resolution, lolaTexture),
    [resolution, lolaTexture]
  );

  const rockGeometries = useMemo(() => buildFracturedBrecciaGeometries(), []);

  // Multi-scale non-repeating PBR terrain material fusing LROC geology + regolith microdetail
  const terrainMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      map: pbrMaps.albedoMap,
      normalMap: pbrMaps.normalMap,
      normalScale: new THREE.Vector2(1.15, 1.15),
      roughnessMap: pbrMaps.roughnessMap,
      roughness: 1.0,
      metalness: 0.02,
      displacementMap: pbrMaps.displacementMap,
      displacementScale: 0.03,
      displacementBias: -0.028,
      envMapIntensity: 0.25,
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uMacroLrocMap = { value: pbrMaps.macroLrocMap };

      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
          attribute vec2 aMacroUv;
          varying vec2 vMacroUv;
          varying vec3 vTerrainWorldPos;`
        )
        .replace(
          '#include <project_vertex>',
          `vMacroUv = aMacroUv;
          vTerrainWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
          #include <project_vertex>`
        );

      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
          uniform sampler2D uMacroLrocMap;
          varying vec2 vMacroUv;
          varying vec3 vTerrainWorldPos;`
        )
        .replace(
          '#include <map_fragment>',
          `#include <map_fragment>
          #ifdef USE_MAP
            vec2 rotUv = vec2(
              vTerrainWorldPos.x * 0.874 - vTerrainWorldPos.z * 0.485,
              vTerrainWorldPos.x * 0.485 + vTerrainWorldPos.z * 0.874
            ) * 0.088 + vec2(0.37, 0.61);
            vec3 microDetail2 = texture2D(map, rotUv).rgb;
            float detailLod = 1.0 - smoothstep(16.0, 80.0, length(vViewPosition));
            vec3 blendedDetail = mix(diffuseColor.rgb, (diffuseColor.rgb + microDetail2) * 0.5, 0.56);
            diffuseColor.rgb = mix(vec3(0.56, 0.545, 0.52), blendedDetail, 0.42 + 0.58 * detailLod) * 2.15;

            // Regional NASA LROC Mare Tranquillitatis geological variation
            vec3 macroTint = texture2D(uMacroLrocMap, vMacroUv).rgb;
            diffuseColor.rgb *= macroTint * 1.24;
          #endif`
        )
        .replace(
          '#include <normal_fragment_maps>',
          `#ifdef USE_NORMALMAP_TANGENTSPACE
            vec3 mapN1 = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
            vec2 nRotUv = vec2(
              vTerrainWorldPos.x * 0.874 - vTerrainWorldPos.z * 0.485,
              vTerrainWorldPos.x * 0.485 + vTerrainWorldPos.z * 0.874
            ) * 0.088 + vec2(0.37, 0.61);
            vec3 mapN2 = texture2D( normalMap, nRotUv ).xyz * 2.0 - 1.0;
            mapN2.xy = vec2(
              mapN2.x * 0.874 + mapN2.y * 0.485,
              -mapN2.x * 0.485 + mapN2.y * 0.874
            );
            float nLod = 1.0 - smoothstep(15.0, 82.0, length(vViewPosition));
            vec3 mapN = mix(vec3(0.0, 0.0, 1.0), normalize(vec3(mapN1.xy + mapN2.xy * 0.72, mapN1.z)), nLod);
            mapN.xy *= normalScale;
            normal = normalize( tbn * mapN );
          #else
            #include <normal_fragment_maps>
          #endif`
        );
    };

    mat.customProgramCacheKey = () => 'afterlight-lunar-regolith-v1';
    return mat;
  }, [pbrMaps]);

  const rockMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#5A5854',
      map: pbrMaps.albedoMap,
      normalMap: pbrMaps.normalMap,
      normalScale: new THREE.Vector2(0.75, 0.75),
      roughness: 0.93,
      metalness: 0.05,
      envMapIntensity: 0.22,
    });
  }, [pbrMaps]);

  // Group rocks by fractured geometry variant for minimal draw calls
  const groupedRocks = useMemo(() => {
    const groups: LunarRockInstance[][] = [[], [], [], [], []];
    terrainData.rocks.forEach((r) => {
      groups[r.variant % 5].push(r);
    });
    return groups;
  }, [terrainData.rocks]);

  useEffect(() => {
    return () => {
      terrainData.geometry.dispose();
      terrainMaterial.dispose();
      rockMaterial.dispose();
      rockGeometries.forEach((g) => g.dispose());
      pbrMaps.macroLrocMap.dispose();
      pbrMaps.albedoMap.dispose();
      pbrMaps.normalMap.dispose();
      pbrMaps.roughnessMap.dispose();
      pbrMaps.displacementMap.dispose();
    };
  }, [terrainData, terrainMaterial, rockMaterial, rockGeometries, pbrMaps]);

  return (
    <group>
      {/* 1. PHYSICALLY PLAUSIBLE APOLLO SOLAR & LUNAR-SURFACE LIGHTING */}
      {/* Low-angle morning solar radiation (~14° elevation) casting crisp long vacuum shadows */}
      <directionalLight
        position={[-42, 14, 38]}
        intensity={4.1}
        color="#FFFDF7"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={2}
        shadow-camera-far={120}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-bias={-0.00025}
        shadow-normalBias={0.024}
      />

      {/* Subtle upward light bounced off sunlit regolith into shadowed struts & craters */}
      <hemisphereLight args={['#0B0E14', '#5A564F', 0.28]} />

      {/* Subtle cool Earthshine fill from Earth suspended above horizon */}
      <directionalLight position={[22, 16, -38]} intensity={0.22} color="#6E94BD" />

      {/* 2. DEEP BLACK VACUUM SKY WITH SPARSE RESTRAINED STARS (NO ATMOSPHERIC HAZE) */}
      <LunarSkyStars />

      {/* 3. ANIMATED 3D EARTH SUSPENDED ABOVE THE LUNAR HORIZON (PRESERVED EXACTLY) */}
      <EarthGlobe position={[22, 16, -38]} radius={4.8} sunDirection={[-42, 14, 38]} />

      {/* 4. GEOLOGICAL NASA LROC/LOLA LUNAR TERRAIN WITH MULTI-SCALE REGOLITH */}
      <mesh geometry={terrainData.geometry} material={terrainMaterial} receiveShadow />

      {/* 5. GROUNDED FRACTURED LUNAR BASALT BRECCIA ROCKS (INSTANCED) */}
      {rockGeometries.map((geo, idx) => (
        <InstancedRockVariant
          key={idx}
          geometry={geo}
          material={rockMaterial}
          instances={groupedRocks[idx]}
        />
      ))}

      {/* 6. ARTIFACT: OFFICIAL NASA APOLLO 11 LUNAR MODULE (EAGLE) */}
      <ApolloEagleModel position={[0, 0, 0]} rotation={[0, 0.45, 0]} scale={1.25} />
    </group>
  );
};
