import { create } from 'zustand';
import { DestinationId, ExperienceState } from '../types';
import { DESTINATIONS } from '../data/destinations';
import { soundManager } from '../audio/SoundManager';

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

  // Camera Management
  savedCamera: SavedCamera | null;
  isCameraAnimating: boolean;

  // Settings & Preferences
  isAudioMuted: boolean;
  audioVolume: number;
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
  setCameraAnimating: (isAnimating: boolean) => void;
  toggleAudio: () => void;
  setAudioVolume: (vol: number) => void;
  setGraphicsQuality: (quality: 'high' | 'medium' | 'low') => void;
  setReducedMotion: (reduced: boolean) => void;
  toggleRotationPaused: () => void;
  toggleAiGuide: (open?: boolean) => void;
}

// Read initial state from URL query params if present (for validation & deep-linking)
const getInitialFromUrl = (): { state: ExperienceState; dest: DestinationId; artifact: string | null } => {
  if (typeof window === 'undefined') return { state: 'ARRIVAL', dest: 'moon', artifact: 'apollo11_eagle' };
  const params = new URLSearchParams(window.location.search);
  const rawState = params.get('state');
  const rawDest = params.get('dest');
  const state: ExperienceState = (rawState as ExperienceState) || 'ARRIVAL';
  const dest: DestinationId = (rawDest as DestinationId) || 'moon';
  const artifact = params.get('artifact') || (state.includes('ARTIFACT') || state === 'LEGACY' || state === 'STORY_CHAPTER' ? 'apollo11_eagle' : null);
  return { state, dest, artifact };
};

const initial = getInitialFromUrl();
const initialReducedMotion =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let transitionTimeoutA: ReturnType<typeof setTimeout> | null = null;
let transitionTimeoutB: ReturnType<typeof setTimeout> | null = null;

export const useExperienceStore = create<ExperienceStore>((set, get) => ({
  state: initial.state,
  currentDestination: initial.dest,
  selectedArtifactId: initial.artifact,
  selectedComponentId: null,
  hoveredArtifactId: null,
  activeStoryChapterIndex: 0,

  savedCamera: null,
  isCameraAnimating: false,

  isAudioMuted: false,
  audioVolume: 0.5,
  graphicsQuality: 'high',
  reducedMotion: initialReducedMotion,
  isRotationPaused: false,
  isAiGuideOpen: false,

  discoveredArtifacts: [],

  setState: (state) => set({ state }),

  beginArrival: () => {
    soundManager.playTransitionSwoosh();
    set({ state: 'DESTINATION_SELECT' });
  },

  previewDestination: (destId) => {
    if (get().currentDestination === destId) return;
    soundManager.playClick();
    set({ currentDestination: destId });
  },

  selectDestination: (destId) => {
    if (transitionTimeoutA) clearTimeout(transitionTimeoutA);
    if (transitionTimeoutB) clearTimeout(transitionTimeoutB);

    soundManager.playTransitionSwoosh();
    const dest = DESTINATIONS[destId];
    if (dest) {
      soundManager.playAmbience(dest.ambientAudioType);
    }
    set({
      currentDestination: destId,
      state: 'ENVIRONMENT_LOADING',
      selectedArtifactId: null,
      hoveredArtifactId: null,
    });

    const isOrbitalDescent = destId === 'moon' || destId === 'mars';
    const transitionDuration = get().reducedMotion ? 300 : isOrbitalDescent ? 1150 : 600;

    // Restrained orbital approach fade into dedicated historical exhibition
    transitionTimeoutA = setTimeout(() => {
      if (get().state !== 'ENVIRONMENT_LOADING') return;
      set({ state: 'EXHIBITION' });
    }, transitionDuration);
  },

  hoverArtifact: (id) => {
    const prev = get().hoveredArtifactId;
    if (id && id !== prev) {
      soundManager.playClick();
    }
    set({ hoveredArtifactId: id });
  },

  selectArtifact: (id) => {
    soundManager.playArtifactChime(392);
    const discovered = new Set(get().discoveredArtifacts);
    discovered.add(id);

    set({
      selectedArtifactId: id,
      selectedComponentId: null,
      state: 'ARTIFACT_DETAILS',
      discoveredArtifacts: Array.from(discovered),
      isCameraAnimating: false,
    });
  },

  selectComponent: (componentId) => {
    soundManager.playClick();
    set({ selectedComponentId: componentId });
  },

  enterInspection: () => {
    set({ state: 'ARTIFACT_DETAILS', isCameraAnimating: false });
  },

  enterStory: () => {
    soundManager.playTransitionSwoosh();
    set({ state: 'STORY_CHAPTER', activeStoryChapterIndex: 0 });
  },

  setStoryChapter: (index) => {
    soundManager.playClick();
    set({ activeStoryChapterIndex: index });
  },

  nextStoryChapter: () => {
    soundManager.playClick();
    set((state) => ({ activeStoryChapterIndex: state.activeStoryChapterIndex + 1 }));
  },

  prevStoryChapter: () => {
    soundManager.playClick();
    set((state) => ({ activeStoryChapterIndex: Math.max(0, state.activeStoryChapterIndex - 1) }));
  },

  enterLegacy: () => {
    soundManager.playArtifactChime(523.25);
    set({ state: 'LEGACY' });
  },

  returnToArtifactDetails: () => {
    soundManager.playTransitionSwoosh();
    set({
      state: 'ARTIFACT_DETAILS',
      isCameraAnimating: false,
    });
  },

  returnToExhibition: () => {
    soundManager.playTransitionSwoosh();
    set({
      state: 'EXHIBITION',
      selectedArtifactId: null,
      selectedComponentId: null,
      isCameraAnimating: false,
    });
  },

  returnToExploration: () => {
    soundManager.playTransitionSwoosh();
    set({
      state: 'EXHIBITION',
      selectedArtifactId: null,
      selectedComponentId: null,
      isCameraAnimating: false,
    });
  },

  returnToDestinations: () => {
    soundManager.playTransitionSwoosh();
    soundManager.stopAmbience();
    set({
      state: 'DESTINATION_SELECT',
      selectedArtifactId: null,
      selectedComponentId: null,
      hoveredArtifactId: null,
      savedCamera: null,
    });
  },

  setCameraAnimating: (isAnimating) => set({ isCameraAnimating: isAnimating }),

  toggleAudio: () => {
    const nextMuted = !get().isAudioMuted;
    soundManager.setMuted(nextMuted);
    set({ isAudioMuted: nextMuted });
  },

  setAudioVolume: (vol) => {
    soundManager.setVolume(vol);
    set({ audioVolume: vol });
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

