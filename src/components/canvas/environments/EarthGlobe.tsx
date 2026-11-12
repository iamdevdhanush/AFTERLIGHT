import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useExperienceStore } from '../../../store/useExperienceStore';

interface EarthGlobeProps {
  position: [number, number, number];
  radius?: number;
  sunDirection?: [number, number, number];
}

function createSolidTexture(r: number, g: number, b: number, srgb = false): THREE.DataTexture {
  const data = new Uint8Array([r, g, b, 255]);
  const tex = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

const EARTH_SURFACE_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  varying vec3 vViewPos;
  varying vec3 vViewNormal;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);

    vec4 mvPos = viewMatrix * worldPos;
    vViewPos = -mvPos.xyz;
    vViewNormal = normalize(normalMatrix * normal);

    gl_Position = projectionMatrix * mvPos;
  }
`;

const EARTH_SURFACE_FRAGMENT = /* glsl */ `
  uniform sampler2D uDayMap;
  uniform sampler2D uNormalMap;
  uniform sampler2D uSpecularMap;
  uniform vec3 uSunDir;

  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  varying vec3 vViewPos;
  varying vec3 vViewNormal;

  // Three.js determinant-normalized screen-space tangent frame (safe at poles & UV seams)
  vec3 perturbWorldNormal(vec3 eyePos, vec3 surfWorldNorm, vec2 uv, sampler2D normalMap, float bumpScale) {
    vec3 mapN = texture2D(normalMap, uv).xyz * 2.0 - 1.0;
    mapN.xy *= bumpScale;

    vec3 viewN = normalize(vViewNormal);
    vec3 q0 = dFdx(eyePos);
    vec3 q1 = dFdy(eyePos);
    vec2 st0 = dFdx(uv);
    vec2 st1 = dFdy(uv);

    vec3 q1perp = cross(q1, viewN);
    vec3 q0perp = cross(viewN, q0);
    vec3 T = q1perp * st0.x + q0perp * st1.x;
    vec3 B = q1perp * st0.y + q0perp * st1.y;

    float det = max(dot(T, T), dot(B, B));
    float scale = (det <= 1e-8) ? 0.0 : inversesqrt(det);
    vec3 perturbedViewN = normalize(T * (mapN.x * scale) + B * (mapN.y * scale) + viewN * mapN.z);

    vec3 deltaView = perturbedViewN - viewN;
    vec3 deltaWorld = (vec4(deltaView, 0.0) * viewMatrix).xyz;
    return normalize(surfWorldNorm + deltaWorld);
  }

  void main() {
    vec3 albedo = texture2D(uDayMap, vUv).rgb;
    float oceanMask = texture2D(uSpecularMap, vUv).r;

    vec3 surfNormal = normalize(vWorldNormal);
    vec3 topoNormal = perturbWorldNormal(-vViewPos, surfNormal, vUv, uNormalMap, 0.65);

    // Continents keep crisp relief near the terminator; oceans stay calm and smooth
    vec3 shadedNormal = normalize(mix(topoNormal, surfNormal, oceanMask * 0.78));

    float rawNdotL = dot(surfNormal, uSunDir);
    float reliefNdotL = dot(shadedNormal, uSunDir);

    // Enrich deep-navy Blue Marble oceans with realistic orbital Rayleigh water scatter
    vec3 sunlitAlbedo = mix(albedo, max(albedo, vec3(0.035, 0.155, 0.39)), oceanMask * 0.58);

    // Physically grounded cosine falloff for clear 3D spherical curvature & night-side shadow
    float cosSolar = smoothstep(-0.04, 0.08, rawNdotL) * max(reliefNdotL, 0.0);
    float limbWrap = smoothstep(-0.045, 0.12, rawNdotL) * 0.04;
    float sunDiffuse = pow(cosSolar, 0.88) + limbWrap;

    // Very faint cool-blue earthshine on the night hemisphere (preserves dramatic shadow side)
    vec3 nightBase = sunlitAlbedo * vec3(0.010, 0.016, 0.032);

    // Subtle cool atmospheric terminator scatter (avoids harsh razor cut or orange band)
    float terminatorBand = exp(-pow((rawNdotL - 0.02) * 11.0, 2.0));
    vec3 terminatorScatter = vec3(0.07, 0.20, 0.42) * terminatorBand * 0.16;

    // Restrained Blinn-Phong solar specular glint strictly on Earth's oceans
    vec3 viewDirWorld = normalize(cameraPosition - vWorldPos);
    vec3 halfVec = normalize(uSunDir + viewDirWorld);
    float specAngle = max(dot(shadedNormal, halfVec), 0.0);
    float oceanSpec = pow(specAngle, 52.0) * oceanMask * smoothstep(0.0, 0.15, rawNdotL) * 0.26;

    // Combine daylight continents & oceans + atmospheric scatter + ocean glint
    vec3 dayColor = sunlitAlbedo * (sunDiffuse * 1.48) + vec3(0.82, 0.90, 1.0) * oceanSpec;
    vec3 color = max(nightBase, dayColor) + terminatorScatter;

    // Delicate atmospheric Rayleigh blue veil toward Earth's sunlit limb
    vec3 viewDirView = normalize(vViewPos);
    float rim = 1.0 - clamp(dot(normalize(vViewNormal), viewDirView), 0.0, 1.0);
    float fresnelScatter = pow(rim, 3.4) * smoothstep(-0.08, 0.45, rawNdotL);
    color = mix(color, vec3(0.24, 0.56, 0.94), fresnelScatter * 0.44);

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const EARTH_CLOUDS_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldNormal;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const EARTH_CLOUDS_FRAGMENT = /* glsl */ `
  uniform sampler2D uCloudMap;
  uniform vec3 uSunDir;

  varying vec2 vUv;
  varying vec3 vWorldNormal;

  void main() {
    float cloudDensity = texture2D(uCloudMap, vUv).r;
    float alphaMask = pow(smoothstep(0.08, 0.92, cloudDensity), 1.2) * 0.68;
    if (alphaMask < 0.01) discard;

    float ndotl = dot(normalize(vWorldNormal), uSunDir);
    float lit = smoothstep(-0.04, 0.16, ndotl);
    float shade = clamp(ndotl, 0.0, 1.0);

    // Wispy off-white sunlit clouds fading seamlessly into the night shadow
    vec3 dayCloud = vec3(0.76, 0.82, 0.90) * (0.15 + 0.85 * pow(shade, 0.85));
    vec3 nightCloud = vec3(0.01, 0.015, 0.028);
    vec3 cloudColor = mix(nightCloud, dayCloud, lit);

    gl_FragColor = vec4(cloudColor, alphaMask * mix(0.18, 1.0, lit));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const EARTH_ATMO_VERTEX = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vViewDir;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const EARTH_ATMO_FRAGMENT = /* glsl */ `
  uniform vec3 uSunDir;

  varying vec3 vWorldNormal;
  varying vec3 vViewDir;

  void main() {
    // BackSide shell normal points outward: ndotv = 0 at outer edge, ~0.27 at planet limb
    float ndotv = clamp(dot(-normalize(vWorldNormal), normalize(vViewDir)), 0.0, 1.0);
    float outerFade = smoothstep(0.0, 0.20, ndotv);
    float limbFalloff = pow(clamp(1.0 - ndotv, 0.0, 1.0), 4.4);

    // Restrict atmospheric scattering softly to sunlit hemisphere & terminator
    float sunFactor = smoothstep(-0.10, 0.50, dot(normalize(vWorldNormal), uSunDir));
    vec3 rayleighColor = vec3(0.30, 0.62, 0.96);

    float alpha = outerFade * limbFalloff * sunFactor * 0.40;
    gl_FragColor = vec4(rayleighColor, alpha);
  }
`;

/**
 * Photorealistic animated 3D Earth suspended above the lunar horizon,
 * driven by NASA Blue Marble textures, animated cloud drift, natural
 * day/night solar shading, and subtle Rayleigh limb scattering.
 */
export const EarthGlobe: React.FC<EarthGlobeProps> = ({
  position,
  radius = 4.8,
  sunDirection = [-42, 14, 38],
}) => {
  const surfaceRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);

  const { gl } = useThree();
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);

  const normalizedSun = useMemo(
    () => new THREE.Vector3(...sunDirection).normalize(),
    [sunDirection]
  );

  // Instant 1x1 fallback textures prevent suspense stalls while local assets decode
  const placeholders = useMemo(
    () => ({
      day: createSolidTexture(16, 46, 86, true),
      normal: createSolidTexture(128, 128, 255, false),
      specular: createSolidTexture(180, 180, 180, false),
      clouds: createSolidTexture(0, 0, 0, false),
    }),
    []
  );

  const surfaceMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uDayMap: { value: placeholders.day },
          uNormalMap: { value: placeholders.normal },
          uSpecularMap: { value: placeholders.specular },
          uSunDir: { value: normalizedSun },
        },
        vertexShader: EARTH_SURFACE_VERTEX,
        fragmentShader: EARTH_SURFACE_FRAGMENT,
      }),
    [placeholders, normalizedSun]
  );

  const cloudMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uCloudMap: { value: placeholders.clouds },
          uSunDir: { value: normalizedSun },
        },
        vertexShader: EARTH_CLOUDS_VERTEX,
        fragmentShader: EARTH_CLOUDS_FRAGMENT,
        transparent: true,
        depthWrite: false,
      }),
    [placeholders, normalizedSun]
  );

  const atmosphereMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uSunDir: { value: normalizedSun },
        },
        vertexShader: EARTH_ATMO_VERTEX,
        fragmentShader: EARTH_ATMO_FRAGMENT,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [normalizedSun]
  );

  useEffect(() => {
    let active = true;
    const loader = new THREE.TextureLoader();
    const loaded: THREE.Texture[] = [];
    const maxAnisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());

    const loadTex = (url: string, srgb: boolean, onLoad: (tex: THREE.Texture) => void) => {
      loader.load(url, (tex) => {
        if (!active) {
          tex.dispose();
          return;
        }
        tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        tex.anisotropy = maxAnisotropy;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.needsUpdate = true;
        loaded.push(tex);
        onLoad(tex);
      });
    };

    loadTex('/textures/earth/earth_atmos_2048.jpg', true, (tex) => {
      surfaceMaterial.uniforms.uDayMap.value = tex;
    });
    loadTex('/textures/earth/earth_normal_2048.jpg', false, (tex) => {
      surfaceMaterial.uniforms.uNormalMap.value = tex;
    });
    loadTex('/textures/earth/earth_specular_2048.jpg', false, (tex) => {
      surfaceMaterial.uniforms.uSpecularMap.value = tex;
    });
    loadTex('/textures/earth/earth_clouds_1024.png', false, (tex) => {
      cloudMaterial.uniforms.uCloudMap.value = tex;
    });

    return () => {
      active = false;
      loaded.forEach((t) => t.dispose());
    };
  }, [gl, surfaceMaterial, cloudMaterial]);

  useEffect(() => {
    return () => {
      placeholders.day.dispose();
      placeholders.normal.dispose();
      placeholders.specular.dispose();
      placeholders.clouds.dispose();
      surfaceMaterial.dispose();
      cloudMaterial.dispose();
      atmosphereMaterial.dispose();
    };
  }, [placeholders, surfaceMaterial, cloudMaterial, atmosphereMaterial]);

  useFrame((_, delta) => {
    if (reducedMotion) return;
    const clampedDelta = Math.min(delta, 0.05);
    // Slow, dignified prograde axial spin; clouds drift gently ahead of surface
    if (surfaceRef.current) {
      surfaceRef.current.rotation.y += clampedDelta * 0.012;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += clampedDelta * 0.017;
    }
  });

  return (
    <group position={position}>
      {/* Natural ~23.4° axial obliquity */}
      <group rotation={[0.16, 0, -0.36]}>
        {/* NASA Blue Marble Surface: oceans, continents & mountain relief */}
        <mesh ref={surfaceRef} rotation={[0, -1.25, 0]} material={surfaceMaterial}>
          <sphereGeometry args={[radius, 64, 64]} />
        </mesh>

        {/* Animated Tropospheric Cloud Layer */}
        <mesh ref={cloudsRef} rotation={[0, -0.85, 0]} scale={1.008} material={cloudMaterial}>
          <sphereGeometry args={[radius, 56, 56]} />
        </mesh>
      </group>

      {/* Subtle Rayleigh Atmospheric Blue Limb Glow */}
      <mesh scale={1.04} material={atmosphereMaterial}>
        <sphereGeometry args={[radius, 48, 48]} />
      </mesh>
    </group>
  );
};
