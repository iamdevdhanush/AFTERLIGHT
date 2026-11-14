import React, { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, ContactShadows, Html } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import {
  RotateCcw,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Camera,
  Layers,
} from 'lucide-react';
import { useExperienceStore } from '../../store/useExperienceStore';
import { ARTIFACTS } from '../../data/artifacts';
import { NASA_MODELS_MANIFEST } from '../../data/modelsManifest';
import { guideVoiceEngine } from '../../audio/GuideVoiceEngine';

interface Artifact3DStageProps {
  artifactId: string;
  onSwitchToPhoto?: () => void;
}

/**
 * Universal NASA GLB Model Renderer with automatic bounding normalization,
 * ground placement, and studio PBR materials.
 */
interface ModelRendererProps {
  modelPath: string;
  artifactId: string;
  isFloating?: boolean;
}

const ModelRenderer: React.FC<ModelRendererProps> = ({ modelPath, artifactId, isFloating }) => {
  const { scene } = useGLTF(modelPath, '/draco/');

  const cloned = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    // Normalized museum display height/width
    const targetSize = artifactId === 'voyager1' ? 3.6 : 3.2;
    const s = maxDim > 0 ? targetSize / maxDim : 1;

    // Center horizontally
    clone.position.x = -center.x * s;
    if (isFloating) {
      // Center vertically for space probes
      clone.position.y = -center.y * s;
    } else {
      // Sit flush on the studio contact shadow plane
      clone.position.y = -box.min.y * s;
    }
    clone.position.z = -center.z * s;
    clone.scale.setScalar(s);

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => {
              mat.side = THREE.DoubleSide;
            });
          } else {
            mesh.material.side = THREE.DoubleSide;
          }
        }
      }
    });

    return clone;
  }, [scene, artifactId, isFloating]);

  return <primitive object={cloned} />;
};

/**
 * Camera helper to handle programmatic zoom buttons
 */
const CameraController: React.FC<{
  zoomAction: 'in' | 'out' | null;
  onZoomDone: () => void;
}> = ({ zoomAction, onZoomDone }) => {
  const { camera } = useThree();

  useEffect(() => {
    if (!zoomAction) return;
    const factor = zoomAction === 'in' ? 0.8 : 1.25;
    camera.position.multiplyScalar(factor);
    camera.updateProjectionMatrix();
    onZoomDone();
  }, [zoomAction, camera, onZoomDone]);

  return null;
};

/**
 * Isolated museum hardware 3D inspection turntable for verified NASA models.
 * Features studio three-point lighting against Obsidian (#111416), OrbitControls,
 * camera reset, zoom buttons, fullscreen modal, and component synchronization.
 */
