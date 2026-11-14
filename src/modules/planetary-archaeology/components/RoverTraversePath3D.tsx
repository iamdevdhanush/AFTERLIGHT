import React, { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { RoverTraverse, RoverWaypoint } from '../types/planetary';
import { GLOBE_RADIUS, latLonToVector3 } from '../services/planetaryMath';

interface RoverTraversePath3DProps {
  traverse: RoverTraverse;
  isSelectedRover: boolean;
  onSelectWaypoint?: (wp: RoverWaypoint) => void;
}

export const RoverTraversePath3D: React.FC<RoverTraversePath3DProps> = ({
  traverse,
  isSelectedRover,
  onSelectWaypoint,
}) => {
  const [hoveredWaypoint, setHoveredWaypoint] = useState<RoverWaypoint | null>(null);

  // 1. Convert all waypoints into 3D points on the globe surface
  const waypointPositions = useMemo(() => {
    return traverse.waypoints.map((wp) => ({
      waypoint: wp,
      position: latLonToVector3(wp.latitude, wp.longitude, GLOBE_RADIUS, 0.036),
    }));
  }, [traverse.waypoints]);

  // 2. Generate smooth 3D curved polyline along the planetary curvature
  const { lineGeometry, curvePoints } = useMemo(() => {
    if (waypointPositions.length < 2) {
      return { lineGeometry: null, curvePoints: [] };
    }

    const vectors = waypointPositions.map((p) => p.position);
    // CatmullRomCurve3 with centripetal curve type to prevent loop pinching
    const curve = new THREE.CatmullRomCurve3(vectors, false, 'centripetal', 0.5);
    const divisions = Math.max(24, waypointPositions.length * 12);
    const points = curve.getPoints(divisions);

    // Slightly project points back onto the sphere radius so interpolation hugs terrain perfectly
    const surfaceRadius = GLOBE_RADIUS + 0.036;
    const clampedPoints = points.map((p) => p.clone().normalize().multiplyScalar(surfaceRadius));

    const geom = new THREE.BufferGeometry().setFromPoints(clampedPoints);
    return { lineGeometry: geom, curvePoints: clampedPoints };
  }, [waypointPositions]);

  // Create Three.js Line object cleanly
  const lineObject = useMemo(() => {
    if (!lineGeometry) return null;
    const material = new THREE.LineBasicMaterial({
      color: traverse.color,
      linewidth: isSelectedRover ? 3 : 2,
      transparent: true,
      opacity: isSelectedRover ? 0.95 : 0.65,
      depthWrite: false,
    });
    return new THREE.Line(lineGeometry, material);
  }, [lineGeometry, traverse.color, isSelectedRover]);

  const glowObject = useMemo(() => {
    if (!lineGeometry || !isSelectedRover) return null;
    const material = new THREE.LineBasicMaterial({
      color: traverse.color,
      linewidth: 6,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    });
    return new THREE.Line(lineGeometry, material);
  }, [lineGeometry, traverse.color, isSelectedRover]);

  if (!lineGeometry || !lineObject) return null;

  return (
    <group>
      {/* 3D Polyline Ribbon */}
      <primitive object={lineObject} />

      {/* Traversal Glow Underlay (Thicker transparent line) */}
      {glowObject && <primitive object={glowObject} />}

      {/* Waypoint Milestone Spheres */}
      {waypointPositions.map(({ waypoint, position }, index) => {
        const isStart = index === 0;
        const isEnd = index === waypointPositions.length - 1;
        const isHovered = hoveredWaypoint?.id === waypoint.id;

        // Size: Start/End positions are slightly larger
        const size = isStart || isEnd ? 0.022 : waypoint.isKeyMilestone ? 0.016 : 0.012;

        return (
          <group key={waypoint.id} position={position}>
            {/* Click/Hover Target */}
            <mesh
              visible={false}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredWaypoint(waypoint);
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                setHoveredWaypoint(null);
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectWaypoint) onSelectWaypoint(waypoint);
              }}
            >
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshBasicMaterial />
            </mesh>

            {/* Visual Node Pin */}
            <mesh>
              <sphereGeometry args={[size, 12, 12]} />
              <meshBasicMaterial
                color={
                  isStart
                    ? '#10B981' // Green for landing
                    : isEnd
                    ? '#EF4444' // Red/Crimson for final resting position / active front
                    : isHovered
                    ? '#FFFFFF'
                    : traverse.color
                }
              />
            </mesh>

            {/* Waypoint Label Overlay */}
            {isHovered && (
              <Html distanceFactor={8} position={[0, 0.06, 0]} center style={{ pointerEvents: 'none' }}>
                <div className="bg-[#090D14]/90 backdrop-blur-md border border-[#2D3F59] p-2.5 rounded shadow-xl text-center select-none whitespace-nowrap z-50">
                  <div className="flex items-center justify-center space-x-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: isStart ? '#10B981' : isEnd ? '#EF4444' : traverse.color }}
                    />
                    <span className="font-mono text-[10px] text-white font-bold uppercase tracking-wider">
                      {isStart ? 'LANDING SITE' : isEnd ? 'FINAL KNOWN POSITION' : 'TRAVERSE STATION'}
                    </span>
                  </div>
                  <span className="font-sans text-xs text-stone-200 font-medium block mt-0.5">
                    {waypoint.name}
                  </span>
                  {waypoint.sol !== undefined && (
                    <span className="font-mono text-[9px] text-[#63F0C8] block mt-0.5">
                      SOL {waypoint.sol} · {waypoint.latitude.toFixed(4)}°, {waypoint.longitude.toFixed(4)}°
                    </span>
                  )}
                  {waypoint.significance && (
                    <span className="font-sans text-[10px] text-stone-400 block mt-1 max-w-xs text-left leading-snug">
                      {waypoint.significance}
                    </span>
                  )}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
};
