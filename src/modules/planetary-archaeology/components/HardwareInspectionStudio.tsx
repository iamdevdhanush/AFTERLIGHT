/**
 * AFTERLIGHT 3D HARDWARE INSPECTION STUDIO
 * ==========================================
 * Apollo 11 LM Eagle (LM-5) — mesh-based BVH raycasting via three-mesh-bvh
 * Opportunity Rover (MER-B) — bounding-box region detection (single-mesh GLB fallback)
 *
 * Architecture:
 *  - PartManifest: data-driven JSON loaded from /public/data/parts.moon.json|parts.mars.json
 *  - Apollo: traverses scene graph → tags each mesh → three-mesh-bvh for accurate raycast hits
 *  - Opportunity: single Mesh GLB → bounding-box region lookup from manifest regionBounds
 *  - Hotspots: drei <Html> anchored at hotspotAnchor inside model group
 *  - Camera fly-to: GSAP animation on OrbitControls target/position on part select
 *  - Exploded view: per-part explodeVector lerp in useFrame
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
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
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
  Crosshair,
  ExternalLink,
} from 'lucide-react';

// ── Extend THREE prototypes for BVH ──────────────────────────────────────────
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
  regionBounds?: RegionBounds;    // Opportunity fallback
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
  isAuthenticNasaModel: boolean;
  modelTypeLabel: string;
  modelSourceCitation: string;
  disclaimer?: string;
  manifestPath: string;
  overviewSpecs: { label: string; value: string }[];
}

// ── Static model configuration ────────────────────────────────────────────────

const HARDWARE_CONFIGS: Record<string, InspectionModelConfig> = {
  apollo11_eagle: {
    id: 'apollo11_eagle',
    name: 'Apollo 11 Lunar Module "Eagle"',
    subtitle: 'LM-5 Descent & Ascent Hardware Stack',
    planet: 'moon',
    modelPath: '/models/apollo_lunar_module.glb',
    isAuthenticNasaModel: true,
    modelTypeLabel: 'AUTHENTIC NASA 3D MODEL',
    modelSourceCitation: 'NASA 3D Resources / Apollo Lunar Module LM-5 (Official NASA Mesh)',
    manifestPath: '/data/parts.moon.json',
    overviewSpecs: [
      { label: 'Total Launch Mass', value: '15,103 kg (33,297 lb)' },
      { label: 'Descent Stage Mass', value: '10,334 kg (fueled)' },
      { label: 'Ascent Stage Mass', value: '4,769 kg (fueled)' },
      { label: 'Landing Gear Span', value: '9.45 m diagonal across pads' },
      { label: 'Descent Engine Thrust', value: '1,050–10,125 lbf throttleable' },
      { label: 'Ascent Engine Thrust', value: '3,500 lbf hypergolic constant' },
      { label: 'Habitable Volume', value: '6.7 m³ stand-up cockpit' },
      { label: 'Lunar Status', value: 'Descent Stage at Tranquility Base' },
    ],
  },
  opportunity: {
    id: 'opportunity',
    name: 'Opportunity Rover (MER-B)',
    subtitle: 'Mars Exploration Rover Flight Hardware',
    planet: 'mars',
    modelPath: '/models/opportunity_rover.glb',
    isAuthenticNasaModel: false,
    modelTypeLabel: 'ARCHIVAL RECONSTRUCTION (EDUCATIONAL MODEL)',
    modelSourceCitation: 'Reconstructed from NASA JPL MER Blueprint Schematics & CAD Documentation',
    disclaimer: 'Educational reconstruction based on official NASA JPL technical schematics. Not an authentic NASA CAD export.',
    manifestPath: '/data/parts.mars.json',
    overviewSpecs: [
      { label: 'Vehicle Mass', value: '185 kg (408 lb)' },
      { label: 'Dimensions', value: '1.5 m high × 2.3 m wide × 1.6 m long' },
      { label: 'Power Source', value: 'Triple-junction GaAs Solar (140 W peak)' },
      { label: 'Total Distance', value: '45.16 km (28.06 mi)' },
      { label: 'Design Lifetime', value: '90 Martian sols' },
      { label: 'Actual Lifetime', value: '5,352 Martian sols (14 years)' },
      { label: 'Top Speed', value: '5 cm/s (0.18 km/h)' },
      { label: 'Mars Status', value: 'Silent at Perseverance Valley' },
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

// ── Utility: check if world point falls within regionBounds (local space) ────

function hitTestRegion(
  intersect: THREE.Intersection,
  parts: PartEntry[]
): PartEntry | null {
  // Convert hit point to local space of the intersected object
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
  // If no region matched, return null — will fall back to first part
  return null;
}

// ── Pulsing hotspot marker ────────────────────────────────────────────────────

const HotspotMarker: React.FC<{
  anchor: [number, number, number];
  label: string;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}> = ({ anchor, label, index, isSelected, onClick }) => {
  return (
    <Html position={anchor} center distanceFactor={undefined} zIndexRange={[10, 100]}>
      <div
        style={{ pointerEvents: 'auto', cursor: 'pointer' }}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className="relative flex items-center"
      >
        {/* Pulsing ring */}
        <div
          className={`absolute -inset-2 rounded-full border-2 animate-ping ${
            isSelected ? 'border-amber-300' : 'border-amber-500/60'
          }`}
          style={{ animationDuration: '1.8s' }}
        />
        {/* Core dot */}
        <div
          className={`relative w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono font-bold border-2 shadow-lg transition-all duration-200 ${
            isSelected
              ? 'bg-amber-400 border-amber-200 text-black scale-125'
              : 'bg-amber-500/80 border-amber-300 text-black hover:scale-110'
          }`}
        >
          {index + 1}
        </div>
        {/* Tooltip label */}
        {isSelected && (
          <div className="absolute left-7 top-1/2 -translate-y-1/2 whitespace-nowrap bg-black/90 border border-amber-500/50 text-amber-200 text-[10px] font-mono px-2 py-0.5 rounded shadow-xl">
            {label}
          </div>
        )}
      </div>
    </Html>
  );
};