export const Artifact3DStage: React.FC<Artifact3DStageProps> = ({ artifactId, onSwitchToPhoto }) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomAction, setZoomAction] = useState<'in' | 'out' | null>(null);

  const manifest = NASA_MODELS_MANIFEST[artifactId];
  const artifact = ARTIFACTS[artifactId];

  const selectComponent = useExperienceStore((s) => s.selectComponent);
  const selectedComponentId = useExperienceStore((s) => s.selectedComponentId);

  // Default camera configurations tailored for each hardware scale
  const defaultCamConfig = useMemo(() => {
    if (manifest?.cameraConfig) {
      return manifest.cameraConfig;
    }
    return {
      position: [4.8, 3.2, 5.8] as [number, number, number],
      target: [0, 0.8, 0] as [number, number, number],
      minDistance: 2.0,
      maxDistance: 15,
    };
  }, [manifest]);

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const handleComponentSelect = (compId: string) => {
    if (selectedComponentId === compId) {
      selectComponent(null);
    } else {
      selectComponent(compId);
      const comp = artifact?.components.find((c) => c.id === compId);
      if (comp) {
        const script = comp.voiceScript || comp.guideExplanation || comp.description;
        if (script) {
          guideVoiceEngine.play(script, true);
        }
      }
    }
  };

  // If model is missing in official NASA repository, render curatorial notice
  if (!manifest || !manifest.hasOfficial3D || !manifest.modelPath) {
    return (
      <div className="relative w-full h-full min-h-[360px] bg-obsidian border border-meteorite p-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-surface-raised border border-meteorite flex items-center justify-center text-amber-accent">
          <AlertCircle className="w-6 h-6 text-[#DEB275]" />
        </div>
        <div className="space-y-1.5 max-w-md">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-stone-muted block">
            OFFICIAL NASA ASSET TELEMETRY
          </span>
          <h3 className="font-serif text-lg text-bone">
            3D Hardware Geometry Unavailable
          </h3>
          <p className="font-sans text-xs text-stone-secondary leading-relaxed font-light">
            {manifest?.unavailableReason ||
              'Official NASA 3D engineering models for this mission hardware are not available in the NASA 3D Resources archive. To preserve archival authenticity, AFTERLIGHT displays verified NASA photography.'}
          </p>
        </div>
        {onSwitchToPhoto && (
          <button
            type="button"
            onClick={onSwitchToPhoto}
            className="inline-flex items-center space-x-2 px-4 py-2 border border-meteorite hover:border-[#DEB275] bg-surface text-bone font-mono text-xs tracking-wider uppercase transition-colors"
          >
            <Camera className="w-3.5 h-3.5 text-[#DEB275]" />
            <span>VIEW NASA ARCHIVAL PHOTOGRAPHY</span>
          </button>
        )}
      </div>
    );
  }

  const stageContent = (
    <div
      className={`relative w-full h-full bg-obsidian overflow-hidden select-none ${
        isFullscreen ? 'fixed inset-0 z-50 p-6 md:p-12 flex flex-col' : 'min-h-[360px]'
      }`}
    >
      {/* 3D WebGL Canvas */}
      <div className="relative w-full h-full flex-1">
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{
            position: defaultCamConfig.position,
            fov: 38,
            near: 0.1,
            far: 100,
          }}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.1,
          }}
        >
          <color attach="background" args={['#111416']} />

          {/* Three-Point Museum Studio Lighting */}
          <ambientLight intensity={0.45} color="#EEE7D9" />
          <directionalLight
            position={[8, 12, 8]}
            intensity={2.8}
            color="#FFF6E8"
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-near={0.5}
            shadow-camera-far={25}
            shadow-bias={-0.0001}
          />
          <directionalLight position={[-8, 4, -6]} intensity={0.8} color="#85877F" />
          <directionalLight position={[0, -4, 6]} intensity={0.4} color="#DEB275" />

          {/* Studio floor contact shadow for grounded hardware */}
          {artifactId !== 'voyager1' && (
            <ContactShadows
              position={[0, -0.01, 0]}
              opacity={0.65}
              scale={12}
              blur={1.8}
              far={4}
              color="#000000"
            />
          )}

          {/* Studio Floor Reference Grid Ring */}
          {artifactId !== 'voyager1' && (
            <group position={[0, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[2.8, 2.82, 64]} />
              <meshBasicMaterial color="#343A39" transparent opacity={0.4} />
            </group>
          )}

          <Suspense
            fallback={
              <Html center>
                <div className="flex flex-col items-center space-y-2 bg-obsidian/90 border border-meteorite p-4 rounded-sm">
                  <div className="w-5 h-5 border-2 border-stone-muted border-t-[#DEB275] rounded-full animate-spin" />
                  <span className="font-mono text-[10px] tracking-[0.16em] text-stone-secondary uppercase">
                    LOADING NASA 3D GEOMETRY...
                  </span>
                </div>
              </Html>
            }
          >
            <ModelRenderer
              modelPath={manifest.modelPath}
              artifactId={artifactId}
              isFloating={artifactId === 'voyager1'}
            />
          </Suspense>

          <OrbitControls
            ref={controlsRef}
            target={defaultCamConfig.target}
            enablePan={true}
            enableDamping={true}
            dampingFactor={0.06}
            minDistance={defaultCamConfig.minDistance}
            maxDistance={defaultCamConfig.maxDistance}
            autoRotate={autoRotate}
            autoRotateSpeed={0.55}
            makeDefault
          />

          <CameraController
            zoomAction={zoomAction}
            onZoomDone={() => setZoomAction(null)}
          />
        </Canvas>

        {/* Top-Right Interactive Camera & Viewport HUD */}
        <div className="absolute top-3 right-3 z-10 flex items-center space-x-1.5 bg-obsidian/85 backdrop-blur-sm border border-meteorite/80 p-1 rounded-sm shadow-lg">
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            title={autoRotate ? 'Pause Turntable Rotation' : 'Start Turntable Rotation'}
            aria-label={autoRotate ? 'Pause Turntable Rotation' : 'Start Turntable Rotation'}
            className="p-1.5 text-stone-secondary hover:text-bone hover:bg-surface rounded-sm transition-colors"
          >
            {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setZoomAction('in')}
            title="Zoom In"
            aria-label="Zoom In"
            className="p-1.5 text-stone-secondary hover:text-bone hover:bg-surface rounded-sm transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setZoomAction('out')}
            title="Zoom Out"
            aria-label="Zoom Out"
            className="p-1.5 text-stone-secondary hover:text-bone hover:bg-surface rounded-sm transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleResetCamera}
            title="Reset Camera Orientation"
            aria-label="Reset Camera Orientation"
            className="p-1.5 text-stone-secondary hover:text-bone hover:bg-surface rounded-sm transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-3.5 bg-meteorite mx-0.5" />

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen 3D View' : 'Fullscreen 3D Inspection'}
            aria-label={isFullscreen ? 'Exit Fullscreen 3D View' : 'Fullscreen 3D Inspection'}
            className="p-1.5 text-stone-secondary hover:text-bone hover:bg-surface rounded-sm transition-colors"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 text-[#DEB275]" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Bottom-Left Navigation Prompt */}
        <div className="pointer-events-none absolute bottom-3 left-4 z-10 font-mono text-[9px] tracking-[0.18em] text-stone-muted uppercase bg-obsidian/60 px-2 py-0.5 backdrop-blur-xs border border-meteorite/40">
          DRAG TO ORBIT · SCROLL TO ZOOM · SHIFT+DRAG TO PAN
        </div>

        {/* Bottom-Right Official NASA Model Telemetry Pill */}
        <div className="absolute bottom-3 right-3 z-10 hidden sm:flex items-center space-x-2 bg-obsidian/90 backdrop-blur-sm border border-meteorite/80 px-2.5 py-1 text-[9px] font-mono tracking-wider rounded-sm text-stone-secondary">
          <ShieldCheck className="w-3 h-3 text-[#DEB275]" />
          <span className="text-bone">{manifest.fileSizeFormatted}</span>
          <span className="text-meteorite">·</span>
          <a
            href={manifest.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#DEB275] transition-colors inline-flex items-center space-x-1"
          >
            <span>NASA 3D RESOURCES</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>

      {/* Component Inspection Pills Strip (Directly below canvas) */}
      {artifact && artifact.components && artifact.components.length > 0 && (
        <div className="bg-surface-raised border-t border-meteorite px-4 py-2.5 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center space-x-2 shrink-0">
            <Layers className="w-3.5 h-3.5 text-[#DEB275]" />
            <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-stone-muted">
              INSPECT COMPONENT:
            </span>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {artifact.components.map((comp) => {
              const isSelected = selectedComponentId === comp.id;
              return (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => handleComponentSelect(comp.id)}
                  className={`px-2.5 py-1 text-[10px] font-mono tracking-wider uppercase border transition-colors rounded-sm ${
                    isSelected
                      ? 'border-[#DEB275] bg-[#DEB275]/15 text-[#DEB275] font-semibold'
                      : 'border-meteorite text-stone-secondary hover:text-bone hover:bg-surface'
                  }`}
                >
                  {comp.name.split(' ')[0]} {comp.name.split(' ')[1] || ''}
                </button>
              );
            })}
            {selectedComponentId && (
              <button
                type="button"
                onClick={() => selectComponent(null)}
                className="text-[9px] font-mono tracking-wider text-stone-muted hover:text-[#DEB275] px-1 uppercase"
              >
                CLEAR
              </button>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Close button */}
      {isFullscreen && (
        <button
          type="button"
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 right-4 z-20 px-3 py-1.5 bg-surface border border-meteorite text-bone font-mono text-xs uppercase tracking-wider hover:border-[#DEB275] transition-colors"
        >
          CLOSE FULLSCREEN [ESC]
        </button>
      )}
    </div>
  );

  return stageContent;
};
