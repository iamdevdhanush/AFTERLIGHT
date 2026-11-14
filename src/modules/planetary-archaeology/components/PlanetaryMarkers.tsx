import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { PlanetarySite, HardwareCategory } from '../types/planetary';
import { GLOBE_RADIUS, latLonToVector3 } from '../services/planetaryMath';

interface PlanetaryMarkersProps {
  sites: PlanetarySite[];
  selectedSiteId: string | null;
  hoveredSiteId: string | null;
  onHoverSite: (id: string | null) => void;
  onSelectSite: (site: PlanetarySite) => void;
  spinGroupRef: React.RefObject<THREE.Group>;
}

// Category visual styling & color accents
export const CATEGORY_STYLES: Record<
  HardwareCategory,
  { label: string; primary: string; secondary: string; glyph: string }
> = {
  rover: {
    label: 'Rover',
    primary: '#38BDF8', // Cyan / Light Blue
    secondary: '#0284C7',
    glyph: '⛟',
  },
  lander: {
    label: 'Lander',
    primary: '#F59E0B', // Amber / Gold
    secondary: '#B45309',
    glyph: '▲',
  },
  descent_stage: {
    label: 'Descent Stage',
    primary: '#F97316', // Warm Copper
    secondary: '#C2410C',
    glyph: '⬡',
  },
  scientific_instrument: {
    label: 'Science Instrument',
    primary: '#10B981', // Emerald
    secondary: '#047857',
    glyph: '◆',
  },
  alsep: {
    label: 'ALSEP Station',
    primary: '#A855F7', // Violet
    secondary: '#7E22CE',
    glyph: '⬢',
  },
  discarded_component: {
    label: 'Discarded Hardware',
    primary: '#CBD5E1', // Slate / White
    secondary: '#64748B',
    glyph: '△',
  },
  impact_site: {
    label: 'Impact Site',
    primary: '#EF4444', // Vermilion / Red
    secondary: '#B91C1C',
    glyph: '◎',
  },
};



const SingleSiteMarker: React.FC<{
  site: PlanetarySite;
  isSelected: boolean;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onSelect: (site: PlanetarySite) => void;
}> = ({ site, isSelected, isHovered, onHover, onSelect }) => {
  const pulseRingRef = useRef<THREE.Mesh>(null);
  const catStyle = CATEGORY_STYLES[site.category] || CATEGORY_STYLES.lander;

  // Confidence-based gold tones
  const beaconGold =
    site.locationConfidence === 'confirmed'
      ? '#F59E0B' // Bright radiant amber gold
      : site.locationConfidence === 'approximate'
      ? '#D97706' // Warm ochre gold
      : '#B45309'; // Muted dark amber

  const stalkHeight = isSelected ? 0.065 : 0.042;
  const pinHeadColor = isSelected ? '#FEF08A' : isHovered ? '#FDE047' : '#F59E0B';

  // 3D Cartesian coordinates on the globe
  const position = useMemo(() => {
    return latLonToVector3(site.latitude, site.longitude, GLOBE_RADIUS, 0.038);
  }, [site.latitude, site.longitude]);

  // Orientation vector pointing straight up normal from planet center
  const quaternion = useMemo(() => {
    const normal = position.clone().normalize();
    const up = new THREE.Vector3(0, 1, 0);
    return new THREE.Quaternion().setFromUnitVectors(up, normal);
  }, [position]);

  // Pulse animation for the surface reticle ring
  useFrame(({ clock }) => {
    if (pulseRingRef.current) {
      const t = clock.getElapsedTime();
      const speed = isSelected ? 3.0 : isHovered ? 2.4 : 1.3;
      const s = 1.0 + Math.sin(t * speed) * (isSelected ? 0.28 : isHovered ? 0.2 : 0.12);
      pulseRingRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group position={position} quaternion={quaternion}>
      {/* Invisible larger hit target for responsive mouse & touch selection */}
      <mesh
        visible={false}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(site.id);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onHover(null);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(site);
        }}
      >
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshBasicMaterial />
      </mesh>

      {/* Surface concentric target reticle — NASA Trek beacon ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.02, 0.032, 32]} />
        <meshBasicMaterial
          color={beaconGold}
          transparent
          opacity={isSelected ? 0.95 : isHovered ? 0.85 : 0.65}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Inner surface target disc / bullseye */}
      <mesh position={[0, 0.001, 0]}>
        <cylinderGeometry args={[0.007, 0.007, 0.002, 16]} />
        <meshBasicMaterial color={beaconGold} />
      </mesh>

      {/* Pulsing outer aura ring */}
      <mesh ref={pulseRingRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.032, 0.044, 32]} />
        <meshBasicMaterial
          color={beaconGold}
          transparent
          opacity={isSelected ? 0.7 : isHovered ? 0.5 : 0.25}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Subtle vertical beacon stalk (visible as pin when viewed on planetary limb) */}
      <mesh position={[0, stalkHeight / 2, 0]}>
        <cylinderGeometry args={[0.0016, 0.0016, stalkHeight, 8]} />
        <meshBasicMaterial color={beaconGold} />
      </mesh>

      {/* Glowing beacon pin head */}
      <mesh position={[0, stalkHeight, 0]}>
        <sphereGeometry args={[0.008, 12, 12]} />
        <meshBasicMaterial color={pinHeadColor} />
      </mesh>

      {/* HTML Micro-HUD Overlay (Always faces camera) */}
      {(isHovered || isSelected) && (
        <Html
          position={[0, 0.18, 0]}
          center
          distanceFactor={9}
          style={{ pointerEvents: 'none' }}
        >
          <div className="flex flex-col items-center select-none transform -translate-y-2 whitespace-nowrap z-50">
            <div
              className={`px-3 py-2 rounded bg-[#080B10]/95 backdrop-blur-md border ${
                isSelected
                  ? 'border-[#F59E0B] shadow-xl shadow-[#F59E0B]/25'
                  : 'border-[#475569] shadow-lg'
              } text-center`}
            >
              <div className="flex items-center justify-center space-x-1.5">
                <span
                  className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold uppercase tracking-wider"
                  style={{ backgroundColor: `${catStyle.primary}25`, color: catStyle.primary }}
                >
                  {catStyle.label}
                </span>
                <span className="font-mono text-[11px] text-white font-semibold">
                  {site.name}
                </span>
              </div>

              <div className="flex items-center justify-center space-x-2 mt-1 font-mono text-[9px] text-stone-400">
                <span>{site.mission} ({site.year})</span>
                <span>•</span>
                <span>{site.latitudeFormatted}, {site.longitudeFormatted}</span>
                <span>•</span>
                <span
                  className={
                    site.locationConfidence === 'confirmed'
                      ? 'text-amber-400 font-bold'
                      : site.locationConfidence === 'approximate'
                      ? 'text-yellow-500 font-bold'
                      : 'text-orange-400 font-bold'
                  }
                >
                  {site.locationConfidence.toUpperCase()}
                </span>
              </div>
            </div>
            {/* Downward Pointer */}
            <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#080B10]/95" />
          </div>
        </Html>
      )}
    </group>
  );
};

export const PlanetaryMarkers: React.FC<PlanetaryMarkersProps> = ({
  sites,
  selectedSiteId,
  hoveredSiteId,
  onHoverSite,
  onSelectSite,
}) => {
  return (
    <group>
      {sites.map((site) => (
        <SingleSiteMarker
          key={site.id}
          site={site}
          isSelected={site.id === selectedSiteId}
          isHovered={site.id === hoveredSiteId}
          onHover={onHoverSite}
          onSelect={onSelectSite}
        />
      ))}
    </group>
  );
};
