export type PlanetaryBody = 'moon' | 'mars';

export type LocationConfidence = 'confirmed' | 'approximate' | 'estimated' | 'unknown';

export type ImageryLayerType = 'visible' | 'elevation' | 'shaded_relief';

export type HardwareCategory =
  | 'lander'
  | 'rover'
  | 'descent_stage'
  | 'scientific_instrument'
  | 'alsep'
  | 'discarded_component'
  | 'impact_site';

export type HardwareStatus =
  | 'operational'
  | 'inactive'
  | 'decommissioned'
  | 'destroyed';

export type HardwareDisposition =
  | 'operational_on_surface'
  | 'intentionally_left_behind'
  | 'decommissioned'
  | 'discarded'
  | 'impacted';

export interface OfficialSourceReference {
  title: string;
  organization: string;
  url: string;
  catalogId?: string;
  description?: string;
}

export interface RoverWaypoint {
  id: string;
  name: string;
  sol?: number | string;
  latitude: number;
  longitude: number;
  elevationMeters?: number;
  significance?: string;
  isKeyMilestone?: boolean;
}

export interface RoverTraverse {
  id: string;
  roverId: string;
  roverName: string;
  planet: PlanetaryBody;
  totalDistanceKm: number;
  totalSols: number | string;
  startSiteId: string;
  endSiteId: string;
  color: string;
  waypoints: RoverWaypoint[];
}

export interface PlanetarySite {
  id: string;
  name: string;
  mission: string;
  year: number;
  planet: PlanetaryBody;
  operator: string;
  launchDate: string;
  landingDate: string;
  latitude: number; // Decimal degrees (-90 to +90)
  longitude: number; // Decimal degrees (-180 to +180 or 0 to 360)
  latitudeFormatted: string;
  longitudeFormatted: string;
  elevationMeters: number; // Elevation relative to mean planetary datum
  hardwareType: string;
  category: HardwareCategory;
  status: HardwareStatus;
  disposition: HardwareDisposition;
  locationConfidence: LocationConfidence;
  confidenceReason: string;
  coordinatesPrecisionMeters?: number;
  officialSources: OfficialSourceReference[];
  significance: string;
  siteDescription: string;
  geologicalContext: string;
  regionalFeature: string;
  photoUrl?: string;
  photoCaption?: string;
  photoNasaId?: string;
  traverseId?: string;
  linkedArtifactStoryId?: string; // Links to documentary / deep dive story
  dimensionsMeters?: { width?: number; length?: number; height?: number };
  massKg?: number;
}

export interface PlanetaryLayerSpec {
  id: string;
  name: string;
  type: ImageryLayerType;
  provider: 'NASA Moon Trek' | 'NASA Mars Trek' | 'USGS Astrogeology' | 'NASA SVS';
  instrument: 'LROC' | 'LOLA' | 'Viking MDIM' | 'MOLA' | 'CTX' | 'HiRISE';
  description: string;
  resolution: string;
  localTextureUrl: string;
  localDemUrl?: string;
  wmtsEndpoint?: string;
  wmtsLayerName?: string;
  hasElevationData: boolean;
  citation: string;
}

export interface HardwareFilterOptions {
  planet: PlanetaryBody | 'all';
  searchQuery: string;
  category: HardwareCategory | 'all';
  disposition: HardwareDisposition | 'all';
  status: HardwareStatus | 'all';
  confidence: LocationConfidence | 'all';
  yearRange: [number, number]; // e.g. [1959, 2024]
  mission: string | 'all';
}
