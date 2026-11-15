import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  latLonToVector3,
  vector3ToLatLon,
  calculateGreatCircleDistanceKm,
  getRegionalInspectionCamera,
  formatCoordinates,
  GLOBE_RADIUS,
  PLANETARY_RADII_KM,
} from '../modules/planetary-archaeology/services/planetaryMath';

describe('planetaryMath Scientific Functions', () => {
  it('converts Equator & Prime Meridian (0°, 0°) to Cartesian position on standard sphere', () => {
    const vec = latLonToVector3(0, 0, GLOBE_RADIUS, 0);
    // Lat 0, Lon 0:
    // phi = 90° (sin=1, cos=0), theta = 180° (sin=0, cos=-1)
    // x = - r * 1 * (-1) = r
    // y = r * 0 = 0
    // z = r * 1 * 0 = 0
    expect(vec.x).toBeCloseTo(GLOBE_RADIUS, 4);
    expect(vec.y).toBeCloseTo(0, 4);
    expect(vec.z).toBeCloseTo(0, 4);
  });

  it('converts North Pole (+90°, 0°) correctly', () => {
    const vec = latLonToVector3(90, 0, GLOBE_RADIUS, 0);
    // North pole is at y = r
    expect(vec.y).toBeCloseTo(GLOBE_RADIUS, 4);
    expect(vec.x).toBeCloseTo(0, 4);
    expect(vec.z).toBeCloseTo(0, 4);
  });

  it('converts South Pole (-90°, 0°) correctly', () => {
    const vec = latLonToVector3(-90, 0, GLOBE_RADIUS, 0);
    // South pole is at y = -r
    expect(vec.y).toBeCloseTo(-GLOBE_RADIUS, 4);
    expect(vec.x).toBeCloseTo(0, 4);
    expect(vec.z).toBeCloseTo(0, 4);
  });

  it('handles 0-360° longitude normalization identically to -180..+180°', () => {
    const vec1 = latLonToVector3(20, 350, GLOBE_RADIUS, 0);
    const vec2 = latLonToVector3(20, -10, GLOBE_RADIUS, 0);
    expect(vec1.x).toBeCloseTo(vec2.x, 4);
    expect(vec1.y).toBeCloseTo(vec2.y, 4);
    expect(vec1.z).toBeCloseTo(vec2.z, 4);
  });

  it('round-trips lat/lon to Vector3 and back to lat/lon', () => {
    const testLat = 24.5;
    const testLon = 45.2;
    const vec = latLonToVector3(testLat, testLon, GLOBE_RADIUS, 0);
    const coords = vector3ToLatLon(vec);
    expect(coords.lat).toBeCloseTo(testLat, 1);
    expect(coords.lon).toBeCloseTo(testLon, 1);
  });

  it('computes accurate surface great-circle distance (Haversine formula)', () => {
    // Distance from North Pole to South Pole on Moon should be pi * R
    const distMoon = calculateGreatCircleDistanceKm(90, 0, -90, 0, 'moon');
    const expectedMoon = Math.PI * PLANETARY_RADII_KM.moon;
    expect(distMoon).toBeCloseTo(expectedMoon, 1);

    // Distance on Mars across 90 degrees longitude on equator
    const distMars = calculateGreatCircleDistanceKm(0, 0, 0, 90, 'mars');
    const expectedMars = 0.5 * Math.PI * PLANETARY_RADII_KM.mars;
    expect(distMars).toBeCloseTo(expectedMars, 1);
  });

  it('formats coordinates into NASA archival strings', () => {
    const formatted = formatCoordinates(0.6741, 23.473);
    expect(formatted.latStr).toBe('0.6741° N');
    expect(formatted.lonStr).toBe('23.4730° E');

    const southWest = formatCoordinates(-14.5684, -175.4729);
    expect(southWest.latStr).toBe('14.5684° S');
    expect(southWest.lonStr).toBe('175.4729° W');
  });

  it('computes regional camera framing offset from surface point', () => {
    const surfacePt = new THREE.Vector3(GLOBE_RADIUS, 0, 0);
    const { cameraPos, targetPos } = getRegionalInspectionCamera(surfacePt, GLOBE_RADIUS, 1.5);
    // Target position should equal surface point
    expect(targetPos.x).toBeCloseTo(surfacePt.x, 3);
    // Camera distance should be greater than globe radius
    expect(cameraPos.length()).toBeGreaterThan(GLOBE_RADIUS);
  });
});
