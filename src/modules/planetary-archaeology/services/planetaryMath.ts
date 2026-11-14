import * as THREE from 'three';

// Physical planetary radii according to IAU / NASA standards (in km)
export const PLANETARY_RADII_KM = {
  moon: 1737.4,
  mars: 3389.5,
};

// 3D Visual Rendering Sphere Radius in Three.js world units
export const GLOBE_RADIUS = 3.0;

/**
 * Converts Planetary Geographic Coordinates (Latitude, Longitude in decimal degrees)
 * into a Three.js 3D Vector3 position on a sphere matching Three.js standard SphereGeometry equirectangular UV mapping.
 * 
 * Texture convention:
 * - U = 0.5 is Prime Meridian (0° Longitude)
 * - V = 1.0 is North Pole (+90° Latitude)
 * - V = 0.0 is South Pole (-90° Latitude)
 * - Positive Longitude is East, Negative Longitude is West.
 * 
 * @param lat Latitude in decimal degrees [-90, +90]
 * @param lon Longitude in decimal degrees [-180, +180] or [0, 360]
 * @param radius Sphere radius (defaults to GLOBE_RADIUS)
 * @param elevationOffset Radial offset above or below the baseline radius
 */
export function latLonToVector3(
  lat: number,
  lon: number,
  radius: number = GLOBE_RADIUS,
  elevationOffset: number = 0
): THREE.Vector3 {
  // Normalize longitude to [-180, +180]
  let normLon = lon;
  while (normLon > 180) normLon -= 360;
  while (normLon < -180) normLon += 360;

  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (normLon + 180) * (Math.PI / 180);
  const r = radius + elevationOffset;

  // Exact matching coordinates for Three.js default SphereGeometry vertices:
  // x = - r * sin(phi) * cos(theta)
  // y = r * cos(phi)
  // z = r * sin(phi) * sin(theta)
  const x = -r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.cos(phi);
  const z = r * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}

/**
 * Converts a 3D Cartesian point on the sphere back into planetary Latitude and Longitude.
 */
export function vector3ToLatLon(pos: THREE.Vector3): { lat: number; lon: number } {
  const norm = pos.clone().normalize();
  const phi = Math.acos(norm.y); // [0, PI] from North pole to South pole
  const lat = 90 - phi * (180 / Math.PI);

  // In x = -sin(phi)*cos(theta) and z = sin(phi)*sin(theta)
  const theta = Math.atan2(norm.z, -norm.x); // [-PI, PI]
  let lon = theta * (180 / Math.PI) - 180;
  while (lon > 180) lon -= 360;
  while (lon < -180) lon += 360;

  return { lat, lon };
}

/**
 * Calculates great-circle surface distance between two planetary coordinates in kilometers.
 * Uses the Haversine formula against the respective planetary mean radius.
 */
export function calculateGreatCircleDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  planet: 'moon' | 'mars'
): number {
  const R = PLANETARY_RADII_KM[planet];
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const phi1 = lat1 * (Math.PI / 180);
  const phi2 = lat2 * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Formats coordinates for NASA archival displays.
 */
export function formatCoordinates(lat: number, lon: number): { latStr: string; lonStr: string } {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return {
    latStr: `${Math.abs(lat).toFixed(4)}° ${latDir}`,
    lonStr: `${Math.abs(lon).toFixed(4)}° ${lonDir}`,
  };
}

/**
 * Computes optimal camera position to inspect a specific landing site from a regional perspective.
 * Dollies along the surface normal vector with a slight oblique angle to accentuate topography.
 */
export function getRegionalInspectionCamera(
  sitePos: THREE.Vector3,
  radius: number = GLOBE_RADIUS,
  altitudeUnits: number = 0.8
): { cameraPos: THREE.Vector3; targetPos: THREE.Vector3 } {
  const normal = sitePos.clone().normalize();
  
  // Up vector (towards North pole)
  const northPole = new THREE.Vector3(0, 1, 0);
  const tangent = new THREE.Vector3().crossVectors(northPole, normal).normalize();
  const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();

  // Position camera slightly offset (oblique 35-degree angle) so terrain elevation & shadows pop
  const cameraPos = sitePos
    .clone()
    .add(normal.clone().multiplyScalar(altitudeUnits))
    .add(bitangent.clone().multiplyScalar(altitudeUnits * 0.35));

  return {
    cameraPos,
    targetPos: sitePos.clone(),
  };
}
