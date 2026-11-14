import { create } from 'zustand';
import { DestinationId, ExperienceState } from '../types';
import { DESTINATIONS } from '../data/destinations';
import { soundManager } from '../audio/SoundManager';
import { guideVoiceEngine } from '../audio/GuideVoiceEngine';
import { navigation, ActiveDestination } from '../navigation/navigationController';

interface SavedCamera {
  position: [number, number, number];
  target: [number, number, number];
}

interface ExperienceStore {
  // State Machine
  state: ExperienceState;
  currentDestination: DestinationId;
  selectedArtifactId: string | null;
  selectedComponentId: string | null;
  hoveredArtifactId: string | null;
  activeStoryChapterIndex: number;
  exhibitionView: 'collection' | 'map';

  // Camera Management
  savedCamera: SavedCamera | null;
  isCameraAnimating: boolean;

  // Settings & Preferences
  isAudioMuted: boolean;
  audioVolume: number;
  narrationVolume: number;
  graphicsQuality: 'high' | 'medium' | 'low';
  reducedMotion: boolean;
  isRotationPaused: boolean;
  isAiGuideOpen: boolean;

  // Progress tracking
  discoveredArtifacts: string[];

  // Actions
  setState: (state: ExperienceState) => void;
  beginArrival: () => void;
  previewDestination: (destId: DestinationId) => void;
  selectDestination: (destId: DestinationId) => void;
  hoverArtifact: (id: string | null) => void;
  selectArtifact: (id: string, currentCamPos?: [number, number, number], currentCamTarget?: [number, number, number]) => void;
  selectComponent: (componentId: string | null) => void;
  enterInspection: () => void;
  enterStory: () => void;
  setStoryChapter: (index: number) => void;
  nextStoryChapter: () => void;
  prevStoryChapter: () => void;
  enterLegacy: () => void;
  returnToArtifactDetails: () => void;
  returnToExhibition: () => void;
  returnToExploration: () => void;
  returnToDestinations: () => void;
  setExhibitionView: (view: 'collection' | 'map') => void;
  navigateBack: () => void;
  setCameraAnimating: (isAnimating: boolean) => void;
  toggleAudio: () => void;
  setAudioVolume: (vol: number) => void;
  setNarrationVolume: (vol: number) => void;
  setGraphicsQuality: (quality: 'high' | 'medium' | 'low') => void;
  setReducedMotion: (reduced: boolean) => void;
  toggleRotationPaused: () => void;
  toggleAiGuide: (open?: boolean) => void;
}

// Initial state resolution with strict destination narrowing (Moon & Mars only)
const getInitialFromUrl = (): {
  state: ExperienceState;
  dest: DestinationId;
  artifact: string | null;
  chapter: number;
  view: 'collection' | 'map';
} => {
  if (typeof window === 'undefined') {
    return { state: 'ARRIVAL', dest: 'moon', artifact: null, chapter: 0, view: 'collection' };
  }
  const parsed = navigation.parseUrl(window.location.search);
  return {
    state: parsed.state,
    dest: parsed.destination,
    artifact: parsed.artifactId,
    chapter: parsed.storyChapterIndex,
    view: parsed.exhibitionView,
  };
};

const initial = getInitialFromUrl();
const initialReducedMotion =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const useExperienceStore = create<ExperienceStore>((set, get) => ({
  state: initial.state,
  currentDestination: initial.dest,
  selectedArtifactId: initial.artifact,
  selectedComponentId: null,
  hoveredArtifactId: null,
  activeStoryChapterIndex: initial.chapter,
  exhibitionView: initial.view,

  savedCamera: null,
  isCameraAnimating: false,

  isAudioMuted: false,
  audioVolume: 0.5,
  narrationVolume: guideVoiceEngine.getState().volume,
  graphicsQuality: 'high',
  reducedMotion: initialReducedMotion,
  isRotationPaused: false,
  isAiGuideOpen: false,

  discoveredArtifacts: initial.artifact ? [initial.artifact] : [],

  setState: (state) => set({ state }),

  beginArrival: () => {
    navigation.toDestinations();
  },

  previewDestination: (destId) => {
    const validDest: DestinationId = destId === 'mars' ? 'mars' : 'moon';
    if (get().currentDestination === validDest) return;
    soundManager.playClick();
    set({ currentDestination: validDest });
  },

  selectDestination: (destId) => {
    const validDest: ActiveDestination = destId === 'mars' ? 'mars' : 'moon';
    navigation.toDestination(validDest);
  },

  hoverArtifact: (id) => {
    const prev = get().hoveredArtifactId;
    if (id && id !== prev) {
      soundManager.playClick();
    }
    set({ hoveredArtifactId: id });
  },

  selectArtifact: (id) => {
    navigation.toArtifact(id);
  },

  selectComponent: (componentId) => {
    soundManager.playClick();
    set({ selectedComponentId: componentId });
  },

  enterInspection: () => {
    const artifactId = get().selectedArtifactId || 'apollo11_eagle';
    navigation.toArtifact(artifactId);
  },

  enterStory: () => {
    const artifactId = get().selectedArtifactId || 'apollo11_eagle';
    navigation.toStory(artifactId, 0);
  },

  setStoryChapter: (index) => {
    navigation.setStoryChapter(index);
  },

  nextStoryChapter: () => {
    navigation.nextStoryChapter();
  },

  prevStoryChapter: () => {
    navigation.prevStoryChapter();
  },

  enterLegacy: () => {
    const artifactId = get().selectedArtifactId || 'apollo11_eagle';
    navigation.toLegacy(artifactId);
  },

  returnToArtifactDetails: () => {
    const artifactId = get().selectedArtifactId;
    if (artifactId) {
      navigation.toArtifact(artifactId);
    } else {
      navigation.toExhibition();
    }
  },

  returnToExhibition: () => {
    navigation.toExhibition(
      get().currentDestination === 'mars' ? 'mars' : 'moon',
      get().exhibitionView
    );
  },

  returnToExploration: () => {
    navigation.toExhibition(
      get().currentDestination === 'mars' ? 'mars' : 'moon',
      get().exhibitionView
    );
  },

  returnToDestinations: () => {
    navigation.toDestinations();
  },

  setExhibitionView: (view) => {
    navigation.setExhibitionView(view);
  },

  navigateBack: () => {
    navigation.goBack();
  },

  setCameraAnimating: (isAnimating) => set({ isCameraAnimating: isAnimating }),

  toggleAudio: () => {
    const nextMuted = !get().isAudioMuted;
    soundManager.setMuted(nextMuted);
    guideVoiceEngine.setMuted(nextMuted);
    set({ isAudioMuted: nextMuted });
  },

  setAudioVolume: (vol) => {
    soundManager.setVolume(vol);
    set({ audioVolume: vol });
  },

  setNarrationVolume: (vol) => {
    guideVoiceEngine.setVolume(vol);
    set({ narrationVolume: vol });
  },

  setGraphicsQuality: (quality) => set({ graphicsQuality: quality }),

  setReducedMotion: (reduced) => set({ reducedMotion: reduced }),

  toggleRotationPaused: () => {
    soundManager.playClick();
    set((s) => ({ isRotationPaused: !s.isRotationPaused }));
  },

  toggleAiGuide: (open) => {
    soundManager.playClick();
    set((s) => ({ isAiGuideOpen: open !== undefined ? open : !s.isAiGuideOpen }));
  },
}));

// Initialize history event listener and sync when run in browser
if (typeof window !== 'undefined') {
  (window as any).__EXPERIENCE_STORE__ = useExperienceStore;
  navigation.init();
}
