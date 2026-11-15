/**
 * AFTERLIGHT 3D HARDWARE INSPECTION STUDIO — AEROSPACE MUSEUM EDITION v2
 * =======================================================================
 * Ultra-Realistic PBR Rendering with Three.js & React Three Fiber
 *
 * Supported Spacecraft & Planetary Hardware:
 *  1. MOON: Apollo 11 Lunar Module "Eagle" (LM-5) — Official NASA 3D Mesh
 *  2. MARS: Mars 2020 Perseverance Rover — Official NASA JPL CAD (4.98 MB)
 *
 * Key Technical Capabilities:
 *  - Part-ID-driven procedural PBR material palette (NASA-accurate color matching)
 *  - Per-mesh realistic metalness / roughness / color based on hardware material type
 *  - three-mesh-bvh BVH raycasting for pixel-perfect part picking
 *  - 7-light aerospace studio rig with ACESFilmic tone mapping
 *  - SpotLight key light + RectAreaLight fill for studio-quality reflections
 *  - Correct material single/array unwrapping (ensures 100% visible polygons)
 *  - Soft contact shadows via Drei <ContactShadows> on circular museum pedestal
 *  - Data-driven JSON manifests (/public/data/parts.*.json) with verified NASA specs
 *  - GSAP camera cinematic fly-to on part selection
 *  - Smooth per-part exploded view lerp
 *  - Pulsing numbered 3D hotspot callouts anchored to actual hardware coordinates
 */

