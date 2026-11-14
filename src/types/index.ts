export type ExperienceState =
  | 'ARRIVAL'
  | 'DESTINATION_SELECT'
  | 'ENVIRONMENT_LOADING'
  | 'EXHIBITION'
  | 'ARTIFACT_DETAILS'
  | 'GUIDED_INTRO'
  | 'FREE_EXPLORATION'
  | 'ARTIFACT_APPROACH'
  | 'ARTIFACT_INSPECTION'
  | 'STORY_CHAPTER'
  | 'LEGACY'
  | 'RETURN_TO_EXPLORATION'
  | 'PLANETARY_ARCHAEOLOGY';

export type DestinationId = 'moon' | 'mars' | 'deep_space';

export type HardwareStatus =
  | 'operational'
  | 'inactive'
  | 'non-operational'
  | 'abandoned'
  | 'travelling';

export type ArtifactCategory =
  | 'Complete Spacecraft'
  | 'Hardware Component'
  | 'Scientific Instrument'
  | 'Landing Equipment';

export type CharacterPose =
  | 'explaining'
  | 'thinking'
  | 'excited'
  | 'pointing_up'
  | 'pointing_sideways'
  | 'concluding'
  | 'idle';

export interface ArtifactComponent {
  id: string;
  name: string;
  category: ArtifactCategory;
  remainsOnSite: boolean;
  siteNote: string;
  description: string;
  guideExplanation: string;
  voiceScript?: string;
  hotspot?: { x: number; y: number }; // Percentage coordinates (0-100) on hero image
}

export interface ArtifactGuideContent {
  explanation: string;
  purpose: string;
  missionUsed: string;
  whyLeftBehind: string;
  presentStatus: string;
  spokenIntro?: string;
  voiceScript?: string;
  keyFacts?: string[];
}

export interface GalleryImage {
  src: string;
  caption: string;
  nasaId?: string;
}

export interface StoryChapter {
  id: string;
  chapterNumber: string; // e.g. "01"
  chapterTitle: string; // e.g. "THE BEGINNING"
  headline: string;
  narrative: string;
  historicalContext: string;
  archivalImage: string;
  imageCaption: string;
  keyMetric?: { label: string; value: string };
  audioCuePrompt?: string;
  audioFrequency?: number;
}

export interface MissionSource {
  title: string;
  organization: string;
  url: string;
  catalogId: string;
}

export interface ArtifactLegacy {
  physicalCondition: string;
  currentMilestone: string;
  scientificImpact: string[];
  whatRemainsToday: string;
  sources: MissionSource[];
}

export interface ArtifactData {
  id: string;
  name: string;
  callsign: string;
  mission: string;
  year: string;
  destination: DestinationId;
  category: ArtifactCategory;
  modelType: string;
  landingDate: string;
  declarationDate: string;
  operationalDuration: string;
  distanceTraveled?: string;
  status: HardwareStatus;
  statusLabel: string;
  locationName: string;
  heroImage: string;
  heroCaption: string;
  heroNasaId?: string;
  galleryImages?: GalleryImage[];
  has3DModel?: boolean;
  coordinates: {
    latitude: string;
    longitude: string;
    elevation?: string;
    planetaryRegion: string;
    worldPosition: [number, number, number]; // 3D coordinates in the scene
  };
  brief: string;
  shortDescription: string;
  tagline: string;
  guide: ArtifactGuideContent;
  components: ArtifactComponent[];
  specs: {
    mass: string;
    powerSource: string;
    communication: string;
    primaryInstruments: string[];
  };
  storyChapters: StoryChapter[];
  legacy: ArtifactLegacy;
  curatedQnA: {
    question: string;
    answer: string;
    source: string;
  }[];
}

export interface DestinationData {
  id: DestinationId;
  name: string;
  epoch: string;
  tagline: string;
  subtext: string;
  environmentalDescription: string;
  ambientAudioType: 'lunar_vacuum' | 'martian_wind' | 'deep_telemetry';
  surfaceAtmosphere: string;
  gravity: string;
  temperature: string;
  artifactsCount: number;
  initialCameraPosition: [number, number, number];
  initialCameraTarget: [number, number, number];
  skyColor: string;
  fogColor: string;
  fogDensity: number;
}