// ── Hover tooltip (screen-space) ─────────────────────────────────────────────

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
    <div className="bg-slate-950/95 border border-amber-500/50 text-amber-100 text-[11px] font-mono px-3 py-1.5 rounded shadow-xl backdrop-blur-sm max-w-[200px]">
      <div className="font-semibold text-amber-300 truncate">{label}</div>
      <div className="text-slate-400 text-[10px] truncate">{subassembly}</div>
    </div>
  </div>
);

// ── Camera fly-to controller ─────────────────────────────────────────────────

function useCameraFlyTo() {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  const flyTo = useCallback(
    (position: [number, number, number], lookAt: [number, number, number]) => {
      if (!controlsRef.current) return;
      const controls = controlsRef.current;
      const targetPos = new THREE.Vector3(...position);
      const targetLookAt = new THREE.Vector3(...lookAt);

      gsap.to(camera.position, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: 1.2,
        ease: 'power3.inOut',
        onUpdate: () => {
          if (controls.target) {
            controls.target.lerp(targetLookAt, 0.08);
          }
          camera.lookAt(controls.target || targetLookAt);
          controls.update?.();
        },
      });

      gsap.to(controls.target, {
        x: targetLookAt.x,
        y: targetLookAt.y,
        z: targetLookAt.z,
        duration: 1.2,
        ease: 'power3.inOut',
        onUpdate: () => controls.update?.(),
      });
    },
    [camera]
  );

  return { flyTo, controlsRef };
}

// ── Apollo LM renderer (BVH mesh-based raycasting) ──────────────────────────

