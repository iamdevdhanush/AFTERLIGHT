import React, { useState, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  X,
  Maximize2,
  RotateCw,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle,
  ExternalLink,
  ZoomIn,
  Camera,
  Cpu,
  ChevronRight,
} from 'lucide-react';

export interface HardwareInspectionProps {
  initialArtifactId?: string;
  onClose: () => void;
}

interface ComponentDetail {
  id: string;
  name: string;
  category: string;
  massOrSize: string;
  functionDesc: string;
  engineeringNote: string;
  historicalContext: string;
  explodedOffset: [number, number, number];
}

interface InspectionModelConfig {
  id: string;
  name: string;
  subtitle: string;
  planet: 'moon' | 'mars';
  isAuthenticNasaModel: boolean;
  modelTypeLabel: string;
  modelSourceCitation: string;
  disclaimer?: string;
  specs: { label: string; value: string }[];
  components: ComponentDetail[];
}

const HARDWARE_CONFIGS: Record<string, InspectionModelConfig> = {
  apollo11_eagle: {
    id: 'apollo11_eagle',
    name: 'Apollo 11 Lunar Module "Eagle"',
    subtitle: 'LM-5 Descent & Ascent Hardware Stack',
    planet: 'moon',
    isAuthenticNasaModel: true,
    modelTypeLabel: 'AUTHENTIC NASA 3D MODEL',
    modelSourceCitation: 'NASA 3D Resources / Apollo Lunar Module LM-5 (Official NASA Mesh)',
    specs: [
      { label: 'Total Launch Mass', value: '15,103 kg (33,297 lb)' },
      { label: 'Descent Stage Mass', value: '10,334 kg (fueled)' },
      { label: 'Ascent Stage Mass', value: '4,769 kg (fueled)' },
      { label: 'Landing Gear Span', value: '9.45 m diagonal across pads' },
      { label: 'Descent Engine Thrust', value: '1,050 to 10,125 lbf throttleable' },
      { label: 'Ascent Engine Thrust', value: '3,500 lbf constant hypergolic' },
      { label: 'Habitable Volume', value: '6.7 m³ (stand-up cockpit)' },
      { label: 'Current Lunar Status', value: 'Descent Stage in situ at Tranquility Base' },
    ],
    components: [
      {
        id: 'descent_stage',
        name: 'LM Descent Stage Chassis (LM-5)',
        category: 'Propulsion, Structure & Landing Platform',
        massOrSize: '10,334 kg (fueled) / 2,034 kg (dry)',
        functionDesc:
          'Octagonal aluminum-alloy skin construction with four thermal-shielded equipment quadrants. Housed 4 massive propellant tanks (Aerozine-50 and N2O4), helium pressurization spheres, and scientific payload stowage.',
        engineeringNote:
          'Insulated with 25 layers of aluminized Mylar and Kapton foil blankets to withstand extreme lunar vacuum thermal gradients between +120 °C and -130 °C.',
        historicalContext:
          'Served as the launch platform for the ascent stage when Neil Armstrong and Buzz Aldrin lifted off from the Moon. Remained at Tranquility Base as humanity’s first permanent planetary monument.',
        explodedOffset: [0, -0.6, 0],
      },
      {
        id: 'ascent_stage',
        name: 'Ascent Stage Crew Cabin',
        category: 'Pressurized Habitat & Orbital Rendezvous Stage',
        massOrSize: '4,769 kg (fueled) / 2,150 kg (dry)',
        functionDesc:
          'Egg-shaped pressurized aluminum alloy cockpit for two astronauts. Integrated the Apollo Guidance Computer (AGC), flight controls, docking tunnel, forward triangular egress hatch, and reaction control systems.',
        engineeringNote:
          'To save critical weight, the crew cabin had no pilot seats; Armstrong and Aldrin stood throughout descent and ascent, restrained by bungee cords anchored to the deck.',
        historicalContext:
          'Docked with Command Module Columbia in lunar orbit after 21 hours and 36 minutes on the surface. Jettisoned in lunar orbit; eventually crashed into an unknown lunar impact site.',
        explodedOffset: [0, 0.9, 0],
      },
      {
        id: 'landing_gear',
        name: 'Cantilever Struts & Footpads',
        category: 'Kinetic Energy Dissipation & Regolith Footing',
        massOrSize: '4 legs, 0.94 m pad diameter each',
        functionDesc:
          'Four folding landing gear assemblies made of extruded aluminum tubes containing crushable aluminum honeycomb cartridges that stroked up to 81 cm to dissipate touchdown kinetic energy.',
        engineeringNote:
          'Each of the forward and side footpads carried a 1.7-meter wire feeler probe that touched the regolith first, lighting the blue "LUNAR CONTACT" cockpit indicator light to command engine shutdown.',
        historicalContext:
          'Neil Armstrong reported "Contact light... OK, engine stop," confirming the touchdown on Mare Tranquillitatis on July 20, 1969.',
        explodedOffset: [0, -1.0, 0],
      },
      {
        id: 'dps_engine',
        name: 'Descent Propulsion System (DPS)',
        category: 'Deep-Throttling Gimbaled Rocket Engine',
        massOrSize: '1,050 to 10,125 lbf throttle range',
        functionDesc:
          'Gimbal-mounted rocket engine manufactured by TRW. Delivered deeply throttleable thrust using hypergolic Aerozine-50 and Nitrogen Tetroxide, requiring no electrical ignition system.',
        engineeringNote:
          'The first throttleable rocket engine ever flown in crewed spaceflight. Allowed Armstrong to hover, translate horizontally, and manually select a safe landing site away from West Crater boulders.',
        historicalContext:
          'Shut down with only approximately 25 seconds of usable descent propellant remaining in the tanks.',
        explodedOffset: [0, -0.8, 0],
      },
      {
        id: 's_band_antenna',
        name: 'S-Band Steerable High-Gain Antenna',
        category: 'Deep Space RF Telecommunications',
        massOrSize: '66 cm diameter parabolic dish',
        functionDesc:
          'Steerable dish antenna mounted on the upper front deck of the ascent stage. Transmitted live lunar surface television broadcasts, astronaut biometric telemetry, and voice to Earth.',
        engineeringNote:
          'Transmitted across 384,400 km directly to the 64-meter DSN dishes at Goldstone, California, and Honeysuckle Creek / Parkes Observatory in Australia.',
        historicalContext:
          'Beamed the iconic grainy black-and-white images of Neil Armstrong stepping onto the lunar surface to an estimated 650 million television viewers worldwide.',
        explodedOffset: [0.5, 1.3, 0.4],
      },
    ],
  },
  opportunity: {
    id: 'opportunity',
    name: 'Opportunity Rover (MER-B)',
    subtitle: 'Mars Exploration Rover Flight Hardware',
    planet: 'mars',
    isAuthenticNasaModel: false,
    modelTypeLabel: 'ARCHIVAL RECONSTRUCTION (SIMPLIFIED EDUCATIONAL MODEL)',
    modelSourceCitation:
      'Reconstructed from NASA JPL MER Blueprint Schematics & Engineering CAD Documentation',
    disclaimer:
      'This 3D model is an educational reconstruction based on official NASA JPL technical schematics. It is not an authentic NASA CAD export.',
    specs: [
      { label: 'Vehicle Mass', value: '185 kg (408 lb)' },
      { label: 'Dimensions', value: '1.5 m high × 2.3 m wide × 1.6 m long' },
      { label: 'Power Source', value: 'Triple-junction GaAs Solar Arrays (140 W peak)' },
      { label: 'Total Distance Traveled', value: '45.16 km (28.06 mi)' },
      { label: 'Design Lifetime', value: '90 Martian sols (~92.5 Earth days)' },
      { label: 'Actual Lifetime', value: '5,352 Martian sols (14 years, 138 days)' },
      { label: 'Top Traverse Speed', value: '5 cm/s (0.18 km/h / 0.1 mph)' },
      { label: 'Current Mars Status', value: 'Resting intact at Perseverance Valley' },
    ],
    components: [
      {
        id: 'pancam_mast',
        name: 'Pancam & Navcam Mast Assembly (PMA)',
        category: 'Multispectral Stereo Remote Sensing',
        massOrSize: '1.5 m periscope height above ground',
        functionDesc:
          'Twin high-resolution digital cameras with 8-position filter wheels spanning 400 to 1000 nm wavelengths, mounted alongside wide-angle stereoscopic navigation cameras.',
        engineeringNote:
          'Equipped with 360-degree azimuth and 180-degree elevation pointing capability to survey distant crater rims and determine mineralogical signatures from afar.',
        historicalContext:
          'Captured over 217,000 raw images of Mars, including the layered bedrock inside Eagle, Endurance, Victoria, and Endeavour craters.',
        explodedOffset: [0, 0.8, 0.4],
      },
      {
        id: 'rocker_bogie',
        name: 'Rocker-Bogie Mobility Chassis',
        category: 'Springless Six-Wheel Articulated Suspension',
        massOrSize: '6 aluminum wheels (26 cm diameter)',
        functionDesc:
          'Articulated suspension with two rocker arms joined by an internal differential crossbar. Keeps all six wheels in contact with the ground while traversing rocks larger than wheel diameter.',
        engineeringNote:
          'Each wheel featured individual cleats (grousers) machined into aluminum rims, with independent steering drive actuators on front and rear wheel pairs.',
        historicalContext:
          'Successfully climbed out of treacherous soft sand traps like Purgatory Dune (Sol 446–510) and navigated 32-degree slopes down crater walls.',
        explodedOffset: [0, -0.6, 0],
      },
      {
        id: 'solar_array',
        name: 'Triple-Junction GaAs Solar Array Wings',
        category: 'Photovoltaic Electrical Power',
        massOrSize: '1.3 m² surface area, ~140 W peak',
        functionDesc:
          'Gallium arsenide multi-junction solar cells mounted across the rover deck and folding side wings, charging two 8-Ah lithium-ion rechargeable batteries.',
        engineeringNote:
          'Expected to degrade within 90 sols due to settling atmospheric dust, but repeated Martian wind "cleaning events" (dust devils) stripped dust off the panels and renewed power for 14 years.',
        historicalContext:
          'Eventually silenced in June 2018 when a catastrophic planet-encircling dust storm blocked 99% of sunlight from reaching Meridiani Planum.',
        explodedOffset: [0, 0.4, -0.2],
      },
      {
        id: 'robotic_arm',
        name: 'Instrument Deployment Device (IDD Arm)',
        category: '5-Degree-of-Freedom In Situ Science Turret',
        massOrSize: '1.0 m reach with 4-instrument turret',
        functionDesc:
          'Articulated robotic arm carrying the Mössbauer Spectrometer, Alpha Particle X-Ray Spectrometer (APXS), Microscopic Imager (MI), and Rock Abrasion Tool (RAT).',
        engineeringNote:
          'The RAT diamond-tipped grinding bits ground into weathered rock varnish to expose pristine subsurface mineralogy for the spectrometers.',
        historicalContext:
          'Ground into the "Berry Bowl" rock outcrop to confirm the hematite spherules formed inside liquid groundwater.',
        explodedOffset: [0.6, 0.1, 0.7],
      },
      {
        id: 'high_gain_antenna',
        name: 'High-Gain Steerable Dish Antenna (HGA)',
        category: 'Direct-to-Earth X-Band Telecommunications',
        massOrSize: '28 cm steerable parabolic dish',
        functionDesc:
          'Gimbaled parabolic antenna transmitting directly to the antennas of the NASA Deep Space Network on Earth without needing an orbiter relay.',
        engineeringNote:
          'Operated at X-band (7 to 8 GHz) frequencies at data rates between 3.5 to 12 kbps, tracking Earth’s position across the Martian sky.',
        historicalContext:
          'Transmitted scientific discovery data directly to JPL engineers each afternoon following solar peak.',
        explodedOffset: [-0.4, 0.6, -0.4],
      },
    ],
  },
};

