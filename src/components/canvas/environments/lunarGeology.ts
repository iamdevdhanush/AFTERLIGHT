import * as THREE from 'three';

export interface LunarPBRMaps {
  macroLrocMap: THREE.CanvasTexture;
  albedoMap: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  displacementMap: THREE.CanvasTexture;
}

export interface LunarRockInstance {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  variant: number;
}

export function createSeededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Smooth 2D value noise (deterministic, zero external allocations)
function hash2(ix: number, iz: number): number {
  const n = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

export function valueNoise2D(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);

  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);

  return (a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz) * 2 - 1;
}

export function fbm2D(x: number, z: number, octaves = 4): number {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += valueNoise2D(x * freq, z * freq) * amp;
    freq *= 2.07;
    amp *= 0.48;
  }
  return val;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

interface ImageSampler {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

function extractImagePixels(texture: THREE.Texture): ImageSampler | null {
  if (typeof document === 'undefined' || !texture.image) return null;
  const img = texture.image as HTMLImageElement | HTMLCanvasElement;
  const width = Math.min(1024, img.width || 512);
  const height = Math.min(512, img.height || 256);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, width, height);
  return {
    data: ctx.getImageData(0, 0, width, height).data,
    width,
    height,
  };
}

function sampleGrayBilinear(sampler: ImageSampler | null, u: number, v: number): number {
  if (!sampler) return 0.5;
  const wrappedU = ((u % 1) + 1) % 1;
  const clampedV = clamp01(v);
  const fx = wrappedU * (sampler.width - 1);
  const fy = clampedV * (sampler.height - 1);
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = (x0 + 1) % sampler.width;
  const y1 = Math.min(sampler.height - 1, y0 + 1);
  const tx = fx - x0;
  const ty = fy - y0;

  const getLuma = (x: number, y: number) => {
    const idx = (y * sampler.width + x) * 4;
    return sampler.data[idx] / 255;
  };

  const a = getLuma(x0, y0);
  const b = getLuma(x1, y0);
  const c = getLuma(x0, y1);
  const d = getLuma(x1, y1);
  return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
}

/**
 * Generates high-resolution macro LROC Mare Tranquillitatis map plus seamless
 * multi-scale regolith PBR maps (albedo, normal, roughness, displacement).
 */
