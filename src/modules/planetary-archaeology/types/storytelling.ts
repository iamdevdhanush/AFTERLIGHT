import { PlanetaryBody } from './planetary';

export interface MissionStoryChapter {
  id: string;
  chapterNumber: number; // 1 to 7
  title: string;
  subtitle: string;
  headline: string;
  narrativeText: string[];
  keyFacts: { label: string; value: string }[];
  engineeringInsight?: string;
  photoUrl?: string;
  photoCaption?: string;
  photoNasaId?: string;
  cameraCue: {
    lat: number;
    lon: number;
    altitudeUnits: number; // e.g. 1.2 = close regional, 8.5 = global
    obliqueAngle?: number;
    focusEntity?: 'landing' | 'route' | 'hardware' | 'final' | 'global';
  };
}

export interface CompleteMissionStory {
  id: string;
  missionName: string;
  spacecraftName: string;
  planet: PlanetaryBody;
  launchYear: number;
  operator: string;
  heroImage: string;
  tagline: string;
  summary: string;
  chapters: MissionStoryChapter[];
  hardwareInventory: {
    name: string;
    type: string;
    condition: string;
    status: string;
  }[];
}

export interface GlossaryTerm {
  term: string;
  phonetic?: string;
  category: 'geology' | 'rocketry' | 'spacecraft' | 'physics';
  definition: string;
  example: string;
  planetRelevant: 'moon' | 'mars' | 'both';
}

export interface MissionComparison {
  id: string;
  title: string;
  subtitle: string;
  category: 'lunar_evolution' | 'mars_rovers';
  missionA: {
    name: string;
    year: number;
    massKg: number | string;
    power: string;
    duration: string;
    distanceTraveled: string;
    primaryDiscovery: string;
    remainingHardware: string;
  };
  missionB: {
    name: string;
    year: number;
    massKg: number | string;
    power: string;
    duration: string;
    distanceTraveled: string;
    primaryDiscovery: string;
    remainingHardware: string;
  };
  analysis: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  missionContext: string;
}