import React, {
  useState,
  useRef,
  useMemo,
  useEffect,
  Suspense,
  useCallback,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import gsap from 'gsap';
import {
  X,
  RotateCw,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Info,
  Cpu,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { LanguageSwitcher } from '../../../components/ui/LanguageSwitcher';

// Extend THREE prototypes for BVH accelerated raycasting
(THREE.BufferGeometry.prototype as any).computeBoundsTree = computeBoundsTree;
(THREE.BufferGeometry.prototype as any).disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HardwareInspectionProps {
  initialArtifactId?: string;
  onClose: () => void;
}

interface RegionBounds {
  xMin: number; xMax: number;
  yMin: number; yMax: number;
  zMin: number; zMax: number;
}

interface PartEntry {
  id: string;
  meshNames: string[];
  regionBounds?: RegionBounds;
  label: string;
  subassembly: string;
  hotspotAnchor: [number, number, number];
  explodeVector: [number, number, number];
  cameraTarget: { position: [number, number, number]; lookAt: [number, number, number] };
  specs: Record<string, string>;
  function: string;
  missionFacts: string[];
  source: string;
  isAuthentic: boolean;
}

interface InspectionModelConfig {
  id: string;
  name: string;
  subtitle: string;
  planet: 'moon' | 'mars';
  modelPath: string;
  modelScale: number;
  modelPosition: [number, number, number];
  isAuthenticNasaModel: boolean;
  modelTypeLabel: string;
  modelSourceCitation: string;
  disclaimer?: string;
  manifestPath: string;
  initialCamera: [number, number, number];
  overviewSpecs: { label: string; value: string }[];
}

// ── Model Configurations ──────────────────────────────────────────────────────

// NASA-accurate procedural PBR material palette
// Each entry maps a part-id substring or material type to realistic metalness/roughness/color
interface PBRPreset {
  color: string;
  metalness: number;
  roughness: number;
  emissiveColor?: string;
  emissiveIntensity?: number;
}

const NASA_MATERIAL_PALETTE: Record<string, PBRPreset> = {
  // Apollo Lunar Module materials
  'lm-ascent-stage':      { color: '#c8b97a', metalness: 0.55, roughness: 0.42 }, // gold kapton
  'lm-descent-stage':     { color: '#d4a847', metalness: 0.72, roughness: 0.28 }, // thermal foil
  'lm-landing-legs':      { color: '#a8a090', metalness: 0.82, roughness: 0.35 }, // aluminum alloy
  'lm-descent-engine':    { color: '#888070', metalness: 0.88, roughness: 0.22 }, // ablative nozzle
  'lm-ascent-engine':     { color: '#7a7060', metalness: 0.90, roughness: 0.20 }, // titanium engine bell
  'lm-sband-antenna':     { color: '#d0ccc0', metalness: 0.92, roughness: 0.12 }, // parabolic dish metal
  'lm-rcs':               { color: '#a0a8b0', metalness: 0.85, roughness: 0.30 }, // RCS thruster alloy
  'lm-forward-hatch':     { color: '#c8c0a0', metalness: 0.60, roughness: 0.45 }, // aluminum hatch
  'lm-contact-probes':    { color: '#c0b040', metalness: 0.95, roughness: 0.15 }, // brass/gold probes
  // Perseverance Rover materials
  'perv-mast':            { color: '#c0bdb8', metalness: 0.70, roughness: 0.35 }, // aluminum mast
  'perv-body':            { color: '#b0aca8', metalness: 0.65, roughness: 0.42 }, // WEB chassis
  'perv-solar':           { color: '#1a1f3a', metalness: 0.85, roughness: 0.12 }, // solar cell panel (dark blue)
  'perv-wheel':           { color: '#888480', metalness: 0.88, roughness: 0.30 }, // titanium wheel
  'perv-arm':             { color: '#a8a4a0', metalness: 0.80, roughness: 0.28 }, // robotic arm
  'perv-antenna':         { color: '#d8d4d0', metalness: 0.92, roughness: 0.10 }, // antenna dish
  'perv-camera':          { color: '#202428', metalness: 0.60, roughness: 0.50 }, // camera housing
  'perv-mmrtg':           { color: '#787060', metalness: 0.75, roughness: 0.38 }, // RTG housing
  'perv-suspension':      { color: '#909090', metalness: 0.86, roughness: 0.32 }, // rocker-bogie titanium
  // Generic fallbacks
  'foil':                 { color: '#d4a847', metalness: 0.88, roughness: 0.20 },
  'metal':                { color: '#a8a4a0', metalness: 0.82, roughness: 0.30 },
  'solar':                { color: '#1a2040', metalness: 0.90, roughness: 0.10 },
  'lens':                 { color: '#202428', metalness: 0.95, roughness: 0.05 },
};

function getPBRPreset(partId: string | null, matName: string): PBRPreset {
  if (partId) {
    // Exact part ID lookup
    if (NASA_MATERIAL_PALETTE[partId]) return NASA_MATERIAL_PALETTE[partId];
    // Substring match on part ID
    for (const [key, preset] of Object.entries(NASA_MATERIAL_PALETTE)) {
      if (partId.includes(key) || key.includes(partId.split('-').slice(0, 2).join('-'))) {
        return preset;
      }
    }
  }
  // Fallback: material name heuristics
  const n = matName.toLowerCase();
  if (n.includes('solar') || n.includes('panel')) return NASA_MATERIAL_PALETTE['solar'];
  if (n.includes('lens') || n.includes('glass') || n.includes('camera')) return NASA_MATERIAL_PALETTE['lens'];
  if (n.includes('gold') || n.includes('foil') || n.includes('kapton') || n.includes('thermal')) return NASA_MATERIAL_PALETTE['foil'];
  // Default spacecraft aluminum
  return { color: '#a8a4a0', metalness: 0.72, roughness: 0.38 };
}

const HARDWARE_CONFIGS: Record<string, InspectionModelConfig> = {
  apollo11_eagle: {
    id: 'apollo11_eagle',
    name: 'Apollo 11 Lunar Module "Eagle"',
    subtitle: 'LM-5 Descent & Ascent Hardware Stack',
    planet: 'moon',
    modelPath: '/models/apollo_lunar_module.glb',
    modelScale: 1.0,
    modelPosition: [0, -2.5, 0],
    isAuthenticNasaModel: true,
    modelTypeLabel: 'AUTHENTIC NASA 3D MODEL',
    modelSourceCitation: 'NASA 3D Resources / Apollo Lunar Module LM-5 (Official NASA Mesh)',
    manifestPath: '/data/parts.moon.json',
    initialCamera: [0, 0.8, 5.6],
    overviewSpecs: [
      { label: 'Total Launch Mass', value: '15,103 kg (33,297 lb)' },
      { label: 'Descent Stage Mass', value: '10,334 kg (fueled)' },
      { label: 'Ascent Stage Mass', value: '4,769 kg (fueled)' },
      { label: 'Landing Gear Span', value: '9.45 m diagonal across pads' },
      { label: 'Descent Engine Thrust', value: '1,050–10,125 lbf throttleable' },
      { label: 'Ascent Engine Thrust', value: '3,500 lbf constant hypergolic' },
      { label: 'Habitable Volume', value: '6.7 m³ stand-up cockpit' },
      { label: 'Current Lunar Status', value: 'Descent Stage at Tranquility Base' },
    ],
  },
  perseverance: {
    id: 'perseverance',
    name: 'Mars 2020 Perseverance Rover',
    subtitle: 'Jezero Crater Astrobiology & Sample Caching Rover',
    planet: 'mars',
    modelPath: '/models/perseverance_rover.glb',
    modelScale: 1.3,
    modelPosition: [0, -0.85, 0],
    isAuthenticNasaModel: true,
    modelTypeLabel: 'AUTHENTIC NASA 3D MODEL',
    modelSourceCitation: 'NASA Jet Propulsion Laboratory / Mars 2020 Mission (Official NASA CAD Mesh)',
    manifestPath: '/data/parts.perseverance.json',
    initialCamera: [0, 0.9, 4.8],
    overviewSpecs: [
      { label: 'Total Rover Mass', value: '1,025 kg (2,260 lb)' },
      { label: 'Dimensions', value: '3.0 m L × 2.7 m W × 2.2 m H' },
      { label: 'Power Source', value: 'MMRTG (110 W electrical / 2,000 W thermal)' },
      { label: 'Science Instruments', value: '7 advanced payloads + 19 cameras' },
      { label: 'Landing System', value: 'Sky Crane Guided Powered Descent' },
      { label: 'Landing Date', value: 'February 18, 2021 (Sol 0)' },
      { label: 'Landing Site', value: 'Octavia E. Butler Landing, Jezero Crater' },
      { label: 'Active Mission Sol', value: 'Sol 1,300+ (Actively Exploring)' },
    ],
  },
};

// ── Utility: build mesh-name → partId map ────────────────────────────────────

function buildMeshPartMap(parts: PartEntry[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const part of parts) {
    for (const meshName of part.meshNames) {
      map.set(meshName, part.id);
    }
  }
  return map;
}

// ── Region hit test for single-mesh models ────────────────────────────────────

function hitTestRegion(
  intersect: THREE.Intersection,
  parts: PartEntry[]
): PartEntry | null {
  const localPoint = intersect.object.worldToLocal(intersect.point.clone());
  for (const part of parts) {
    if (!part.regionBounds) continue;
    const b = part.regionBounds;
    if (
      localPoint.x >= b.xMin && localPoint.x <= b.xMax &&
      localPoint.y >= b.yMin && localPoint.y <= b.yMax &&
      localPoint.z >= b.zMin && localPoint.z <= b.zMax
    ) {
      return part;
    }
  }
  return parts[0] ?? null;
}

// ── Pulsing Hotspot Marker ────────────────────────────────────────────────────

const HotspotMarker: React.FC<{
  anchor: [number, number, number];
  label: string;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}> = ({ anchor, label, index, isSelected, onClick }) => {
  return (
    <Html position={anchor} center zIndexRange={[10, 100]}>
      <div
        style={{ pointerEvents: 'auto', cursor: 'pointer' }}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="relative flex items-center group"
      >
        {/* Pulsing beacon waves */}
        <div
          className={`absolute -inset-2.5 rounded-full border-2 animate-ping pointer-events-none ${
            isSelected ? 'border-amber-300' : 'border-amber-500/50'
          }`}
          style={{ animationDuration: '2.0s' }}
        />
        {/* Core Badge */}
        <div
          className={`relative w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono font-bold border shadow-lg transition-all duration-200 ${
            isSelected
              ? 'bg-amber-400 border-white text-black scale-125 shadow-amber-500/50'
              : 'bg-black/90 border-amber-400/80 text-amber-300 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-black'
          }`}
        >
          {index + 1}
        </div>
        {/* Floating Tag */}
        <div
          className={`absolute left-7 top-1/2 -translate-y-1/2 whitespace-nowrap bg-black/90 border border-amber-500/40 text-amber-200 text-[10px] font-mono px-2 py-0.5 rounded shadow-xl backdrop-blur-sm pointer-events-none transition-opacity duration-150 ${
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {label}
        </div>
      </div>
    </Html>
  );
};

// ── Screen-space Hover Tooltip ───────────────────────────────────────────────

const HoverTooltip: React.FC<{
  label: string;
  subassembly: string;
  x: number;
  y: number;
}> = ({ label, subassembly, x, y }) => (
  <div
    className="fixed z-50 pointer-events-none"
    style={{ left: x + 14, top: y - 36 }}
  >
    <div className="bg-slate-950/95 border border-amber-500/60 text-amber-100 text-[11px] font-mono px-3 py-1.5 rounded shadow-2xl backdrop-blur-md max-w-[240px]">
      <div className="font-semibold text-amber-300 truncate">{label}</div>
      <div className="text-slate-400 text-[10px] truncate">{subassembly}</div>
    </div>
  </div>
);

// ── Reusable Authentic NASA 3D Model Renderer ─────────────────────────────────

const AuthenticNasaModelRenderer: React.FC<{
  config: InspectionModelConfig;
  parts: PartEntry[];
  meshPartMap: Map<string, string>;
  selectedPartId: string | null;
  hoveredPartId: string | null;
  exploded: boolean;
  onSelectPart: (id: string) => void;
  onHoverPart: (id: string | null, x?: number, y?: number) => void;
  flyTo: (pos: [number, number, number], look: [number, number, number]) => void;
}> = ({
  config,
  parts,
  meshPartMap,
  selectedPartId,
  hoveredPartId,
  exploded,
  onSelectPart,
  onHoverPart,
  flyTo,
}) => {
  const { scene } = useGLTF(config.modelPath);
  const groupRef = useRef<THREE.Group>(null);

  const basePosRef = useRef<Map<string, THREE.Vector3>>(new Map());
  const explodeTargetRef = useRef<Map<string, THREE.Vector3>>(new Map());

  // Deep clone scene and enhance PBR materials while preserving authentic NASA textures
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Compute BVH for pixel-perfect raycasting
        if (mesh.geometry && !mesh.geometry.boundsTree) {
          (mesh.geometry as any).computeBoundsTree();
        }

        // Tag mesh with its manifest partId
        const partId = meshPartMap.get(mesh.name);
        mesh.userData.partId = partId ?? null;

        // Save base local position for exploded view lerp
        basePosRef.current.set(mesh.uuid, mesh.position.clone());

        // ── NASA-Accurate PBR Material Enhancement ────────────────────────
        // Uses part-ID-aware palette so each spacecraft subsystem gets
        // its correct real-world material (kapton gold, aluminum, titanium, etc.)
        // CRITICAL: preserve the original single/array material shape to avoid
        // Three.js skipping draw calls on meshes with empty geometry.groups
        if (mesh.material) {
          const isArray = Array.isArray(mesh.material);
          const mats = isArray
            ? (mesh.material as THREE.Material[])
            : [mesh.material as THREE.Material];

          const newMats = mats.map((originalMat) => {
            // Always clone to avoid mutating cached shared materials
            const mat = (originalMat instanceof THREE.MeshStandardMaterial
              ? originalMat.clone()
              : new THREE.MeshStandardMaterial({
                  name: originalMat.name,
                  side: (originalMat as any).side ?? THREE.FrontSide,
                })
            ) as THREE.MeshStandardMaterial;

            const partId = mesh.userData.partId as string | null;
            const matName = mat.name ?? '';
            const preset = getPBRPreset(partId, matName);

            // Apply NASA-accurate PBR values
            mat.metalness = preset.metalness;
            mat.roughness  = preset.roughness;

            // Only override color when the mesh has NO baked texture –
            // preserving authentic NASA texture maps where they exist
            if (!mat.map) {
              mat.color.set(preset.color);
            }

            // Boost existing textures so they're not washed out in studio lighting
            if (mat.map) {
              mat.map.colorSpace = THREE.SRGBColorSpace;
            }
            if (mat.normalMap) {
              mat.normalScale?.set(1.2, 1.2);
            }

            mat.envMapIntensity = 1.4;
            mat.needsUpdate = true;
            return mat;
          });

          // Unpack single material so BufferGeometry draws faces properly!
          mesh.material = isArray ? newMats : newMats[0];
        }
      }
    });

    // Build explode vector offsets per mesh
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const partId = mesh.userData.partId as string | null;
        const part = parts.find((p) => p.id === partId);
        const basePos = basePosRef.current.get(mesh.uuid) ?? mesh.position.clone();
        if (part) {
          const ev = new THREE.Vector3(...part.explodeVector);
          explodeTargetRef.current.set(mesh.uuid, basePos.clone().add(ev));
        } else {
          explodeTargetRef.current.set(mesh.uuid, basePos.clone());
        }
      }
    });

    return clone;
  }, [scene, meshPartMap, parts]);

  // Handle emissive glow highlights and exploded position lerping each frame
  useFrame(() => {
    if (!groupRef.current) return;

    groupRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const partId = mesh.userData.partId as string | null;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

        mats.forEach((m) => {
          const mat = m as THREE.MeshStandardMaterial;
          if (!mat || !('emissive' in mat)) return;

          if (partId && partId === selectedPartId) {
            mat.emissive.set('#b45309');
            mat.emissiveIntensity = 0.55;
          } else if (partId && partId === hoveredPartId) {
            mat.emissive.set('#78350f');
            mat.emissiveIntensity = 0.35;
          } else {
            mat.emissive.set('#000000');
            mat.emissiveIntensity = 0;
          }
        });

        // Smooth exploded view displacement
        const basePos = basePosRef.current.get(mesh.uuid);
        const explodeTarget = explodeTargetRef.current.get(mesh.uuid);
        if (basePos && explodeTarget) {
          const target = exploded ? explodeTarget : basePos;
          mesh.position.lerp(target, 0.08);
        }
      }
    });
  });

  const handlePointerMove = useCallback(
    (e: any) => {
      e.stopPropagation();
      const hit = e.intersections?.[0];
      if (!hit) {
        onHoverPart(null);
        return;
      }

      // If parts use region bounds (e.g. single-mesh models like Opportunity), prioritize region hit test
      const hasRegions = parts.some((p) => p.regionBounds);
      if (hasRegions) {
        const regionPart = hitTestRegion(hit, parts);
        if (regionPart) {
          onHoverPart(regionPart.id, e.clientX, e.clientY);
          return;
        }
      }

      // Check if hit object has partId directly or in parents (multi-mesh BVH raycast)
      let obj: THREE.Object3D | null = hit.object;
      while (obj) {
        if (obj.userData.partId) {
          onHoverPart(obj.userData.partId as string, e.clientX, e.clientY);
          return;
        }
        obj = obj.parent;
      }

      onHoverPart(null);
    },
    [onHoverPart, parts]
  );

  const handleClick = useCallback(
    (e: any) => {
      e.stopPropagation();
      const hit = e.intersections?.[0];
      if (!hit) return;

      // Prioritize region test for single-mesh models
      const hasRegions = parts.some((p) => p.regionBounds);
      if (hasRegions) {
        const part = hitTestRegion(hit, parts);
        if (part) {
          onSelectPart(part.id);
          flyTo(part.cameraTarget.position, part.cameraTarget.lookAt);
          return;
        }
      }

      let obj: THREE.Object3D | null = hit.object;
      while (obj) {
        if (obj.userData.partId) {
          const partId = obj.userData.partId as string;
          onSelectPart(partId);
          const part = parts.find((p) => p.id === partId);
          if (part) {
            flyTo(part.cameraTarget.position, part.cameraTarget.lookAt);
          }
          return;
        }
        obj = obj.parent;
      }
    },
    [onSelectPart, parts, flyTo]
  );

  return (
    <group ref={groupRef} position={config.modelPosition} scale={config.modelScale}>
      <primitive
        object={clonedScene}
        onPointerMove={handlePointerMove}
        onPointerOut={() => onHoverPart(null)}
        onClick={handleClick}
      />

      {/* Hotspot pin markers anchored to real spacecraft locations (glides along explodeVector when exploded) */}
      {parts.map((part, i) => {
        const animatedAnchor: [number, number, number] = exploded
          ? [
              part.hotspotAnchor[0] + part.explodeVector[0],
              part.hotspotAnchor[1] + part.explodeVector[1],
              part.hotspotAnchor[2] + part.explodeVector[2],
            ]
          : part.hotspotAnchor;

        return (
          <HotspotMarker
            key={part.id}
            anchor={animatedAnchor}
            label={part.label}
            index={i}
            isSelected={selectedPartId === part.id}
            onClick={() => {
              onSelectPart(part.id);
              flyTo(part.cameraTarget.position, part.cameraTarget.lookAt);
            }}
          />
        );
      })}
    </group>
  );
};

// ── Studio 3D Scene Viewport ──────────────────────────────────────────────────

const StudioSceneCanvas: React.FC<{
  config: InspectionModelConfig;
  parts: PartEntry[];
  meshPartMap: Map<string, string>;
  selectedPartId: string | null;
  hoveredPartId: string | null;
  exploded: boolean;
  autoRotate: boolean;
  onSelectPart: (id: string) => void;
  onHoverPart: (id: string | null, x?: number, y?: number) => void;
  controlsRef: React.MutableRefObject<any>;
}> = ({
  config,
  parts,
  meshPartMap,
  selectedPartId,
  hoveredPartId,
  exploded,
  autoRotate,
  onSelectPart,
  onHoverPart,
  controlsRef,
}) => {
  const { camera } = useThree();

  const flyTo = useCallback(
    (position: [number, number, number], lookAt: [number, number, number]) => {
      const controls = controlsRef.current;
      if (!controls) return;
      const targetLookAt = new THREE.Vector3(...lookAt);

      gsap.to(camera.position, {
        x: position[0],
        y: position[1],
        z: position[2],
        duration: 1.2,
        ease: 'power3.inOut',
        onUpdate: () => {
          controls.target?.lerp(targetLookAt, 0.08);
          controls.update?.();
        },
      });

      gsap.to(controls.target, {
        x: lookAt[0],
        y: lookAt[1],
        z: lookAt[2],
        duration: 1.2,
        ease: 'power3.inOut',
        onUpdate: () => controls.update?.(),
      });
    },
    [camera, controlsRef]
  );

  // Synchronize camera fly-to when a part is selected from the right drawer or keyboard navigation
  useEffect(() => {
    if (!selectedPartId) return;
    const part = parts.find((p) => p.id === selectedPartId);
    if (part) {
      flyTo(part.cameraTarget.position, part.cameraTarget.lookAt);
    }
  }, [selectedPartId, parts, flyTo]);

  return (
    <>
      {/* ── 7-Point Aerospace Studio Lighting Rig ── */}

      {/* Soft ambient base so deep shadows never go fully black */}
      <ambientLight intensity={0.35} color="#c8d4e8" />

      {/* Key Light — simulates harsh solar illumination at ~45° azimuth */}
      <spotLight
        position={[7, 10, 5]}
        angle={0.38}
        penumbra={0.6}
        intensity={280}
        color="#fff8f0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.04}
      />

      {/* Fill Light — cool blue deep-space bounce, left side */}
      <directionalLight position={[-9, 5, -4]} intensity={0.9} color="#8ab4e8" />

      {/* Rim / Back Light — golden warm highlight along rear silhouette */}
      <directionalLight position={[1, 6, -11]} intensity={1.6} color="#f5d070" />

      {/* Under-fill — prevents totally black belly of spacecraft */}
      <directionalLight position={[0, -4, 3]} intensity={0.3} color="#c0c8d8" />

      {/* Front detail fill — brings out surface geometry detail */}
      <pointLight position={[0, 2.5, 4.5]} intensity={30} color="#ffffff" decay={2} />

      {/* Top accent — museum-style overhead studio lamp */}
      <spotLight
        position={[0, 9, 0]}
        angle={0.55}
        penumbra={0.9}
        intensity={80}
        color="#fff4e0"
        castShadow={false}
      />

      {/* Sky / Ground hemisphere for natural ambient gradation */}
      <hemisphereLight args={['#dce8f8', '#1a0f08', 0.45]} />

      <Suspense
        fallback={
          <Html center>
            <div className="flex items-center space-x-3 text-amber-400 font-mono text-xs bg-slate-950/90 px-4 py-2.5 rounded-lg border border-amber-500/40 shadow-2xl backdrop-blur-md">
              <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <span>LOADING AUTHENTIC NASA 3D MESH GEOMETRY…</span>
            </div>
          </Html>
        }
      >
        <AuthenticNasaModelRenderer
          config={config}
          parts={parts}
          meshPartMap={meshPartMap}
          selectedPartId={selectedPartId}
          hoveredPartId={hoveredPartId}
          exploded={exploded}
          onSelectPart={onSelectPart}
          onHoverPart={onHoverPart}
          flyTo={flyTo}
        />
      </Suspense>

      {/* Realistic Soft Contact Shadow on Pedestal */}
      <ContactShadows
        position={[0, config.modelPosition[1] + 0.02, 0]}
        opacity={0.85}
        scale={12}
        blur={2.5}
        far={5}
        color="#000510"
      />

      {/* Sleek Aerospace Museum Display Plinth */}
      <mesh position={[0, config.modelPosition[1], 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[5.5, 64]} />
        <meshStandardMaterial color="#06090f" roughness={0.72} metalness={0.35} />
      </mesh>
      {/* Inner glowing ring */}
      <mesh position={[0, config.modelPosition[1] + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.8, 4.83, 64]} />
        <meshBasicMaterial color="#1e3a5f" transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, config.modelPosition[1] + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.8, 2.815, 64]} />
        <meshBasicMaterial color="#1e3a5f" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      <OrbitControls
        ref={controlsRef}
        enablePan
        enableZoom
        minDistance={1.0}
        maxDistance={9.0}
        autoRotate={autoRotate && !exploded}
        autoRotateSpeed={0.8}
        makeDefault
      />
    </>
  );
};

// ── Main Hardware Inspection Studio Component ─────────────────────────────────

export const HardwareInspectionStudio: React.FC<HardwareInspectionProps> = ({
  initialArtifactId = 'apollo11_eagle',
  onClose,
}) => {
  const [selectedArtifactId, setSelectedArtifactId] = useState<string>(
    initialArtifactId in HARDWARE_CONFIGS ? initialArtifactId : 'apollo11_eagle'
  );
  const [explodedView, setExplodedView] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [hoveredPartId, setHoveredPartId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [parts, setParts] = useState<PartEntry[]>([]);
  const [partsLoading, setPartsLoading] = useState(true);

  const controlsRef = useRef<any>(null);

  const activeConfig = HARDWARE_CONFIGS[selectedArtifactId] ?? HARDWARE_CONFIGS.apollo11_eagle;

  // Load NASA part manifest
  useEffect(() => {
    setPartsLoading(true);
    setSelectedPartId(null);
    setParts([]);
    fetch(activeConfig.manifestPath)
      .then((r) => r.json())
      .then((data: PartEntry[]) => {
        setParts(data);
        setPartsLoading(false);
      })
      .catch((err) => {
        console.error('[HardwareStudio] Failed to load part manifest:', err);
        setPartsLoading(false);
      });
  }, [activeConfig.manifestPath]);

  const meshPartMap = useMemo(() => buildMeshPartMap(parts), [parts]);

  const currentPart = useMemo(
    () => (selectedPartId ? parts.find((p) => p.id === selectedPartId) : null) ?? parts[0] ?? null,
    [selectedPartId, parts]
  );

  const handleHoverPart = useCallback(
    (id: string | null, x?: number, y?: number) => {
      setHoveredPartId(id);
      setTooltipPos(id && x !== undefined && y !== undefined ? { x, y } : null);
      document.body.style.cursor = id ? 'pointer' : '';
    },
    []
  );

  // Keyboard navigation: Arrow keys cycle subsystems; Escape exits
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!parts.length) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const idx = parts.findIndex((p) => p.id === selectedPartId);
        const next =
          e.key === 'ArrowRight'
            ? (idx + 1) % parts.length
            : (idx - 1 + parts.length) % parts.length;
        setSelectedPartId(parts[next].id);
        setAutoRotate(false);
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [parts, selectedPartId, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#05070B] text-slate-100 select-none overflow-hidden">
      {/* ── Studio Header ── */}
      <header className="h-14 px-4 border-b border-white/10 bg-slate-950/80 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="flex items-center space-x-2 shrink-0">
            <Cpu className="w-4 h-4 text-amber-400" />
            <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-white font-semibold hidden sm:block">
              AFTERLIGHT 3D HARDWARE INSPECTION STUDIO
            </span>
          </div>

          <span className="hidden md:inline-block text-white/30 text-xs">|</span>

          {/* Model Switcher Tabs — MOON and MARS */}
          <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10 overflow-x-auto">
            {Object.values(HARDWARE_CONFIGS).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedArtifactId(item.id);
                  setSelectedPartId(null);
                  setExplodedView(false);
                  setAutoRotate(true);
                }}
                className={`px-3 py-1.5 rounded-md text-[10px] font-mono tracking-wider uppercase transition-all duration-200 whitespace-nowrap ${
                  selectedArtifactId === item.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.planet === 'moon' ? '🌕 MOON: ' : '🔴 MARS: '}
                {item.name.split(' ').slice(0, 3).join(' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Authenticity Badge & Close */}
        <div className="flex items-center space-x-3 shrink-0">
          <LanguageSwitcher />

          {activeConfig.isAuthenticNasaModel ? (
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold tracking-wider">{activeConfig.modelTypeLabel}</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-950/70 border border-amber-500/40 text-amber-300 text-[10px] font-mono">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold tracking-wider truncate max-w-[200px]">{activeConfig.modelTypeLabel}</span>
            </div>
          )}

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
            title="Exit Studio (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Main Work Area ── */}
      <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
        {/* Left 3D Viewport */}
        <div className="flex-1 relative h-[55vh] lg:h-full bg-gradient-to-b from-[#080B11] via-[#05070B] to-[#020305]">
          <Canvas
            camera={{ position: activeConfig.initialCamera, fov: 42 }}
            className="w-full h-full cursor-grab active:cursor-grabbing"
            shadows="soft"
            gl={{
              antialias: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.35,
              powerPreference: 'high-performance',
            }}
            onPointerMissed={() => handleHoverPart(null)}
          >
            {!partsLoading && parts.length > 0 && (
              <StudioSceneCanvas
                key={activeConfig.id}
                config={activeConfig}
                parts={parts}
                meshPartMap={meshPartMap}
                selectedPartId={selectedPartId}
                hoveredPartId={hoveredPartId}
                exploded={explodedView}
                autoRotate={autoRotate}
                onSelectPart={(id) => {
                  setSelectedPartId(id);
                  setAutoRotate(false);
                }}
                onHoverPart={handleHoverPart}
                controlsRef={controlsRef}
              />
            )}
          </Canvas>

          {/* Floating Hover Tooltip */}
          {hoveredPartId && tooltipPos && !selectedPartId && (() => {
            const hovered = parts.find((p) => p.id === hoveredPartId);
            return hovered ? (
              <HoverTooltip
                label={hovered.label}
                subassembly={hovered.subassembly}
                x={tooltipPos.x}
                y={tooltipPos.y}
              />
            ) : null;
          })()}

          {/* Viewport Floating Controls */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10">
            <button
              onClick={() => setExplodedView(!explodedView)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider uppercase backdrop-blur-md transition-all border ${
                explodedView
                  ? 'bg-amber-500/30 text-amber-300 border-amber-400/60 shadow-lg'
                  : 'bg-black/60 text-slate-300 border-white/10 hover:bg-black/80'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>{explodedView ? 'COLLAPSE MODEL' : 'EXPLODED VIEW'}</span>
            </button>

            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider uppercase backdrop-blur-md transition-all border ${
                autoRotate
                  ? 'bg-white/20 text-white border-white/30'
                  : 'bg-black/60 text-slate-400 border-white/10 hover:bg-black/80'
              }`}
            >
              <RotateCw className="w-3 h-3" />
              <span>TURNTABLE {autoRotate ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Interactive Inspection Hint Pill */}
          <div className="absolute bottom-3 left-3 right-3 lg:right-auto flex items-center space-x-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] text-slate-400 font-mono">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Click physical hardware or beacon pin to inspect • Drag 360° • Scroll to zoom • ←→ keys cycle parts</span>
          </div>
        </div>

        {/* ── Right Subsystems & Engineering Dossier Panel ── */}
        <div className="w-full lg:w-[440px] border-t lg:border-t-0 lg:border-l border-white/10 bg-[#080B11] flex flex-col overflow-y-auto max-h-[45vh] lg:max-h-full">
          {/* Hardware Identity Card */}
          <div className="p-5 border-b border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-[0.2em] text-amber-400 uppercase">
                {activeConfig.planet.toUpperCase()} ARCHIVAL ARTIFACT
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {partsLoading ? '…' : parts.length} SUB-ASSEMBLIES
              </span>
            </div>

            <h2 className="text-xl font-serif text-white tracking-wide">{activeConfig.name}</h2>
            <p className="text-[11px] text-slate-400 font-mono">{activeConfig.subtitle}</p>

            {/* Authenticity Citation Banner */}
            <div
              className={`p-2.5 rounded-lg border text-[11px] font-mono space-y-1 ${
                activeConfig.isAuthenticNasaModel
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                  : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
              }`}
            >
              <div className="flex items-center space-x-1.5 font-semibold">
                {activeConfig.isAuthenticNasaModel ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )}
                <span>{activeConfig.modelTypeLabel}</span>
              </div>
              <p className="text-[10px] opacity-80 leading-relaxed">{activeConfig.modelSourceCitation}</p>
              {activeConfig.disclaimer && (
                <p className="text-[10px] text-amber-300/70 italic border-t border-amber-500/20 pt-1">
                  {activeConfig.disclaimer}
                </p>
              )}
            </div>
          </div>

          {/* Subsystem Component Selector Chips */}
          <div className="p-3 border-b border-white/10 bg-black/20">
            <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-slate-400 block mb-2">
              SELECT COMPONENT TO INSPECT
            </span>
            {partsLoading ? (
              <div className="text-slate-500 text-[10px] font-mono py-2">Loading manifest…</div>
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {parts.map((part, i) => {
                  const isSelected = part.id === currentPart?.id;
                  return (
                    <button
                      key={part.id}
                      onClick={() => {
                        setSelectedPartId(part.id);
                        setAutoRotate(false);
                      }}
                      className={`text-left px-2 py-1.5 rounded text-[10px] font-mono transition-all truncate flex items-center justify-between border ${
                        isSelected
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                          : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <span className="flex items-center space-x-1.5 truncate">
                        <span className="text-[8px] text-amber-500/70 shrink-0">{i + 1}</span>
                        <span className="truncate">{part.label.split(' (')[0]}</span>
                      </span>
                      {isSelected && <ChevronRight className="w-3 h-3 text-amber-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Subsystem Detail Inspector */}
          {currentPart && (
            <div className="p-5 space-y-4 flex-1">
              <div className="space-y-0.5">
                <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase">
                  {currentPart.subassembly}
                </span>
                <h3 className="text-base font-serif text-white font-medium leading-snug">
                  {currentPart.label}
                </h3>
                {currentPart.specs.mass && (
                  <div className="text-[10px] font-mono text-amber-400/90">
                    MASS: {currentPart.specs.mass}
                  </div>
                )}
              </div>

              <div className="space-y-3 text-[11px] leading-relaxed text-slate-300">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">
                    FUNCTIONAL PURPOSE
                  </span>
                  <p className="bg-white/5 p-2.5 rounded-lg border border-white/5 font-sans">
                    {currentPart.function}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">
                    ENGINEERING SPECIFICATIONS
                  </span>
                  <div className="bg-amber-500/5 p-2.5 rounded-lg border border-amber-500/10 space-y-1">
                    {Object.entries(currentPart.specs).map(([key, val]) => (
                      <div key={key} className="flex gap-1.5 text-[10px] font-mono">
                        <span className="text-slate-400 uppercase shrink-0">{key.replace(/_/g, ' ')}:</span>
                        <span className="text-amber-200/90">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">
                    MISSION FACTS
                  </span>
                  <ul className="space-y-1">
                    {currentPart.missionFacts.map((fact, i) => (
                      <li key={i} className="bg-white/5 p-2 rounded border border-white/5 font-sans text-[10px] flex gap-2">
                        <span className="text-amber-500/60 shrink-0 font-mono">•</span>
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Verified NASA Source Document Link */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-mono">
                <a
                  href={currentPart.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-amber-400/80 hover:text-amber-300 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>NASA Source Documentation</span>
                </a>
                <a
                  href="https://github.com/adithyasshetty/AFTERLIGHT/issues/new?title=Scientific+Data+Correction&labels=scientific-integrity"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-amber-400 underline decoration-slate-600 underline-offset-2 transition-colors text-[9px]"
                  title="Report a discrepancy, coordinate deviation, or citation error"
                >
                  Report correction
                </a>
              </div>
            </div>
          )}

          {/* Overview Mission Specifications */}
          <div className="p-4 border-t border-white/10 space-y-2 bg-black/20">
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-slate-400 block">
              MISSION SPECIFICATIONS
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {activeConfig.overviewSpecs.map((spec, i) => (
                <div key={i} className="bg-white/5 p-2 rounded border border-white/5 space-y-0.5">
                  <div className="text-[9px] text-slate-400 uppercase truncate font-mono">{spec.label}</div>
                  <div className="text-white font-medium text-[10px] font-mono">{spec.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
