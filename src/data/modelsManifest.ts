export interface HardwareModelMeta {
  artifactId: string;
  hasOfficial3D: boolean;
  modelPath?: string;
  fileSizeBytes?: number;
  fileSizeFormatted?: string;
  sourceName?: string;
  sourceUrl?: string;
  attribution?: string;
  cameraConfig?: {
    position: [number, number, number];
    target: [number, number, number];
    minDistance: number;
    maxDistance: number;
  };
  unavailableReason?: string;
}

export const NASA_MODELS_MANIFEST: Record<string, HardwareModelMeta> = {
  apollo11_eagle: {
    artifactId: 'apollo11_eagle',
    hasOfficial3D: true,
    modelPath: '/models/apollo_lunar_module.glb',
    fileSizeBytes: 716840,
    fileSizeFormatted: '717 KB GLB',
    sourceName: 'NASA 3D Resources / Brian Kumanchik',
    sourceUrl: 'https://science.nasa.gov/3d-resources/apollo-lunar-module/',
    attribution: 'NASA / Brian Kumanchik — Lunar Module Descent & Ascent Stages',
    cameraConfig: {
      position: [5.2, 3.2, 6.8],
      target: [0, 0, 0],
      minDistance: 2.5,
      maxDistance: 16,
    },
  },
  apollo_lrv: {
    artifactId: 'apollo_lrv',
    hasOfficial3D: false,
    unavailableReason:
      'Official NASA 3D engineering asset for the Lunar Roving Vehicle is unavailable in the NASA 3D Resources repository. Displaying verified archival photographic documentation.',
  },
  surveyor3: {
    artifactId: 'surveyor3',
    hasOfficial3D: false,
    unavailableReason:
      'Official NASA 3D asset for Surveyor 3 is unavailable in the NASA 3D Resources repository. Displaying Apollo 12 in-situ lunar surface inspection photography.',
  },
  apollo_alsep: {
    artifactId: 'apollo_alsep',
    hasOfficial3D: false,
    unavailableReason:
      'Official NASA 3D model for the Apollo Lunar Surface Experiments Package is unavailable in the NASA 3D Resources catalog. Displaying official NASA AS12-47-6918 archival documentation.',
  },
  sojourner: {
    artifactId: 'sojourner',
    hasOfficial3D: false,
    unavailableReason:
      'Official standalone 3D engineering model for the Mars Pathfinder Sojourner microrover is unavailable in the NASA 3D Resources catalog. Displaying original 1997 Ares Vallis imaging.',
  },
  spirit: {
    artifactId: 'spirit',
    hasOfficial3D: true,
    modelPath: '/models/opportunity_rover.glb',
    fileSizeBytes: 36668,
    fileSizeFormatted: '36.7 KB GLB',
    sourceName: 'NASA 3D Resources / JPL-Caltech',
    sourceUrl: 'https://science.nasa.gov/3d-resources/mars-exploration-rover/',
    attribution: 'NASA / JPL-Caltech — Mars Exploration Rover Architecture (Spirit MER-A twin)',
    cameraConfig: {
      position: [2.8, 1.8, 3.6],
      target: [0, 0, 0],
      minDistance: 1.5,
      maxDistance: 10,
    },
  },
  opportunity: {
    artifactId: 'opportunity',
    hasOfficial3D: true,
    modelPath: '/models/opportunity_rover.glb',
    fileSizeBytes: 36668,
    fileSizeFormatted: '36.7 KB GLB',
    sourceName: 'NASA 3D Resources / JPL-Caltech',
    sourceUrl: 'https://science.nasa.gov/3d-resources/mars-exploration-rover/',
    attribution: 'NASA / JPL-Caltech — Mars Exploration Rover Opportunity (MER-B)',
    cameraConfig: {
      position: [2.8, 1.8, 3.6],
      target: [0, 0, 0],
      minDistance: 1.5,
      maxDistance: 10,
    },
  },
  insight: {
    artifactId: 'insight',
    hasOfficial3D: true,
    modelPath: '/models/insight_lander.glb',
    fileSizeBytes: 3948936,
    fileSizeFormatted: '3.95 MB GLB',
    sourceName: 'NASA 3D Resources / JPL-Caltech',
    sourceUrl: 'https://science.nasa.gov/3d-resources/insight-lander/',
    attribution: 'NASA / JPL-Caltech — InSight Mars Lander with Deployed Ultraflex Solar Wings',
    cameraConfig: {
      position: [4.8, 2.8, 5.2],
      target: [0, 0, 0],
      minDistance: 2.0,
      maxDistance: 14,
    },
  },
  voyager1: {
    artifactId: 'voyager1',
    hasOfficial3D: true,
    modelPath: '/models/voyager_probe.glb',
    fileSizeBytes: 1720864,
    fileSizeFormatted: '1.72 MB GLB',
    sourceName: 'NASA 3D Resources / JPL-Caltech',
    sourceUrl: 'https://science.nasa.gov/3d-resources/voyager-spacecraft/',
    attribution: 'NASA / JPL-Caltech — Voyager Interstellar Mission Probe',
    cameraConfig: {
      position: [4.6, 2.4, 5.8],
      target: [0, 0, 0],
      minDistance: 2.2,
      maxDistance: 16,
    },
  },
};