const ApolloModelRenderer: React.FC<{
  parts: PartEntry[];
  meshPartMap: Map<string, string>;
  selectedPartId: string | null;
  hoveredPartId: string | null;
  exploded: boolean;
  onSelectPart: (id: string) => void;
  onHoverPart: (id: string | null, x?: number, y?: number) => void;
  flyTo: (pos: [number, number, number], look: [number, number, number]) => void;
}> = ({
  parts,
  meshPartMap,
  selectedPartId,
  hoveredPartId,
  exploded,
  onSelectPart,
  onHoverPart,
  flyTo,
}) => {
  const { scene } = useGLTF('/models/apollo_lunar_module.glb');
  const groupRef = useRef<THREE.Group>(null);

  // Track base positions for explode lerp
  const basePosRef = useRef<Map<string, THREE.Vector3>>(new Map());
  const explodeTargetRef = useRef<Map<string, THREE.Vector3>>(new Map());

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    // Set up BVH on every mesh + store base positions + apply materials
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Build BVH for accurate raycasting
        if (mesh.geometry && !mesh.geometry.boundsTree) {
          (mesh.geometry as any).computeBoundsTree();
        }

        // Tag mesh with its partId
        const partId = meshPartMap.get(mesh.name);
        mesh.userData.partId = partId ?? null;

        // Store base world position (relative to group)
        basePosRef.current.set(mesh.uuid, mesh.position.clone());

        // Apply materials based on material name heuristics
        if (mesh.material instanceof THREE.MeshStandardMaterial) {
          const mat = mesh.material.clone();
          const name = mat.name.toLowerCase();
          if (
            name.includes('blinn1') ||
            name.includes('blinn9') ||
            name.includes('blinn10') ||
            (mat.color.r > 0.6 && mat.color.b < 0.2)
          ) {
            mat.metalness = 0.92;
            mat.roughness = 0.25;
            mat.color.set('#E5B342');
          } else if (
            name.includes('blinn6') ||
            (mat.color.r < 0.1 && mat.color.g < 0.1 && mat.color.b < 0.1)
          ) {
            mat.metalness = 0.7;
            mat.roughness = 0.4;
            mat.color.set('#1a1a1c');
          } else {
            mat.metalness = 0.85;
            mat.roughness = 0.35;
            mat.color.set('#CBD5E1');
          }
          mesh.material = mat;
        }
      }
    });

    // Build explode target positions per mesh
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

  // Update emissive highlight + explode lerp every frame
  useFrame(() => {
    if (!groupRef.current) return;

    groupRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const partId = mesh.userData.partId as string | null;
        const mat = mesh.material as THREE.MeshStandardMaterial;

        if (!mat || !('emissive' in mat)) return;

        // Emissive highlight
        if (partId && partId === selectedPartId) {
          mat.emissive.set('#b45309');
          mat.emissiveIntensity = 0.5;
        } else if (partId && partId === hoveredPartId) {
          mat.emissive.set('#78350f');
          mat.emissiveIntensity = 0.3;
        } else {
          mat.emissive.set('#000000');
          mat.emissiveIntensity = 0;
        }

        // Exploded position lerp
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
      if (!hit) { onHoverPart(null); return; }
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
    [onHoverPart]
  );

  const handleClick = useCallback(
    (e: any) => {
      e.stopPropagation();
      const hit = e.intersections?.[0];
      if (!hit) return;
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
    <group ref={groupRef} position={[0, -0.4, 0]} scale={1.2}>
      <primitive
        object={clonedScene}
        onPointerMove={handlePointerMove}
        onPointerOut={() => onHoverPart(null)}
        onClick={handleClick}
      />

      {/* Hotspot markers */}
      {parts.map((part, i) => (
        <HotspotMarker
          key={part.id}
          anchor={part.hotspotAnchor}
          label={part.label}
          index={i}
          isSelected={selectedPartId === part.id}
          onClick={() => {
            onSelectPart(part.id);
            flyTo(part.cameraTarget.position, part.cameraTarget.lookAt);
          }}
        />
      ))}
    </group>
  );
};

// ── Opportunity Rover renderer (single-mesh region detection) ────────────────

const OpportunityModelRenderer: React.FC<{
  parts: PartEntry[];
  selectedPartId: string | null;
  hoveredPartId: string | null;
  exploded: boolean;
  onSelectPart: (id: string) => void;
  onHoverPart: (id: string | null, x?: number, y?: number) => void;
  flyTo: (pos: [number, number, number], look: [number, number, number]) => void;
}> = ({
  parts,
  selectedPartId,
  hoveredPartId,
  exploded,
  onSelectPart,
  onHoverPart,
  flyTo,
}) => {
  const { scene } = useGLTF('/models/opportunity_rover.glb');
  const groupRef = useRef<THREE.Group>(null);

  // Per-part group refs for explode animation
  const partGroupRefs = useRef<Map<string, THREE.Group>>(new Map());

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Build BVH on the single mesh (for accurate hit point)
        if (mesh.geometry && !mesh.geometry.boundsTree) {
          (mesh.geometry as any).computeBoundsTree();
        }

        // Apply rover materials
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m: THREE.Material, idx: number) => {
            const stdMat = m as THREE.MeshStandardMaterial;
            // Rover deck: dark gold
            if (idx === 0 || idx === 1) {
              stdMat.color?.set('#D4AF37');
              stdMat.metalness = 0.85;
              stdMat.roughness = 0.35;
            } else if (idx === 2 || idx === 3) {
              // Wheels: dark metal
              stdMat.color?.set('#69645E');
              stdMat.metalness = 0.7;
              stdMat.roughness = 0.4;
            } else if (idx === 4 || idx === 5) {
              // Solar panels: deep navy
              stdMat.color?.set('#162238');
              stdMat.metalness = 0.95;
              stdMat.roughness = 0.15;
            } else {
              stdMat.color?.set('#2A2421');
              stdMat.metalness = 0.6;
              stdMat.roughness = 0.5;
            }
          });
        }
      }
    });
    return clone;
  }, [scene]);

  // Animate turntable dishes and hover effects
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    // Simple idle animation on mesh
    groupRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m: THREE.Material) => {
          const stdMat = m as THREE.MeshStandardMaterial;
          if (!stdMat.emissive) return;
          // Highlight selected/hovered regions via emissive (applied globally per material slot)
          stdMat.emissive.set('#000000');
          stdMat.emissiveIntensity = 0;
        });
      }
    });
  });

  const handlePointerMove = useCallback(
    (e: any) => {
      e.stopPropagation();
      const hit = e.intersections?.[0];
      if (!hit) { onHoverPart(null); return; }
      const part = hitTestRegion(hit, parts);
      onHoverPart(part?.id ?? parts[0].id, e.clientX, e.clientY);
    },
    [onHoverPart, parts]
  );

  const handleClick = useCallback(
    (e: any) => {
      e.stopPropagation();
      const hit = e.intersections?.[0];
      if (!hit) return;
      const part = hitTestRegion(hit, parts) ?? parts[0];
      onSelectPart(part.id);
      flyTo(part.cameraTarget.position, part.cameraTarget.lookAt);
    },
    [onSelectPart, parts, flyTo]
  );

  return (
    <group ref={groupRef} position={[0, -0.4, 0]} scale={1.1}>
      <primitive
        object={clonedScene}
        onPointerMove={handlePointerMove}
        onPointerOut={() => onHoverPart(null)}
        onClick={handleClick}
      />

      {/* Hotspot markers */}
      {parts.map((part, i) => (
        <HotspotMarker
          key={part.id}
          anchor={part.hotspotAnchor}
          label={part.label}
          index={i}
          isSelected={selectedPartId === part.id}
          onClick={() => {
            onSelectPart(part.id);
            flyTo(part.cameraTarget.position, part.cameraTarget.lookAt);
          }}
        />
      ))}
    </group>
  );
};