export function buildLunarPBRMaps(
  lrocTexture: THREE.Texture,
  lolaTexture: THREE.Texture
): LunarPBRMaps {
  // 1. Macro Mare Tranquillitatis regional albedo crop from NASA LROC WAC mosaic
  const macroCanvas = document.createElement('canvas');
  macroCanvas.width = 512;
  macroCanvas.height = 512;
  const macroCtx = macroCanvas.getContext('2d');
  if (macroCtx && lrocTexture.image) {
    const img = lrocTexture.image as HTMLImageElement;
    const iw = img.naturalWidth || img.width || 2048;
    const ih = img.naturalHeight || img.height || 1024;
    // Crop Mare Tranquillitatis basalt & subtle ray ejecta region
    const sx = Math.floor(iw * 0.52);
    const sy = Math.floor(ih * 0.39);
    const sw = Math.floor(iw * 0.16);
    const sh = Math.floor(ih * 0.16);
    macroCtx.drawImage(img, sx, sy, sw, sh, 0, 0, 512, 512);
    // Soften contrast slightly so it modulates terrain albedos naturally without sharp dark spots
    const mImg = macroCtx.getImageData(0, 0, 512, 512);
    const md = mImg.data;
    for (let i = 0; i < md.length; i += 4) {
      const lum = (0.299 * md[i] + 0.587 * md[i + 1] + 0.114 * md[i + 2]) / 255;
      const norm = 0.78 + (lum - 0.46) * 0.42;
      // Preserve slight warm Mare Tranquillitatis basaltic taupe-grey character
      md[i] = Math.round(clamp01(norm * 1.01) * 255);
      md[i + 1] = Math.round(clamp01(norm * 0.995) * 255);
      md[i + 2] = Math.round(clamp01(norm * 0.965) * 255);
      md[i + 3] = 255;
    }
    macroCtx.putImageData(mImg, 0, 0);
  }
  const macroLrocMap = new THREE.CanvasTexture(macroCanvas);
  macroLrocMap.colorSpace = THREE.SRGBColorSpace;
  macroLrocMap.wrapS = THREE.MirroredRepeatWrapping;
  macroLrocMap.wrapT = THREE.MirroredRepeatWrapping;
  macroLrocMap.needsUpdate = true;

  // 2. High-detail seamless 1024x1024 lunar regolith maps derived with LOLA elevation detail
  const size = 512;
  const lolaSampler = extractImagePixels(lolaTexture);
  const rand = createSeededRng(19690720);

  const heightField = new Float32Array(size * size);

  // Seamless periodic harmonic noise + LOLA regional high-pass structure
  for (let y = 0; y < size; y++) {
    const ty = y / size;
    for (let x = 0; x < size; x++) {
      const tx = x / size;
      // Seamlessly wrapping regional LOLA relief
      const lu = 0.55 + Math.sin(tx * Math.PI * 2) * 0.015;
      const lv = 0.45 + Math.sin(ty * Math.PI * 2) * 0.015;
      const lolaDetail = (sampleGrayBilinear(lolaSampler, lu, lv) - 0.48) * 0.25;

      // Multi-scale periodic regolith clumping (zero tiling seams)
      const ax = tx * Math.PI * 2;
      const ay = ty * Math.PI * 2;
      const broadUndulation =
        Math.sin(ax * 2 + Math.cos(ay * 2)) * 0.08 +
        Math.cos(ay * 3 - Math.sin(ax * 3)) * 0.06;
      const mediumClumps =
        fbm2D(Math.cos(ax) * 3.8 + 10, Math.sin(ax) * 3.8 + Math.cos(ay) * 3.8, 3) * 0.24;
      const fineDust =
        fbm2D(Math.sin(ay) * 14 + 31, Math.cos(ay) * 14 + Math.sin(ax) * 14, 2) * 0.12 +
        (rand() - 0.5) * 0.09;

      heightField[y * size + x] = 0.5 + lolaDetail + broadUndulation + mediumClumps + fineDust;
    }
  }

  // Stamp 85 seamless wrap-around micro-impact craterlets and pebble pockmarks
  for (let c = 0; c < 85; c++) {
    const cx = rand() * size;
    const cy = rand() * size;
    const rad = c < 14 ? 14 + rand() * 16 : 3 + rand() * 9;
    const depth = (0.12 + rand() * 0.16) * (rad / 18);
    const rimH = depth * 0.28;
    const maxR = Math.ceil(rad * 1.45);
    const ellipX = 0.85 + rand() * 0.3;
    const ellipRot = rand() * Math.PI * 2;
    const cosR = Math.cos(ellipRot);
    const sinR = Math.sin(ellipRot);

    for (let dy = -maxR; dy <= maxR; dy++) {
      const py = ((Math.floor(cy) + dy) % size + size) % size;
      for (let dx = -maxR; dx <= maxR; dx++) {
        const px = ((Math.floor(cx) + dx) % size + size) % size;
        const rx = dx * cosR - dy * sinR;
        const ry = (dx * sinR + dy * cosR) * ellipX;
        const d = Math.sqrt(rx * rx + ry * ry);
        if (d < rad) {
          const t = d / rad;
          heightField[py * size + px] -= (1 - t * t) * depth;
        } else if (d < rad * 1.45) {
          const rt = (d - rad) / (rad * 0.45);
          heightField[py * size + px] += Math.sin(rt * Math.PI) * rimH;
        }
      }
    }
  }

  const albedoCanvas = document.createElement('canvas');
  const normalCanvas = document.createElement('canvas');
  const roughCanvas = document.createElement('canvas');
  const dispCanvas = document.createElement('canvas');
  albedoCanvas.width = normalCanvas.width = roughCanvas.width = dispCanvas.width = size;
  albedoCanvas.height = normalCanvas.height = roughCanvas.height = dispCanvas.height = size;

  const albedoCtx = albedoCanvas.getContext('2d')!;
  const normalCtx = normalCanvas.getContext('2d')!;
  const roughCtx = roughCanvas.getContext('2d')!;
  const dispCtx = dispCanvas.getContext('2d')!;

  const aData = albedoCtx.createImageData(size, size);
  const nData = normalCtx.createImageData(size, size);
  const rData = roughCtx.createImageData(size, size);
  const dData = dispCtx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    const ym = y === 0 ? size - 1 : y - 1;
    const yp = y === size - 1 ? 0 : y + 1;
    for (let x = 0; x < size; x++) {
      const xm = x === 0 ? size - 1 : x - 1;
      const xp = x === size - 1 ? 0 : x + 1;

      const h = heightField[y * size + x];
      const hL = heightField[y * size + xm];
      const hR = heightField[y * size + xp];
      const hU = heightField[ym * size + x];
      const hD = heightField[yp * size + x];

      const dx = (hR - hL) * 4.4;
      const dy = (hD - hU) * 4.4;
      const len = Math.sqrt(dx * dx + dy * dy + 1);
      const nx = -dx / len;
      const ny = -dy / len;
      const nz = 1 / len;

      const idx = (y * size + x) * 4;

      // Subtle mineral regolith albedo: warm charcoal-taupe dust + bright mineral flecks
      const shade = clamp01(0.45 + (h - 0.45) * 0.42);
      const grainTone = (hash2(x * 1.7, y * 2.3) - 0.5) * 0.05;
      const baseV = clamp01(shade + grainTone);
      aData.data[idx] = Math.round(baseV * 1.03 * 255);
      aData.data[idx + 1] = Math.round(baseV * 1.0 * 255);
      aData.data[idx + 2] = Math.round(baseV * 0.96 * 255);
      aData.data[idx + 3] = 255;

      // Normal map
      nData.data[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      nData.data[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      nData.data[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      nData.data[idx + 3] = 255;

      // Roughness map: pulverized porous dust is 0.91 - 0.99 (matte, non-plastic)
      const rough = clamp01(0.91 + (1.0 - shade) * 0.08);
      const rByte = Math.round(rough * 255);
      rData.data[idx] = rByte;
      rData.data[idx + 1] = rByte;
      rData.data[idx + 2] = rByte;
      rData.data[idx + 3] = 255;

      // Displacement map
      const dByte = Math.round(clamp01(h) * 255);
      dData.data[idx] = dByte;
      dData.data[idx + 1] = dByte;
      dData.data[idx + 2] = dByte;
      dData.data[idx + 3] = 255;
    }
  }

  albedoCtx.putImageData(aData, 0, 0);
  normalCtx.putImageData(nData, 0, 0);
  roughCtx.putImageData(rData, 0, 0);
  dispCtx.putImageData(dData, 0, 0);

  const configureDetailMap = (canvas: HTMLCanvasElement, srgb: boolean) => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return tex;
  };

  return {
    macroLrocMap,
    albedoMap: configureDetailMap(albedoCanvas, true),
    normalMap: configureDetailMap(normalCanvas, false),
    roughnessMap: configureDetailMap(roughCanvas, false),
    displacementMap: configureDetailMap(dispCanvas, false),
  };
}

interface CraterSpec {
  cx: number;
  cz: number;
  radius: number;
  depth: number;
  rim: number;
  phase: number;
}

// Curated Mare Tranquillitatis impact craters (varied diameters, depths, irregular rims)
// Strictly outside camera -> Apollo Eagle landing corridor so foreground & spacecraft stay clear
const LUNAR_CRATERS: CraterSpec[] = [
  // Crisp foreground craterlets catching 14° grazing sunlight without blocking Eagle struts
  { cx: 5.2, cz: 8.6, radius: 2.3, depth: 0.36, rim: 0.08, phase: 0.6 },
  { cx: -6.4, cz: 9.8, radius: 2.7, depth: 0.40, rim: 0.09, phase: 2.1 },
  { cx: -11.2, cz: 5.8, radius: 3.6, depth: 0.54, rim: 0.12, phase: 4.3 },
  { cx: 9.8, cz: 5.6, radius: 3.1, depth: 0.48, rim: 0.11, phase: 1.4 },

  // Visible midground craterlets flanking Tranquility Base
  { cx: 9.4, cz: -4.2, radius: 3.3, depth: 0.56, rim: 0.16, phase: 2.9 },
  { cx: -9.6, cz: -5.4, radius: 3.6, depth: 0.58, rim: 0.17, phase: 0.4 },
  { cx: 15.2, cz: -9.5, radius: 6.8, depth: 1.25, rim: 0.32, phase: 3.2 },
  { cx: -16.8, cz: -14.5, radius: 8.8, depth: 1.45, rim: 0.35, phase: 0.9 },
  { cx: 26.0, cz: -24.0, radius: 13.0, depth: 2.15, rim: 0.52, phase: 5.1 }, // Little West Crater
  { cx: -32.0, cz: -34.0, radius: 20.0, depth: 3.15, rim: 0.72, phase: 2.7 }, // West Crater

  // Broad distant background craters breaking up far lunar plains & ridges
  { cx: -58.0, cz: -72.0, radius: 28.0, depth: 4.2, rim: 1.25, phase: 1.8 },
  { cx: 48.0, cz: -82.0, radius: 32.0, depth: 4.6, rim: 1.4, phase: 4.0 },
  { cx: -8.0, cz: -95.0, radius: 24.0, depth: 3.5, rim: 1.05, phase: 0.3 },
];

export interface LunarTerrainBuild {
  geometry: THREE.BufferGeometry;
  sampleHeight: (x: number, z: number) => number;
  rocks: LunarRockInstance[];
}

export function buildLunarTerrainData(
  gridResolution: number,
  lolaTexture: THREE.Texture
): LunarTerrainBuild {
  const lolaSampler = extractImagePixels(lolaTexture);

  const sampleHeight = (x: number, z: number): number => {
    const distFromOrigin = Math.sqrt(x * x + z * z);

    // 1. Macro NASA LOLA elevation relief over Mare Tranquillitatis
    const lolaU = 0.56 + ((x + 155) / 310) * 0.085;
    const lolaV = 0.44 + ((z + 165) / 210) * 0.075;
    const lolaHeight = (sampleGrayBilinear(lolaSampler, lolaU, lolaV) - 0.47) * 2.2;

    // Subtle geological Mare ridge & micro-swells (no sine-wave hills)
    const geoSwell = fbm2D(x * 0.018 + 4.2, z * 0.018 - 1.7, 4) * 1.15;
    const microSwell = fbm2D(x * 0.11 - 9.1, z * 0.11 + 3.4, 3) * 0.16;

    let elevation = lolaHeight * 0.55 + geoSwell + microSwell;

    // 2. Sculpt asymmetric non-identical impact craters
    for (let i = 0; i < LUNAR_CRATERS.length; i++) {
      const c = LUNAR_CRATERS[i];
      const dx = x - c.cx;
      const dz = z - c.cz;
      const rawDist = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dz, dx);

      // Irregular geological rim warping so no crater looks circularly stamped
      const warp =
        1 +
        0.11 * Math.cos(2 * angle + c.phase) +
        0.07 * Math.sin(3 * angle - c.phase * 1.3) +
        0.04 * fbm2D(Math.cos(angle) * 2 + c.phase, Math.sin(angle) * 2, 2);
      const effectiveRadius = c.radius * warp;

      if (rawDist < effectiveRadius) {
        const t = rawDist / effectiveRadius;
        elevation -= (1 - t * t) * c.depth;
      } else if (rawDist < effectiveRadius * 1.48) {
        const rimT = (rawDist - effectiveRadius) / (effectiveRadius * 0.48);
        elevation += Math.sin(rimT * Math.PI) * c.rim;
      }
    }

    // 3. Foreground & Left-Text Composition Shaping:
    // Lower foreground gently toward camera so Eagle's 4 legs & footpads stay 100% visible
    const foregroundDrop = smoothstep(2.8, 16.0, z) * 0.42;
    const cameraCorridorMask =
      Math.exp(-Math.pow((x + 1.4) / 7.5, 2)) * smoothstep(2.0, 17.0, z);
    elevation -= foregroundDrop + cameraCorridorMask * 0.25;
    if (z > 2.8) {
      // Never let a foreground mound obstruct the spacecraft or left-side hero copy
      elevation = Math.min(elevation, 0.08 - smoothstep(2.8, 14.0, z) * 0.14);
    }

    // 4. Background Depth Layer (z < -26): sweeping mare plain rising gradually to far lunar hills
    if (z < -24) {
      const distT = smoothstep(-24, -158, z);
      const ridgeCrest = 1.0 - Math.abs(fbm2D(x * 0.022 + 7.4, z * 0.024 - 1.3, 3));
      const ridgeProfile =
        3.6 +
        fbm2D(x * 0.015 + 11.4, z * 0.012 + 2.1, 4) * 4.6 +
        ridgeCrest * 3.4 +
        Math.max(0, lolaHeight) * 2.6;
      // Keep horizon slightly lower behind Earth & ascent stage on right-mid sky
      const centerDip = 1.0 - 0.22 * Math.exp(-Math.pow((x - 10) / 42, 2));
      elevation += distT * distT * ridgeProfile * centerDip;
    }

    // 5. Tranquility Base Landing Apron ([0, 0, 0]): preserve level ground for Eagle & surface hardware
    if (distFromOrigin < 7.6) {
      const padBlend = smoothstep(3.9, 7.6, distFromOrigin);
      elevation = -0.008 * (1 - padBlend) + elevation * padBlend;
    }

    return elevation;
  };

  // Adaptive non-linear mesh: high vertex density near camera & Eagle, sweeping out to 310m x 210m horizon
  const segs = Math.max(96, gridResolution);
  const geo = new THREE.PlaneGeometry(1, 1, segs, segs);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const uvs = geo.attributes.uv;
  const vertexCount = pos.count;
  const colors = new Float32Array(vertexCount * 3);
  const macroUvs = new Float32Array(vertexCount * 2);

  // Authentic Mare Tranquillitatis basaltic & anorthositic ejecta palette
  const colorDeepBasalt = new THREE.Color('#3D3B37');
  const colorMidRegolith = new THREE.Color('#6A6760');
  const colorDustEjecta = new THREE.Color('#969288');
  const tmpColor = new THREE.Color();

  for (let i = 0; i < vertexCount; i++) {
    // PlaneGeometry(1,1) rotated -PI/2 has x in [-0.5, 0.5], z in [-0.5, 0.5]
    const nx = pos.getX(i) * 2; // [-1, 1]
    const nz = pos.getZ(i) * 2; // [-1, 1]

    const worldX =
      Math.sign(nx) * (Math.abs(nx) * 28.0 + Math.pow(Math.abs(nx), 2.35) * 127.0);
    const worldZ =
      nz >= 0
        ? 2.0 + nz * 14.0 + Math.pow(nz, 1.85) * 24.0
        : 2.0 - ((-nz) * 22.0 + Math.pow(-nz, 2.25) * 145.0);

    const worldY = sampleHeight(worldX, worldZ);

    pos.setXYZ(i, worldX, worldY, worldZ);

    // Uniform metric UVs prevent texture stretching on non-linear vertex spacing
    uvs.setXY(i, worldX * 0.24, worldZ * 0.24);
    macroUvs[i * 2] = clamp01((worldX + 155) / 310);
    macroUvs[i * 2 + 1] = clamp01((worldZ + 165) / 210);

    // Mineral shading variation: crater bowls slightly darker compacted soil, rims brighter powdery ejecta
    const regionalTint = fbm2D(worldX * 0.035 + 8.1, worldZ * 0.035 - 4.3, 2) * 0.14;
    const normElev = clamp01((worldY + 2.2) / 4.4 + regionalTint);
    if (normElev < 0.45) {
      tmpColor.copy(colorDeepBasalt).lerp(colorMidRegolith, normElev / 0.45);
    } else {
      tmpColor.copy(colorMidRegolith).lerp(colorDustEjecta, (normElev - 0.45) / 0.55);
    }

    // Subtly keep left foreground darker to maximize headline/CTA readability
    const leftTextDarken =
      1.0 - 0.24 * smoothstep(-2, -13, worldX) * smoothstep(-4, 15, worldZ);
    colors[i * 3] = tmpColor.r * leftTextDarken;
    colors[i * 3 + 1] = tmpColor.g * leftTextDarken;
    colors[i * 3 + 2] = tmpColor.b * leftTextDarken;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('aMacroUv', new THREE.BufferAttribute(macroUvs, 2));
  geo.computeVertexNormals();

  // Deterministic rock scattering strictly grounded onto sampleHeight(bx, bz)
  const rand = createSeededRng(19690721);
  const rocks: LunarRockInstance[] = [];
  const totalRocks = gridResolution >= 180 ? 84 : 52;

  for (let i = 0; i < totalRocks; i++) {
    let bx = 0;
    let bz = 0;
    let scaleBase = 0.18;

    if (i < 22) {
      // Foreground small pebbles & fist-sized angular regolith rocks (outside direct LM pad)
      const side = i % 2 === 0 ? 1 : -1;
      bx = side * (2.6 + rand() * 9.5) - (side < 0 ? 1.5 : 0);
      bz = 4.2 + rand() * 9.8;
      scaleBase = 0.06 + rand() * 0.13;
    } else if (i < 58) {
      // Midground angular breccias clustered around crater rims & landing plain
      const crater = LUNAR_CRATERS[(i - 22) % 7];
      const angle = rand() * Math.PI * 2;
      const dist = crater.radius * (1.02 + rand() * 0.55);
      bx = crater.cx + Math.cos(angle) * dist;
      bz = crater.cz + Math.sin(angle) * dist;
      scaleBase = 0.12 + rand() * 0.28;
    } else {
      // Distant crater-ejecta boulders
      const crater = LUNAR_CRATERS[4 + ((i - 58) % 4)];
      const angle = rand() * Math.PI * 2;
      const dist = crater.radius * (0.98 + rand() * 0.65);
      bx = crater.cx + Math.cos(angle) * dist;
      bz = crater.cz + Math.sin(angle) * dist;
      scaleBase = 0.35 + rand() * 0.55;
    }

    // Keep Tranquility Base landing pad & camera foreground corridor clean
    const distOrigin = Math.sqrt(bx * bx + bz * bz);
    if (distOrigin < 5.6) continue;
    if (bz > 2.5 && Math.abs(bx + 1.2) < 2.8) continue;

    const scaleX = scaleBase * (0.85 + rand() * 0.5);
    const scaleY = scaleBase * (0.48 + rand() * 0.36); // Realistic wider-than-tall breccia
    const scaleZ = scaleBase * (0.82 + rand() * 0.52);

    const groundY = sampleHeight(bx, bz);
    // Estimate local ground tilt so rocks nestle naturally into slopes
    const slopeX = (sampleHeight(bx + 0.4, bz) - sampleHeight(bx - 0.4, bz)) / 0.8;
    const slopeZ = (sampleHeight(bx, bz + 0.4) - sampleHeight(bx, bz - 0.4)) / 0.8;

    rocks.push({
      position: [bx, groundY - scaleY * 0.26, bz],
      rotation: [
        Math.atan(slopeZ) + (rand() - 0.5) * 0.28,
        rand() * Math.PI * 2,
        -Math.atan(slopeX) + (rand() - 0.5) * 0.28,
      ],
      scale: [scaleX, scaleY, scaleZ],
      variant: i % 5,
    });
  }

  return { geometry: geo, sampleHeight, rocks };
}

/**
 * Builds 5 distinct fractured lunar basalt breccia geometries with chipped facets
 * and flattened buried undersides (replaces simple unperturbed Platonic solids).
 */
export function buildFracturedBrecciaGeometries(): THREE.BufferGeometry[] {
  const variants: THREE.BufferGeometry[] = [];

  for (let v = 0; v < 5; v++) {
    const geo = new THREE.IcosahedronGeometry(1, 2);
    const pos = geo.attributes.position;
    const rand = createSeededRng(7700 + v * 131);

    // Define 4 cleavage fracture planes per rock variant
    const planes = Array.from({ length: 4 }, () => {
      const dir = new THREE.Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize();
      return { dir, offset: 0.45 + rand() * 0.35 };
    });

    const tmp = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      tmp.fromBufferAttribute(pos, i);
      const dir = tmp.clone().normalize();

      // Organic fracture lumpiness
      const n1 = fbm2D(dir.x * 2.2 + v * 7, dir.z * 2.2 + dir.y * 1.9, 3);
      let r = 0.84 + n1 * 0.26;

      // Slice subtly along natural rock cleavage planes
      for (const p of planes) {
        const proj = dir.dot(p.dir);
        if (proj > p.offset) {
          r -= (proj - p.offset) * 0.42;
        }
      }

      // Flatten base slightly so rock beds naturally in regolith
      if (dir.y < -0.25) {
        r *= 0.78;
      }

      pos.setXYZ(i, dir.x * r, dir.y * r, dir.z * r);
    }

    geo.computeVertexNormals();
    variants.push(geo);
  }

  return variants;
}