// ============================================================================
// 3D MODEL RENDERERS
// ============================================================================

const ApolloModelRenderer: React.FC<{
  exploded: boolean;
  selectedComponentId: string | null;
  onSelectComponent: (id: string) => void;
}> = ({ exploded, selectedComponentId, onSelectComponent }) => {
  const { scene } = useGLTF('/models/apollo_lunar_module.glb');
  const groupRef = useRef<THREE.Group>(null);

  // Clone scene with authentic materials
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material instanceof THREE.MeshStandardMaterial) {
          const mat = mesh.material;
          const name = mat.name.toLowerCase();
          if (
            name.includes('blinn1') ||
            name.includes('blinn9') ||
            name.includes('blinn10') ||
            (mat.color.r > 0.6 && mat.color.b < 0.2)
          ) {
            mat.metalness = 0.92;
            mat.roughness = 0.25;
            mat.color.set('#E5B342'); // Gold Kapton foil
          } else if (
            name.includes('blinn6') ||
            (mat.color.r < 0.1 && mat.color.g < 0.1 && mat.color.b < 0.1)
          ) {
            mat.metalness = 0.7;
            mat.roughness = 0.4;
            mat.color.set('#1a1a1c'); // Nickel heat foil
          } else {
            mat.metalness = 0.85;
            mat.roughness = 0.35;
            mat.color.set('#CBD5E1'); // Anodized aluminum
          }
        }
      }
    });
    return clone;
  }, [scene]);

  // Handle exploded displacement
  useFrame(() => {
    if (!groupRef.current) return;
    const targetY = exploded ? 0.3 : 0;
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      targetY,
      0.08
    );
  });

  return (
    <group ref={groupRef} position={[0, -0.4, 0]} scale={1.2}>
      <primitive
        object={clonedScene}
        onClick={(e: { stopPropagation: () => void }) => {
          e.stopPropagation();
          onSelectComponent('descent_stage');
        }}
      />

      {/* Exploded Visual Accent Rings & Anchors */}
      {exploded && (
        <group>
          {/* Ascent Stage separation indicator */}
          <mesh position={[0, 1.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.9, 0.93, 32]} />
            <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.6} />
          </mesh>
          {/* Descent Stage separation indicator */}
          <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.3, 1.33, 32]} />
            <meshBasicMaterial color="#eab308" side={THREE.DoubleSide} transparent opacity={0.6} />
          </mesh>
        </group>
      )}
    </group>
  );
};

