import { ExperienceState, DestinationId } from '../types';
import { ARTIFACTS } from '../data/artifacts';
import { DESTINATIONS } from '../data/destinations';
import { useExperienceStore } from '../store/useExperienceStore';
import { soundManager } from '../audio/SoundManager';
import { guideVoiceEngine } from '../audio/GuideVoiceEngine';

export type ActiveDestination = 'moon' | 'mars';

export interface ParsedNavState {
  state: ExperienceState;
  destination: ActiveDestination;
  artifactId: string | null;
  storyChapterIndex: number;
  exhibitionView: 'collection' | 'map';
}

class NavigationController {
  private isHandlingPopstate = false;
  private historyStackDepth = 0;
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Track session history depth
      const initialDepth = window.history.state?._afterlightDepth || 0;
      this.historyStackDepth = initialDepth;
    }
  }

  /**
   * Initialize browser history listeners and sync initial URL state
   */
  public init() {
    if (typeof window === 'undefined' || this.isInitialized) return;
    this.isInitialized = true;

    // Listen to browser Back and Forward buttons
    window.addEventListener('popstate', this.handlePopstate);

    // Initial sync from current URL
    const initialNav = this.parseUrl(window.location.search);

    // Replace current history entry with initial metadata
    const initialUrl = this.buildUrl(initialNav);
    window.history.replaceState(
      { ...initialNav, _afterlightDepth: this.historyStackDepth },
      '',
      initialUrl
    );

    // Sync store with sanitized initial state
    useExperienceStore.setState({
      state: initialNav.state,
      currentDestination: initialNav.destination,
      selectedArtifactId: initialNav.artifactId,
      activeStoryChapterIndex: initialNav.storyChapterIndex,
      exhibitionView: initialNav.exhibitionView,
    });
  }

  /**
   * Handle browser Back/Forward (popstate)
   */
  private handlePopstate = (event: PopStateEvent) => {
    this.isHandlingPopstate = true;
    try {
      const nextNav = this.parseUrl(window.location.search, event.state);

      // Track depth to know if we can goBack() safely
      if (event.state?._afterlightDepth !== undefined) {
        this.historyStackDepth = event.state._afterlightDepth;
      } else {
        this.historyStackDepth = Math.max(0, this.historyStackDepth - 1);
      }

      soundManager.playTransitionSwoosh();
      guideVoiceEngine.stop(false);

      // Update Zustand store
      useExperienceStore.setState({
        state: nextNav.state,
        currentDestination: nextNav.destination,
        selectedArtifactId: nextNav.artifactId,
        activeStoryChapterIndex: nextNav.storyChapterIndex,
        exhibitionView: nextNav.exhibitionView,
        selectedComponentId: null,
      });

      // Update ambient sound matching destination
      const dest = DESTINATIONS[nextNav.destination];
      if (nextNav.state === 'EXHIBITION' || nextNav.state === 'ARTIFACT_DETAILS') {
        if (dest) soundManager.playAmbience(dest.ambientAudioType);
      } else if (nextNav.state === 'DESTINATION_SELECT' || nextNav.state === 'ARRIVAL') {
        soundManager.stopAmbience();
      }
    } finally {
      this.isHandlingPopstate = false;
    }
  };

  /**
   * Parses and sanitizes URL search parameters into a valid navigation state
   */
  public parseUrl(search: string, historyState?: any): ParsedNavState {
    const params = new URLSearchParams(search);

    // 1. Destination sanitization (Strictly 'moon' or 'mars')
    let rawDest = params.get('dest') || historyState?.destination || 'moon';
    let destination: ActiveDestination = 'moon';
    if (rawDest === 'mars') destination = 'mars';
    // If deep_space or unknown, defaults to 'moon'

    // 2. State sanitization
    let rawState = params.get('state') || historyState?.state;
    let state: ExperienceState = 'ARRIVAL';

    if (rawState) {
      const upper = rawState.toUpperCase();
      if (upper === 'ARRIVAL') state = 'ARRIVAL';
      else if (upper === 'DESTINATIONS' || upper === 'DESTINATION_SELECT') state = 'DESTINATION_SELECT';
      else if (upper === 'EXHIBITION') state = 'EXHIBITION';
      else if (upper === 'ARTIFACT_DETAILS' || upper === 'ARTIFACT') state = 'ARTIFACT_DETAILS';
      else if (upper === 'STORY' || upper === 'STORY_CHAPTER') state = 'STORY_CHAPTER';
      else if (upper === 'LEGACY') state = 'LEGACY';
      else if (upper === 'EXPLORATION' || upper === 'FREE_EXPLORATION') state = 'FREE_EXPLORATION';
      else if (upper === 'PLANETARY_ARCHAEOLOGY' || upper === 'PLANETARY3D') state = 'PLANETARY_ARCHAEOLOGY';
    } else if (params.get('module') === 'planetary3d') {
      state = 'PLANETARY_ARCHAEOLOGY';
    } else {
      // If ?artifact= is present without explicit state parameter, default to ARTIFACT_DETAILS
      if (params.has('artifact')) {
        state = 'ARTIFACT_DETAILS';
      } else if (params.has('dest')) {
        // If ?dest= is present without state, default to EXHIBITION
        state = 'EXHIBITION';
      }
    }

    // View parameter can refine state
    const view = params.get('view');
    if (view === 'story') state = 'STORY_CHAPTER';
    if (view === 'legacy') state = 'LEGACY';

    // 3. Artifact sanitization
    let artifactId = params.get('artifact') || historyState?.artifactId || null;
    if (state === 'ARTIFACT_DETAILS' || state === 'STORY_CHAPTER' || state === 'LEGACY') {
      if (!artifactId || !ARTIFACTS[artifactId]) {
        // Fallback to default artifact for destination
        artifactId = destination === 'mars' ? 'opportunity' : 'apollo11_eagle';
      } else {
        // If artifact belongs to another destination, synchronize destination
        const artifactData = ARTIFACTS[artifactId];
        if (artifactData && (artifactData.destination === 'moon' || artifactData.destination === 'mars')) {
          destination = artifactData.destination;
        }
      }
    } else {
      artifactId = null;
    }

    // 4. Chapter index sanitization
    const chapterParam = parseInt(params.get('chapter') || '0', 10);
    const storyChapterIndex = Number.isNaN(chapterParam) || chapterParam < 0 ? 0 : chapterParam;

    // 5. Exhibition View mode sanitization ('collection' | 'map')
    const exhibitionView: 'collection' | 'map' =
      params.get('mode') === 'map' || params.get('view') === 'map' ? 'map' : 'collection';

    return {
      state,
      destination,
      artifactId,
      storyChapterIndex,
      exhibitionView,
    };
  }

  /**
   * Builds canonical URL query string from navigation state
   */
  public buildUrl(nav: ParsedNavState): string {
    const params = new URLSearchParams();

    if (nav.state === 'ARRIVAL') {
      // Clean root URL for arrival
      return window.location.pathname;
    }

    if (nav.state === 'DESTINATION_SELECT') {
      params.set('state', 'destinations');
      return `${window.location.pathname}?${params.toString()}`;
    }

    // All destination-scoped states
    params.set('dest', nav.destination);

    if (nav.state === 'EXHIBITION') {
      if (nav.exhibitionView === 'map') {
        params.set('view', 'map');
      }
    } else if (nav.state === 'ARTIFACT_DETAILS') {
      if (nav.artifactId) {
        params.set('artifact', nav.artifactId);
      }
    } else if (nav.state === 'STORY_CHAPTER') {
      if (nav.artifactId) {
        params.set('artifact', nav.artifactId);
        params.set('view', 'story');
        if (nav.storyChapterIndex > 0) {
          params.set('chapter', String(nav.storyChapterIndex));
        }
      }
    } else if (nav.state === 'LEGACY') {
      if (nav.artifactId) {
        params.set('artifact', nav.artifactId);
        params.set('view', 'legacy');
      }
    } else if (nav.state === 'FREE_EXPLORATION') {
      params.set('mode', 'explore');
    }

    return `${window.location.pathname}?${params.toString()}`;
  }

  /**
   * Commit a navigation step to browser history
   */
  private commit(nav: ParsedNavState, replace = false) {
    if (this.isHandlingPopstate || typeof window === 'undefined') return;

    const targetUrl = this.buildUrl(nav);
    const currentSearch = window.location.search;
    const currentUrl = currentSearch ? `${window.location.pathname}${currentSearch}` : window.location.pathname;

    if (replace || targetUrl === currentUrl) {
      window.history.replaceState(
        { ...nav, _afterlightDepth: this.historyStackDepth },
        '',
        targetUrl
      );
    } else {
      this.historyStackDepth += 1;
      window.history.pushState(
        { ...nav, _afterlightDepth: this.historyStackDepth },
        '',
        targetUrl
      );
    }
  }

  // =========================================================================
  // PUBLIC NAVIGATION API
  // =========================================================================

  /**
   * Navigate to Arrival Screen
   */
  public toArrival() {
    guideVoiceEngine.stop(false);
    soundManager.stopAmbience();
    const nav: ParsedNavState = {
      state: 'ARRIVAL',
      destination: 'moon',
      artifactId: null,
      storyChapterIndex: 0,
      exhibitionView: 'collection',
    };
    this.commit(nav);
    useExperienceStore.setState({
      state: 'ARRIVAL',
      selectedArtifactId: null,
      selectedComponentId: null,
    });
  }

  /**
   * Navigate to 3D Destination Selection Screen
   */
  public toDestinations() {
    guideVoiceEngine.stop(false);
    soundManager.playTransitionSwoosh();
    soundManager.stopAmbience();
    const nav: ParsedNavState = {
      state: 'DESTINATION_SELECT',
      destination: useExperienceStore.getState().currentDestination === 'mars' ? 'mars' : 'moon',
      artifactId: null,
      storyChapterIndex: 0,
      exhibitionView: 'collection',
    };
    this.commit(nav);
    useExperienceStore.setState({
      state: 'DESTINATION_SELECT',
      selectedArtifactId: null,
      selectedComponentId: null,
      hoveredArtifactId: null,
    });
  }

  /**
   * Navigate to a Destination with smooth loading descent
   */
  public toDestination(destId: ActiveDestination) {
    guideVoiceEngine.stop(false);
    const validDest: ActiveDestination = destId === 'mars' ? 'mars' : 'moon';
    soundManager.playTransitionSwoosh();

    const dest = DESTINATIONS[validDest];
    if (dest) {
      soundManager.playAmbience(dest.ambientAudioType);
    }

    // 1. Enter loading state
    useExperienceStore.setState({
      currentDestination: validDest,
      state: 'ENVIRONMENT_LOADING',
      selectedArtifactId: null,
      selectedComponentId: null,
      hoveredArtifactId: null,
    });

    const isReduced = useExperienceStore.getState().reducedMotion;
    const transitionDuration = isReduced ? 250 : 1100;

    // Commit destination URL directly so history reflects the target
    const nav: ParsedNavState = {
      state: 'EXHIBITION',
      destination: validDest,
      artifactId: null,
      storyChapterIndex: 0,
      exhibitionView: 'collection',
    };
    this.commit(nav);

    // 2. Transition cleanly into Exhibition
    setTimeout(() => {
      if (useExperienceStore.getState().state === 'ENVIRONMENT_LOADING') {
        useExperienceStore.setState({ state: 'EXHIBITION' });
      }
    }, transitionDuration);
  }

  /**
   * Navigate to Exhibition (with view mode preservation)
   */
  public toExhibition(destId?: ActiveDestination, viewMode?: 'collection' | 'map') {
    guideVoiceEngine.stop(false);
    soundManager.playTransitionSwoosh();
    const store = useExperienceStore.getState();
    const targetDest: ActiveDestination = destId
      ? destId === 'mars'
        ? 'mars'
        : 'moon'
      : store.currentDestination === 'mars'
      ? 'mars'
      : 'moon';

    const targetMode = viewMode || store.exhibitionView || 'collection';

    const nav: ParsedNavState = {
      state: 'EXHIBITION',
      destination: targetDest,
      artifactId: null,
      storyChapterIndex: 0,
      exhibitionView: targetMode,
    };
    this.commit(nav);

    useExperienceStore.setState({
      state: 'EXHIBITION',
      currentDestination: targetDest,
      selectedArtifactId: null,
      selectedComponentId: null,
      exhibitionView: targetMode,
    });
  }

  /**
   * Switch between Exhibition View modes ('collection' vs 'map') without creating unnecessary history steps
   */
  public setExhibitionView(viewMode: 'collection' | 'map') {
    const store = useExperienceStore.getState();
    const nav: ParsedNavState = {
      state: 'EXHIBITION',
      destination: store.currentDestination === 'mars' ? 'mars' : 'moon',
      artifactId: null,
      storyChapterIndex: 0,
      exhibitionView: viewMode,
    };
    // Replace URL state so Back button returns to the previous screen rather than toggling view modes
    this.commit(nav, true);
    useExperienceStore.setState({ exhibitionView: viewMode });
  }

  /**
   * Navigate to Artifact Details
   */
  public toArtifact(artifactId: string) {
    const artifact = ARTIFACTS[artifactId];
    if (!artifact) return;

    soundManager.playArtifactChime(392);
    const destination: ActiveDestination = artifact.destination === 'mars' ? 'mars' : 'moon';

    const discovered = new Set(useExperienceStore.getState().discoveredArtifacts);
    discovered.add(artifactId);

    const nav: ParsedNavState = {
      state: 'ARTIFACT_DETAILS',
      destination,
      artifactId,
      storyChapterIndex: 0,
      exhibitionView: useExperienceStore.getState().exhibitionView || 'collection',
    };
    this.commit(nav);

    useExperienceStore.setState({
      state: 'ARTIFACT_DETAILS',
      currentDestination: destination,
      selectedArtifactId: artifactId,
      selectedComponentId: null,
      discoveredArtifacts: Array.from(discovered),
    });
  }

  /**
   * Navigate to Documentary Story Chapters
   */
  public toStory(artifactId?: string, chapterIndex = 0) {
    const store = useExperienceStore.getState();
    const targetArtifactId = artifactId || store.selectedArtifactId || 'apollo11_eagle';
    const artifact = ARTIFACTS[targetArtifactId];
    if (!artifact) return;

    soundManager.playTransitionSwoosh();
    const destination: ActiveDestination = artifact.destination === 'mars' ? 'mars' : 'moon';

    const nav: ParsedNavState = {
      state: 'STORY_CHAPTER',
      destination,
      artifactId: targetArtifactId,
      storyChapterIndex: chapterIndex,
      exhibitionView: store.exhibitionView || 'collection',
    };
    this.commit(nav);

    useExperienceStore.setState({
      state: 'STORY_CHAPTER',
      currentDestination: destination,
      selectedArtifactId: targetArtifactId,
      activeStoryChapterIndex: chapterIndex,
    });
  }

  /**
   * Update active story chapter
   */
  public setStoryChapter(chapterIndex: number) {
    soundManager.playClick();
    const store = useExperienceStore.getState();
    const nav: ParsedNavState = {
      state: 'STORY_CHAPTER',
      destination: store.currentDestination === 'mars' ? 'mars' : 'moon',
      artifactId: store.selectedArtifactId,
      storyChapterIndex: chapterIndex,
      exhibitionView: store.exhibitionView || 'collection',
    };
    // Use replaceState so next/prev doesn't pollute back button with 10 chapter entries
    this.commit(nav, true);
    useExperienceStore.setState({ activeStoryChapterIndex: chapterIndex });
  }

  /**
   * Advance to next story chapter
   */
  public nextStoryChapter() {
    const store = useExperienceStore.getState();
    const artifact = store.selectedArtifactId ? ARTIFACTS[store.selectedArtifactId] : null;
    const maxIndex = artifact?.storyChapters ? artifact.storyChapters.length - 1 : 0;
    const nextIndex = Math.min(maxIndex, store.activeStoryChapterIndex + 1);
    this.setStoryChapter(nextIndex);
  }

  /**
   * Return to previous story chapter
   */
  public prevStoryChapter() {
    const store = useExperienceStore.getState();
    const prevIndex = Math.max(0, store.activeStoryChapterIndex - 1);
    this.setStoryChapter(prevIndex);
  }

  /**
   * Navigate to Legacy conclusion screen
   */
  public toLegacy(artifactId?: string) {
    const store = useExperienceStore.getState();
    const targetArtifactId = artifactId || store.selectedArtifactId || 'apollo11_eagle';
    const artifact = ARTIFACTS[targetArtifactId];
    if (!artifact) return;

    soundManager.playArtifactChime(523.25);
    const destination: ActiveDestination = artifact.destination === 'mars' ? 'mars' : 'moon';

    const nav: ParsedNavState = {
      state: 'LEGACY',
      destination,
      artifactId: targetArtifactId,
      storyChapterIndex: 0,
      exhibitionView: store.exhibitionView || 'collection',
    };
    this.commit(nav);

    useExperienceStore.setState({
      state: 'LEGACY',
      currentDestination: destination,
      selectedArtifactId: targetArtifactId,
    });
  }

  /**
   * Deterministic Back Navigation:
   * Uses browser history back if session history exists,
   * otherwise falls back to logical parent screen.
   */
  public goBack() {
    if (typeof window !== 'undefined' && this.historyStackDepth > 0) {
      window.history.back();
      return;
    }

    // Fallback hierarchical parent navigation for direct URL entries
    const store = useExperienceStore.getState();
    const current = store.state;

    if (current === 'LEGACY') {
      this.toStory(store.selectedArtifactId || undefined, 0);
    } else if (current === 'STORY_CHAPTER') {
      if (store.selectedArtifactId) {
        this.toArtifact(store.selectedArtifactId);
      } else {
        this.toExhibition();
      }
    } else if (current === 'ARTIFACT_DETAILS') {
      this.toExhibition();
    } else if (current === 'EXHIBITION') {
      this.toDestinations();
    } else if (current === 'DESTINATION_SELECT') {
      this.toArrival();
    }
  }
}

export const navigation = new NavigationController();

// Expose globally for diagnostics and verification tests
if (typeof window !== 'undefined') {
  (window as any).__AFTERLIGHT_NAV__ = navigation;
}