// ── Scene wrapper (passes camera controls ref up) ────────────────────────────

const SceneContent: React.FC<{
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
  const { flyTo } = useCameraFlyTo();

  // Merge controlsRef into local flyTo function
  const { camera } = useThree();

  const flyToWrapper = useCallback(
    (position: [number, number, number], lookAt: [number, number, number]) => {
      const controls = controlsRef.current;
      if (!controls) return;
      const targetLookAt = new THREE.Vector3(...lookAt);

      gsap.to(camera.position, {
        x: position[0], y: position[1], z: position[2],
        duration: 1.2, ease: 'power3.inOut',
        onUpdate: () => {
          controls.target?.lerp(targetLookAt, 0.08);
          controls.update?.();
        },
      });
      gsap.to(controls.target, {
        x: lookAt[0], y: lookAt[1], z: lookAt[2],
        duration: 1.2, ease: 'power3.inOut',
        onUpdate: () => controls.update?.(),
      });
    },
    [camera, controlsRef]
  );

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[6, 8, 5]} intensity={1.5} castShadow />
      <directionalLight position={[-5, -2, -4]} intensity={0.3} color="#60a5fa" />
      <pointLight position={[0, 3, 0]} intensity={0.5} />

      <Suspense
        fallback={
          <Html center>
            <div className="flex items-center space-x-3 text-amber-400 font-mono text-xs bg-slate-950/80 px-4 py-2 rounded border border-amber-500/30">
              <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <span>LOADING NASA 3D MESH GEOMETRY...</span>
            </div>
          </Html>
        }
      >
        {config.id === 'apollo11_eagle' ? (
          <ApolloModelRenderer
            parts={parts}
            meshPartMap={meshPartMap}
            selectedPartId={selectedPartId}
            hoveredPartId={hoveredPartId}
            exploded={exploded}
            onSelectPart={onSelectPart}
            onHoverPart={onHoverPart}
            flyTo={flyToWrapper}
          />
        ) : (
          <OpportunityModelRenderer
            parts={parts}
            selectedPartId={selectedPartId}
            hoveredPartId={hoveredPartId}
            exploded={exploded}
            onSelectPart={onSelectPart}
            onHoverPart={onHoverPart}
            flyTo={flyToWrapper}
          />
        )}
      </Suspense>

      <OrbitControls
        ref={controlsRef}
        enablePan
        enableZoom
        minDistance={1.2}
        maxDistance={7.5}
        autoRotate={autoRotate && !exploded}
        autoRotateSpeed={1.0}
        makeDefault
      />

      <gridHelper args={[8, 16, '#334155', '#1e293b']} position={[0, -0.6, 0]} />
    </>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

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

  // Load part manifest from JSON
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

  // Build mesh-name → partId map
  const meshPartMap = useMemo(() => buildMeshPartMap(parts), [parts]);

  // Currently selected part detail
  const currentPart = useMemo(
    () => (selectedPartId ? parts.find((p) => p.id === selectedPartId) : null) ?? parts[0] ?? null,
    [selectedPartId, parts]
  );

  // Hover handler
  const handleHoverPart = useCallback(
    (id: string | null, x?: number, y?: number) => {
      setHoveredPartId(id);
      setTooltipPos(id && x !== undefined && y !== undefined ? { x, y } : null);
      document.body.style.cursor = id ? 'pointer' : '';
    },
    []
  );

  // Keyboard navigation: ArrowLeft / ArrowRight cycles through parts
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

  // Dev-mode debug overlay
  const isDev = (import.meta as any).env?.DEV ?? false;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#08090D] text-slate-100 select-none overflow-hidden">
      {/* ── Header ── */}
      <header className="h-14 px-4 border-b border-white/10 bg-slate-950/80 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="flex items-center space-x-2 shrink-0">
            <Cpu className="w-4 h-4 text-amber-400" />
            <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-white font-semibold hidden sm:block">
              AFTERLIGHT 3D HARDWARE INSPECTION STUDIO
            </span>
          </div>

          <span className="hidden md:inline-block text-white/30 text-xs">|</span>

          {/* Model Switcher */}
          <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10">
            {Object.values(HARDWARE_CONFIGS).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedArtifactId(item.id);
                  setSelectedPartId(null);
                  setExplodedView(false);
                  setAutoRotate(true);
                }}
                className={`px-3 py-1.5 rounded-md text-[10px] font-mono tracking-wider uppercase transition-all duration-200 ${
                  selectedArtifactId === item.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.planet === 'moon' ? 'MOON: ' : 'MARS: '}
                {item.name.split(' ').slice(0, 2).join(' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Auth badge + close */}
        <div className="flex items-center space-x-3 shrink-0">
          {activeConfig.isAuthenticNasaModel ? (
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold tracking-wider">{activeConfig.modelTypeLabel}</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-950/70 border border-amber-500/40 text-amber-300 text-[10px] font-mono">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold tracking-wider truncate max-w-[180px]">{activeConfig.modelTypeLabel}</span>
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

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">

        {/* Left 3D viewport */}
        <div className="flex-1 relative h-[55vh] lg:h-full bg-gradient-to-b from-[#0B0D14] via-[#07080B] to-[#040507]">
          <Canvas
            camera={{ position: [2.5, 1.8, 3.2], fov: 42 }}
            className="w-full h-full"
            shadows
            onPointerMissed={() => handleHoverPart(null)}
          >
            {!partsLoading && parts.length > 0 && (
              <SceneContent
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

          {/* Hover tooltip (screen-space) */}
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

          {/* Viewport controls */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10">
            <button
              onClick={() => setExplodedView(!explodedView)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider uppercase backdrop-blur-md transition-all border ${
                explodedView
                  ? 'bg-amber-500/30 text-amber-300 border-amber-400/60'
                  : 'bg-black/60 text-slate-300 border-white/10 hover:bg-black/80'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>{explodedView ? 'COLLAPSE' : 'EXPLODED VIEW'}</span>
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

          {/* Dev debug overlay */}
          {isDev && hoveredPartId && (
            <div className="absolute bottom-14 left-3 bg-black/80 text-green-400 text-[9px] font-mono px-2 py-1 rounded border border-green-500/30 z-20">
              HOVER: {hoveredPartId}
            </div>
          )}

          {/* Bottom hint */}
          <div className="absolute bottom-3 left-3 right-3 lg:right-auto flex items-center space-x-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] text-slate-400 font-mono">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Click mesh or hotspot pin to inspect • Drag to rotate • Scroll to zoom • ←→ keys cycle parts</span>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="w-full lg:w-[440px] border-t lg:border-t-0 lg:border-l border-white/10 bg-[#0B0D14] flex flex-col overflow-y-auto max-h-[45vh] lg:max-h-full">

          {/* Model identity */}
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

            {/* Auth badge */}
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

          {/* Part selector chips */}
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
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
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

          {/* Part detail */}
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
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">FUNCTIONAL PURPOSE</span>
                  <p className="bg-white/5 p-2.5 rounded-lg border border-white/5 font-sans">
                    {currentPart.function}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">ENGINEERING SPECIFICATIONS</span>
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
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">MISSION FACTS</span>
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

              <div className="pt-3 border-t border-white/10">
                <a
                  href={currentPart.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-[10px] font-mono text-amber-400/80 hover:text-amber-300 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>NASA Source Document</span>
                </a>
              </div>
            </div>
          )}

          {/* Overview specs */}
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