const OpportunityModelRenderer: React.FC<{
  exploded: boolean;
  selectedComponentId: string | null;
  onSelectComponent: (id: string) => void;
}> = ({ exploded, selectedComponentId, onSelectComponent }) => {
  const mastRef = useRef<THREE.Group>(null);
  const dishRef = useRef<THREE.Group>(null);
  const armRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (dishRef.current) {
      dishRef.current.rotation.y = Math.sin(t * 0.3) * 0.15 + 0.2;
    }
    if (armRef.current && !exploded) {
      armRef.current.rotation.z = Math.sin(t * 0.5) * 0.05 - 0.2;
    }

    // Exploded offsets lerp
    const lerpFactor = 0.08;
    if (mastRef.current) {
      const targetY = exploded ? 1.6 : 1.1;
      mastRef.current.position.y = THREE.MathUtils.lerp(mastRef.current.position.y, targetY, lerpFactor);
    }
    if (dishRef.current) {
      const targetZ = exploded ? -0.8 : -0.5;
      dishRef.current.position.z = THREE.MathUtils.lerp(dishRef.current.position.z, targetZ, lerpFactor);
    }
    if (armRef.current) {
      const targetX = exploded ? 0.9 : 0.6;
      armRef.current.position.x = THREE.MathUtils.lerp(armRef.current.position.x, targetX, lerpFactor);
    }
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: '#D4AF37',
    metalness: 0.85,
    roughness: 0.35,
  });
  const darkChassisMat = new THREE.MeshStandardMaterial({
    color: '#2A2421',
    metalness: 0.6,
    roughness: 0.5,
  });
  const solarPanelMat = new THREE.MeshStandardMaterial({
    color: '#162238',
    metalness: 0.95,
    roughness: 0.15,
  });
  const wheelMat = new THREE.MeshStandardMaterial({
    color: '#69645E',
    metalness: 0.7,
    roughness: 0.4,
  });

  return (
    <group position={[0, -0.4, 0]} scale={1.1}>
      {/* Central Warm Electronics Body */}
      <group
        ref={bodyRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelectComponent('solar_array');
        }}
      >
        <mesh position={[0, 0.45, 0]} material={darkChassisMat} castShadow>
          <boxGeometry args={[1.2, 0.35, 1.5]} />
        </mesh>
        {/* Solar Panel Deck */}
        <mesh position={[0, 0.64, 0]} material={solarPanelMat}>
          <boxGeometry args={[1.5, 0.04, 1.8]} />
        </mesh>
        {/* Gold foil thermal skirts */}
        <mesh position={[0, 0.35, 0.76]} material={goldMat}>
          <boxGeometry args={[1.1, 0.25, 0.04]} />
        </mesh>
      </group>

      {/* Pancam Mast */}
      <group
        ref={mastRef}
        position={[0, 1.1, 0.4]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectComponent('pancam_mast');
        }}
      >
        <mesh material={darkChassisMat}>
          <cylinderGeometry args={[0.04, 0.05, 0.9, 16]} />
        </mesh>
        {/* Pancam stereo head */}
        <mesh position={[0, 0.45, 0]} material={wheelMat}>
          <boxGeometry args={[0.26, 0.12, 0.15]} />
        </mesh>
        <mesh position={[-0.08, 0.45, 0.08]} rotation={[Math.PI / 2, 0, 0]} material={goldMat}>
          <cylinderGeometry args={[0.03, 0.03, 0.05, 16]} />
        </mesh>
        <mesh position={[0.08, 0.45, 0.08]} rotation={[Math.PI / 2, 0, 0]} material={goldMat}>
          <cylinderGeometry args={[0.03, 0.03, 0.05, 16]} />
        </mesh>
      </group>

      {/* High-Gain Parabolic Dish */}
      <group
        ref={dishRef}
        position={[-0.35, 0.75, -0.5]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectComponent('high_gain_antenna');
        }}
      >
        <mesh material={wheelMat} rotation={[-0.5, 0.3, 0]}>
          <cylinderGeometry args={[0.22, 0.05, 0.08, 24]} />
        </mesh>
        <mesh position={[0, 0.08, 0]} material={goldMat}>
          <cylinderGeometry args={[0.015, 0.015, 0.14, 8]} />
        </mesh>
      </group>

      {/* Robotic Arm IDD */}
      <group
        ref={armRef}
        position={[0.6, 0.45, 0.6]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectComponent('robotic_arm');
        }}
      >
        <mesh position={[0, -0.15, 0]} material={darkChassisMat} rotation={[0, 0, -0.4]}>
          <cylinderGeometry args={[0.03, 0.03, 0.4, 12]} />
        </mesh>
        {/* Science Turret */}
        <mesh position={[0.1, -0.32, 0]} material={wheelMat}>
          <cylinderGeometry args={[0.08, 0.08, 0.08, 16]} />
        </mesh>
      </group>

      {/* Six Rocker-Bogie Wheels */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          onSelectComponent('rocker_bogie');
        }}
      >
        {[-0.75, 0.75].map((x, xi) =>
          [-0.6, 0, 0.6].map((z, zi) => (
            <group key={`${xi}-${zi}`} position={[x, 0.15, z]}>
              <mesh material={wheelMat} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.16, 0.16, 0.12, 20]} />
              </mesh>
              {/* Wheel strut */}
              <mesh position={[-x * 0.15, 0.15, 0]} material={darkChassisMat}>
                <boxGeometry args={[0.04, 0.25, 0.04]} />
              </mesh>
            </group>
          ))
        )}
      </group>
    </group>
  );
};

// ============================================================================
// MAIN COMPONENT: 3D HARDWARE INSPECTION STUDIO
// ============================================================================

export const HardwareInspectionStudio: React.FC<HardwareInspectionProps> = ({
  initialArtifactId = 'apollo11_eagle',
  onClose,
}) => {
  const [selectedArtifactId, setSelectedArtifactId] = useState<string>(
    initialArtifactId in HARDWARE_CONFIGS ? initialArtifactId : 'apollo11_eagle'
  );
  const [explodedView, setExplodedView] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

  const activeConfig = HARDWARE_CONFIGS[selectedArtifactId] || HARDWARE_CONFIGS.apollo11_eagle;

  const currentComponent = useMemo(() => {
    if (!selectedComponentId) return activeConfig.components[0];
    return (
      activeConfig.components.find((c) => c.id === selectedComponentId) ||
      activeConfig.components[0]
    );
  }, [selectedComponentId, activeConfig]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#08090D] text-slate-100 select-none overflow-hidden animate-fadeIn">
      {/* Studio Header Bar */}
      <header className="h-16 px-6 border-b border-white/10 bg-slate-950/80 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-amber-400" />
            <span className="font-mono text-xs tracking-[0.2em] uppercase text-white font-semibold">
              AFTERLIGHT 3D HARDWARE INSPECTION STUDIO
            </span>
          </div>

          <span className="hidden md:inline-block text-white/30 text-xs">|</span>

          {/* Model Switcher Tabs */}
          <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10">
            {Object.values(HARDWARE_CONFIGS).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedArtifactId(item.id);
                  setSelectedComponentId(null);
                  setExplodedView(false);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-mono tracking-wider uppercase transition-all duration-200 ${
                  selectedArtifactId === item.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.planet === 'moon' ? 'MOON: ' : 'MARS: '}
                {item.name.split(' ')[0]} {item.name.split(' ')[1]}
              </button>
            ))}
          </div>
        </div>

        {/* Authenticity Badge & Close */}
        <div className="flex items-center space-x-4">
          {activeConfig.isAuthenticNasaModel ? (
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold tracking-wider">{activeConfig.modelTypeLabel}</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-950/70 border border-amber-500/40 text-amber-300 text-xs font-mono">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="font-semibold tracking-wider">{activeConfig.modelTypeLabel}</span>
            </div>
          )}

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
            title="Exit Studio (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Studio Work Area */}
      <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
        {/* Left 3D Viewport */}
        <div className="flex-1 relative h-[50vh] lg:h-full bg-gradient-to-b from-[#0B0D14] via-[#07080B] to-[#040507]">
          {/* 3D Canvas */}
          <Canvas
            camera={{ position: [2.5, 1.8, 3.2], fov: 42 }}
            className="w-full h-full cursor-grab active:cursor-grabbing"
            shadows
          >
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
              {selectedArtifactId === 'apollo11_eagle' ? (
                <ApolloModelRenderer
                  exploded={explodedView}
                  selectedComponentId={selectedComponentId}
                  onSelectComponent={setSelectedComponentId}
                />
              ) : (
                <OpportunityModelRenderer
                  exploded={explodedView}
                  selectedComponentId={selectedComponentId}
                  onSelectComponent={setSelectedComponentId}
                />
              )}
            </Suspense>

            <OrbitControls
              enablePan={true}
              enableZoom={true}
              minDistance={1.2}
              maxDistance={7.5}
              autoRotate={autoRotate && !explodedView}
              autoRotateSpeed={1.0}
              makeDefault
            />

            {/* Subtle Grid Floor */}
            <gridHelper args={[8, 16, '#334155', '#1e293b']} position={[0, -0.6, 0]} />
          </Canvas>

          {/* Viewport Floating Controls */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
            <button
              onClick={() => setExplodedView(!explodedView)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider uppercase backdrop-blur-md transition-all border ${
                explodedView
                  ? 'bg-amber-500/30 text-amber-300 border-amber-400/60 shadow-lg'
                  : 'bg-black/60 text-slate-300 border-white/10 hover:bg-black/80'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{explodedView ? 'COLLAPSE MODEL' : 'EXPLODED VIEW'}</span>
            </button>

            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider uppercase backdrop-blur-md transition-all border ${
                autoRotate
                  ? 'bg-white/20 text-white border-white/30'
                  : 'bg-black/60 text-slate-400 border-white/10 hover:bg-black/80'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>TURNTABLE {autoRotate ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Interactive Inspection Hint Pill */}
          <div className="absolute bottom-4 left-4 right-4 lg:right-auto flex items-center space-x-2 bg-slate-950/80 backdrop-blur-md px-3.5 py-2 rounded-lg border border-white/10 text-xs text-slate-400 font-mono">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Click or drag to rotate 360° • Scroll to zoom • Select subsystems from the right panel
            </span>
          </div>
        </div>

        {/* Right Information & Subsystems Drawer */}
        <div className="w-full lg:w-[460px] border-t lg:border-t-0 lg:border-l border-white/10 bg-[#0B0D14] flex flex-col overflow-y-auto max-h-[50vh] lg:max-h-full">
          {/* Header Info */}
          <div className="p-6 border-b border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono tracking-[0.2em] text-amber-400 uppercase">
                {activeConfig.planet.toUpperCase()} ARCHIVAL ARTIFACT
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {activeConfig.components.length} SUB-ASSEMBLIES
              </span>
            </div>

            <h2 className="text-2xl font-serif text-white tracking-wide">{activeConfig.name}</h2>
            <p className="text-xs text-slate-400 font-mono">{activeConfig.subtitle}</p>

            {/* Authenticity Disclaimer Box */}
            <div
              className={`p-3 rounded-lg border text-xs font-mono space-y-1.5 ${
                activeConfig.isAuthenticNasaModel
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                  : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
              }`}
            >
              <div className="flex items-center space-x-2 font-semibold">
                {activeConfig.isAuthenticNasaModel ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span>{activeConfig.modelTypeLabel}</span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                {activeConfig.modelSourceCitation}
              </p>
              {activeConfig.disclaimer && (
                <p className="text-[10px] text-amber-300/80 italic pt-1 border-t border-amber-500/20">
                  {activeConfig.disclaimer}
                </p>
              )}
            </div>
          </div>

          {/* Subsystem Component Selector Chips */}
          <div className="p-4 border-b border-white/10 bg-black/20">
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-400 block mb-2">
              SELECT COMPONENT TO INSPECT
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {activeConfig.components.map((comp) => {
                const isSelected = comp.id === currentComponent.id;
                return (
                  <button
                    key={comp.id}
                    onClick={() => {
                      setSelectedComponentId(comp.id);
                      setAutoRotate(false);
                    }}
                    className={`text-left px-2.5 py-2 rounded text-xs font-mono transition-all truncate flex items-center justify-between border ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                        : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <span className="truncate">{comp.name.split(' (')[0]}</span>
                    {isSelected && <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Subsystem Detail Inspector */}
          <div className="p-6 space-y-5 flex-1">
            <div className="space-y-1">
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                {currentComponent.category}
              </span>
              <h3 className="text-lg font-serif text-white font-medium">
                {currentComponent.name}
              </h3>
              <div className="text-xs font-mono text-amber-400/90 pt-0.5">
                DIMENSIONS / MASS: {currentComponent.massOrSize}
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                  FUNCTIONAL PURPOSE
                </span>
                <p className="bg-white/5 p-3 rounded-lg border border-white/5 font-sans">
                  {currentComponent.functionDesc}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                  ENGINEERING SPECIFICATION
                </span>
                <p className="bg-amber-500/5 p-3 rounded-lg border border-amber-500/10 text-amber-200/90 font-mono text-[11px]">
                  {currentComponent.engineeringNote}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                  HISTORICAL CONTEXT
                </span>
                <p className="bg-white/5 p-3 rounded-lg border border-white/5 font-sans text-slate-300">
                  {currentComponent.historicalContext}
                </p>
              </div>
            </div>

            {/* Quick Specs Grid */}
            <div className="pt-4 border-t border-white/10 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400 block">
                MISSION SPECIFICATIONS
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {activeConfig.specs.map((spec, i) => (
                  <div key={i} className="bg-white/5 p-2 rounded border border-white/5 space-y-0.5">
                    <div className="text-[10px] text-slate-400 uppercase truncate">
                      {spec.label}
                    </div>
                    <div className="text-white font-medium text-[11px] truncate">{spec.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
