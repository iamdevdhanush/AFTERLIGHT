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

export interface NavHistoryState extends ParsedNavState {
  _orbitalDepth: number;
  _afterlightDepth?: number;
  _source?: 'story' | 'destinations' | 'exhibition' | 'artifact' | 'story_chapter' | 'legacy' | 'app';
  _arrivalChapter?: string;
  _arrivalScrollTop?: number;
}

class NavigationController {
  private isHandlingPopstate = false;
  private historyStackDepth = 0;
  private isInitialized = false;
  private loadingTimeout: NodeJS.Timeout | null = null;

  // Session-aware navigation source trackers
  private arrivalVisitedInSession = false;
  private exhibitionVisitedInSession = false;
  private artifactOpenedInSession = false;
  private documentaryOpenedInSession = false;

  // Preserved position states
  private lastArrivalChapter = 'scene-prologue';
  private lastArrivalScrollTop = 0;
  private exhibitionScrollPositions: Record<string, number> = { moon: 0, mars: 0 };

  constructor() {
    if (typeof window !== 'undefined') {
      const initialDepth =
        window.history.state?._orbitalDepth ??
        window.history.state?._afterlightDepth ??
        0;
      this.historyStackDepth = initialDepth;

      if (window.history.state?._arrivalChapter) {
        this.lastArrivalChapter = window.history.state._arrivalChapter;
      }
      if (window.history.state?._arrivalScrollTop) {
        this.lastArrivalScrollTop = window.history.state._arrivalScrollTop;
      }
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

    const initialDepth =
      window.history.state?._orbitalDepth ??
      window.history.state?._afterlightDepth ??
      0;
    this.historyStackDepth = initialDepth;

    if (initialNav.state === 'ARRIVAL') {
      this.arrivalVisitedInSession = true;
      if (window.history.state?._arrivalChapter) {
        this.lastArrivalChapter = window.history.state._arrivalChapter;
      }
      if (window.history.state?._arrivalScrollTop) {
        this.lastArrivalScrollTop = window.history.state._arrivalScrollTop;
      }
    } else if (initialNav.state === 'DESTINATION_SELECT') {
      this.arrivalVisitedInSession = true;
    } else if (initialNav.state === 'EXHIBITION') {
      this.exhibitionVisitedInSession = true;
    } else if (initialNav.state === 'ARTIFACT_DETAILS') {
      this.exhibitionVisitedInSession = true;
    }

    // Replace current history entry with initial metadata
    const initialUrl = this.buildUrl(initialNav);
    window.history.replaceState(
      {
        ...initialNav,
        _orbitalDepth: this.historyStackDepth,
        _afterlightDepth: this.historyStackDepth,
        _source: this.stateToSource(initialNav.state),
        _arrivalChapter: this.lastArrivalChapter,
        _arrivalScrollTop: this.lastArrivalScrollTop,
      },
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
    // 1. Cancel any active loading transition immediately
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }

    this.isHandlingPopstate = true;
    try {
      const nextNav = this.parseUrl(window.location.search, event.state);

      // 2. Track depth to know if we can goBack() safely
      const prevDepth = this.historyStackDepth;
      let newDepth = prevDepth;
      if (event.state?._orbitalDepth !== undefined) {
        newDepth = event.state._orbitalDepth;
      } else if (event.state?._afterlightDepth !== undefined) {
        newDepth = event.state._afterlightDepth;
      } else {
        newDepth = Math.max(0, this.historyStackDepth - 1);
      }
      this.historyStackDepth = newDepth;

      // 3. Update session-aware tracking
      if (nextNav.state === 'ARRIVAL') {
        this.arrivalVisitedInSession = true;
        if (event.state?._arrivalChapter) {
          this.lastArrivalChapter = event.state._arrivalChapter;
        }
        if (event.state?._arrivalScrollTop !== undefined) {
          this.lastArrivalScrollTop = event.state._arrivalScrollTop;
        }
      } else if (nextNav.state === 'DESTINATION_SELECT') {
        this.arrivalVisitedInSession = true;
      } else if (nextNav.state === 'EXHIBITION') {
        this.exhibitionVisitedInSession = true;
        this.artifactOpenedInSession = false;
        this.documentaryOpenedInSession = false;
      } else if (nextNav.state === 'ARTIFACT_DETAILS') {
        this.documentaryOpenedInSession = false;
      }

      // 4. Play intentional distinct audio cues based on Back vs Forward
      if (newDepth < prevDepth) {
        soundManager.playNavBrowserBack();
      } else if (newDepth > prevDepth) {
        soundManager.playNavBrowserForward();
      } else {
        soundManager.playNavReturnToExhibition();
      }

      guideVoiceEngine.stop(false);

      // 5. Atomically update Zustand store without triggering secondary pushState effects
      useExperienceStore.setState({
        state: nextNav.state,
        currentDestination: nextNav.destination,
        selectedArtifactId: nextNav.artifactId,
        activeStoryChapterIndex: nextNav.storyChapterIndex,
        exhibitionView: nextNav.exhibitionView,
        selectedComponentId: null,
      });

      // 6. Synchronize ambient audio matching destination
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
   * Helper to map an ExperienceState to a source tag
   */
  private stateToSource(state: ExperienceState): NavHistoryState['_source'] {
    switch (state) {
      case 'ARRIVAL':
        return 'story';
      case 'DESTINATION_SELECT':
        return 'destinations';
      case 'EXHIBITION':
        return 'exhibition';
      case 'ARTIFACT_DETAILS':
        return 'artifact';
      case 'STORY_CHAPTER':
        return 'story_chapter';
      case 'LEGACY':
        return 'legacy';
      default:
        return 'app';
    }
  }

  /**
   * Parses and sanitizes URL search parameters into a valid navigation state
   */
  public parseUrl(search: string, historyState?: any): ParsedNavState {
    const params = new URLSearchParams(search);

    // 1. Destination sanitization (Strictly 'moon' or 'mars')
    let rawDest = params.get('dest') || historyState?.destination || 'moon';
    let destination: ActiveDestination = 'moon';
    if (rawDest === 'mars') destination = 'mars';

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
      if (params.has('artifact')) {
        state = 'ARTIFACT_DETAILS';
      } else if (params.has('dest')) {
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
        artifactId = destination === 'mars' ? 'opportunity' : 'apollo11_eagle';
      } else {
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
      return window.location.pathname;
    }

    if (nav.state === 'DESTINATION_SELECT') {
      params.set('state', 'destinations');
      if (nav.destination === 'mars') {
        params.set('dest', 'mars');
      }
      return `${window.location.pathname}?${params.toString()}`;
    }

    // Destination-scoped states
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
  private commit(
    nav: ParsedNavState,
    replace = false,
    extraMeta: Record<string, any> = {}
  ) {
    if (this.isHandlingPopstate || typeof window === 'undefined') return;

    const targetUrl = this.buildUrl(nav);
    const currentSearch = window.location.search;
    const currentUrl = currentSearch ? `${window.location.pathname}${currentSearch}` : window.location.pathname;
    const source = extraMeta._source || this.stateToSource(nav.state);

    const historyPayload: NavHistoryState = {
      ...nav,
      _orbitalDepth: this.historyStackDepth,
      _afterlightDepth: this.historyStackDepth,
      _source: source,
      _arrivalChapter: this.lastArrivalChapter,
      _arrivalScrollTop: this.lastArrivalScrollTop,
      ...extraMeta,
    };

    if (replace || targetUrl === currentUrl) {
      window.history.replaceState(historyPayload, '', targetUrl);
    } else {
      this.historyStackDepth += 1;
      historyPayload._orbitalDepth = this.historyStackDepth;
      historyPayload._afterlightDepth = this.historyStackDepth;
      window.history.pushState(historyPayload, '', targetUrl);
    }
  }

  // =========================================================================
  // PUBLIC NAVIGATION API
  // =========================================================================

  /**
   * Save arrival chapter progress and scroll position
   */
  public syncArrivalChapter(chapterId: string, scrollTop?: number) {
    this.lastArrivalChapter = chapterId;
    if (scrollTop !== undefined && scrollTop >= 0) {
      this.lastArrivalScrollTop = scrollTop;
    }
    if (typeof window !== 'undefined' && !this.isHandlingPopstate) {
      const currentState = window.history.state || {};
      window.history.replaceState(
        {
          ...currentState,
          _arrivalChapter: chapterId,
          _arrivalScrollTop: this.lastArrivalScrollTop,
        },
        '',
        window.location.href
      );
    }
  }

  public getLastArrivalChapter(): string {
    return this.lastArrivalChapter;
  }

  public getLastArrivalScrollTop(): number {
    return this.lastArrivalScrollTop;
  }

  /**
   * Save and retrieve exhibition scroll positions
   */
  public saveExhibitionScroll(dest: string, scrollTop: number) {
    this.exhibitionScrollPositions[dest] = Math.max(0, scrollTop);
  }

  public getExhibitionScroll(dest: string): number {
    return this.exhibitionScrollPositions[dest] || 0;
  }

  /**
   * Navigate to Arrival Screen
   */
  public toArrival(targetChapter?: string) {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }
    guideVoiceEngine.stop(false);
    soundManager.stopAmbience();
    soundManager.playNavReturnToExhibition();

    this.arrivalVisitedInSession = true;
    if (targetChapter) {
      this.lastArrivalChapter = targetChapter;
    }

    const nav: ParsedNavState = {
      state: 'ARRIVAL',
      destination: 'moon',
      artifactId: null,
      storyChapterIndex: 0,
      exhibitionView: 'collection',
    };

    const isAlreadyArrival = useExperienceStore.getState().state === 'ARRIVAL';
    this.commit(nav, isAlreadyArrival, {
      _source: 'story',
      _arrivalChapter: this.lastArrivalChapter,
      _arrivalScrollTop: this.lastArrivalScrollTop,
    });

    useExperienceStore.setState({
      state: 'ARRIVAL',
      selectedArtifactId: null,
      selectedComponentId: null,
    });
  }

  /**
   * Return to story without creating duplicate history entries
   */
  public returnToStory() {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }

    // If the user arrived from story in this session and history depth exists:
    if (this.arrivalVisitedInSession && this.historyStackDepth > 0) {
      window.history.back();
      return;
    }

    // Direct entry fallback: transition to story with preserved destination chapter
    this.toArrival(this.lastArrivalChapter || 'scene-destinations');
  }

  /**
   * Navigate to 3D Destination Selection Screen
   */
  public toDestinations(replace = false) {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }
    const prevState = useExperienceStore.getState().state;
    guideVoiceEngine.stop(false);
    if (prevState === 'ARRIVAL') {
      soundManager.playNavArrivalToDestinations();
    } else {
      soundManager.playNavReturnToExhibition();
    }
    soundManager.stopAmbience();

    const currentDest = useExperienceStore.getState().currentDestination === 'mars' ? 'mars' : 'moon';

    const nav: ParsedNavState = {
      state: 'DESTINATION_SELECT',
      destination: currentDest,
      artifactId: null,
      storyChapterIndex: 0,
      exhibitionView: 'collection',
    };

    this.commit(nav, replace, { _source: 'destinations' });

    useExperienceStore.setState({
      state: 'DESTINATION_SELECT',
      selectedArtifactId: null,
      selectedComponentId: null,
      hoveredArtifactId: null,
    });
  }

  /**
   * Synchronize 3D globe destination preview without pushing history entries
   */
  public syncDestinationSelect(destId: ActiveDestination) {
    const validDest: ActiveDestination = destId === 'mars' ? 'mars' : 'moon';
    const nav: ParsedNavState = {
      state: 'DESTINATION_SELECT',
      destination: validDest,
      artifactId: null,
      storyChapterIndex: 0,
      exhibitionView: 'collection',
    };
    // Always use replaceState so globe rotation does not pollute browser Back history
    this.commit(nav, true, { _source: 'destinations' });
    useExperienceStore.setState({ currentDestination: validDest });
  }

  /**
   * Navigate to a Destination with smooth loading descent
   */
  public toDestination(destId: ActiveDestination) {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }

    guideVoiceEngine.stop(false);
    const validDest: ActiveDestination = destId === 'mars' ? 'mars' : 'moon';
    soundManager.playNavLoadingStart();

    const dest = DESTINATIONS[validDest];
    if (dest) {
      soundManager.playAmbience(dest.ambientAudioType);
    }

    // Save arrival state before entering loading
    if (useExperienceStore.getState().state === 'ARRIVAL') {
      this.syncArrivalChapter('scene-destinations', this.lastArrivalScrollTop);
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
    this.exhibitionVisitedInSession = true;
    this.commit(nav, false, { _source: 'exhibition' });

    // 2. Transition cleanly into Exhibition
    this.loadingTimeout = setTimeout(() => {
      this.loadingTimeout = null;
      if (useExperienceStore.getState().state === 'ENVIRONMENT_LOADING') {
        soundManager.playNavLoadingComplete();
        useExperienceStore.setState({ state: 'EXHIBITION' });
      }
    }, transitionDuration);
  }

  /**
   * Navigate to Exhibition (with view mode preservation)
   */
  public toExhibition(destId?: ActiveDestination, viewMode?: 'collection' | 'map', replace = false) {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }

    const prevState = useExperienceStore.getState().state;
    guideVoiceEngine.stop(false);
    if (prevState === 'ARTIFACT_DETAILS' || prevState === 'STORY_CHAPTER' || prevState === 'LEGACY') {
      soundManager.playNavReturnToExhibition();
    } else {
      soundManager.playNavExhibitionEntry();
    }

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
    this.exhibitionVisitedInSession = true;
    this.commit(nav, replace, { _source: 'exhibition' });

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
    if (store.exhibitionView !== viewMode) {
      if (viewMode === 'map') {
        soundManager.playNavExplorationEnter();
      } else {
        soundManager.playNavExplorationExit();
      }
    }

    const nav: ParsedNavState = {
      state: 'EXHIBITION',
      destination: store.currentDestination === 'mars' ? 'mars' : 'moon',
      artifactId: null,
      storyChapterIndex: 0,
      exhibitionView: viewMode,
    };
    // Replace URL state so Back button returns to the previous screen rather than toggling view modes
    this.commit(nav, true, { _source: 'exhibition' });
    useExperienceStore.setState({ exhibitionView: viewMode });
  }

  /**
   * Navigate to Artifact Details
   */
  public toArtifact(artifactId: string, replace = false) {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }

    const artifact = ARTIFACTS[artifactId];
    if (!artifact) return;

    soundManager.playNavArtifactDetailsOpen();
    const destination: ActiveDestination = artifact.destination === 'mars' ? 'mars' : 'moon';

    const discovered = new Set(useExperienceStore.getState().discoveredArtifacts);
    discovered.add(artifactId);

    const isAlreadyArtifact = useExperienceStore.getState().state === 'ARTIFACT_DETAILS';
    const shouldReplace = replace || isAlreadyArtifact;

    this.artifactOpenedInSession = true;

    const nav: ParsedNavState = {
      state: 'ARTIFACT_DETAILS',
      destination,
      artifactId,
      storyChapterIndex: 0,
      exhibitionView: useExperienceStore.getState().exhibitionView || 'collection',
    };
    this.commit(nav, shouldReplace, { _source: 'artifact' });

    useExperienceStore.setState({
      state: 'ARTIFACT_DETAILS',
      currentDestination: destination,
      selectedArtifactId: artifactId,
      selectedComponentId: null,
      discoveredArtifacts: Array.from(discovered),
    });
  }

  /**
   * Close Artifact Details cleanly without creating duplicate history entries
   */
  public closeArtifact() {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }

    // If the artifact was opened during this session with prior history:
    if (this.artifactOpenedInSession && this.historyStackDepth > 0) {
      this.artifactOpenedInSession = false;
      window.history.back();
      return;
    }

    // Direct entry fallback: replace URL with exhibition so depth isn't corrupted
    const store = useExperienceStore.getState();
    const dest = store.currentDestination === 'mars' ? 'mars' : 'moon';
    this.toExhibition(dest, store.exhibitionView || 'collection', true);
  }

  /**
   * Navigate to Documentary Story Chapters
   */
  public toStory(artifactId?: string, chapterIndex = 0) {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }

    const store = useExperienceStore.getState();
    const targetArtifactId = artifactId || store.selectedArtifactId || 'apollo11_eagle';
    const artifact = ARTIFACTS[targetArtifactId];
    if (!artifact) return;

    soundManager.playNavDocumentaryOpen();
    const destination: ActiveDestination = artifact.destination === 'mars' ? 'mars' : 'moon';

    this.documentaryOpenedInSession = true;

    const nav: ParsedNavState = {
      state: 'STORY_CHAPTER',
      destination,
      artifactId: targetArtifactId,
      storyChapterIndex: chapterIndex,
      exhibitionView: store.exhibitionView || 'collection',
    };
    this.commit(nav, false, { _source: 'story_chapter' });

    useExperienceStore.setState({
      state: 'STORY_CHAPTER',
      currentDestination: destination,
      selectedArtifactId: targetArtifactId,
      activeStoryChapterIndex: chapterIndex,
    });
  }

  /**
   * Return from Documentary to Artifact Details
   */
  public closeStoryToArtifact() {
    if (this.documentaryOpenedInSession && this.historyStackDepth > 0) {
      this.documentaryOpenedInSession = false;
      window.history.back();
      return;
    }
    const store = useExperienceStore.getState();
    const artifactId = store.selectedArtifactId || 'apollo11_eagle';
    this.toArtifact(artifactId, true);
  }

  /**
   * Close documentary or legacy directly to Exhibition
   */
  public closeToExhibition(destId?: DestinationId | ActiveDestination) {
    const store = useExperienceStore.getState();
    const targetDest: ActiveDestination = destId === 'mars' ? 'mars' : destId === 'moon' ? 'moon' : (store.currentDestination === 'mars' ? 'mars' : 'moon');
    this.toExhibition(targetDest, 'collection', true);
  }

  /**
   * Update active story chapter (always replaceState)
   */
  public setStoryChapter(chapterIndex: number) {
    const store = useExperienceStore.getState();
    if (chapterIndex > store.activeStoryChapterIndex) {
      soundManager.playNavStoryChapterNext();
    } else if (chapterIndex < store.activeStoryChapterIndex) {
      soundManager.playNavStoryChapterPrev();
    }

    const nav: ParsedNavState = {
      state: 'STORY_CHAPTER',
      destination: store.currentDestination === 'mars' ? 'mars' : 'moon',
      artifactId: store.selectedArtifactId,
      storyChapterIndex: chapterIndex,
      exhibitionView: store.exhibitionView || 'collection',
    };
    // Use replaceState so next/prev doesn't pollute back button with 10 chapter entries
    this.commit(nav, true, { _source: 'story_chapter' });
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
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }

    const store = useExperienceStore.getState();
    const targetArtifactId = artifactId || store.selectedArtifactId || 'apollo11_eagle';
    const artifact = ARTIFACTS[targetArtifactId];
    if (!artifact) return;

    soundManager.playNavLegacyOpen();
    const destination: ActiveDestination = artifact.destination === 'mars' ? 'mars' : 'moon';

    const nav: ParsedNavState = {
      state: 'LEGACY',
      destination,
      artifactId: targetArtifactId,
      storyChapterIndex: 0,
      exhibitionView: store.exhibitionView || 'collection',
    };
    this.commit(nav, false, { _source: 'legacy' });

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
      this.closeStoryToArtifact();
    } else if (current === 'STORY_CHAPTER') {
      this.closeStoryToArtifact();
    } else if (current === 'ARTIFACT_DETAILS') {
      this.closeArtifact();
    } else if (current === 'EXHIBITION') {
      this.returnToStory();
    } else if (current === 'DESTINATION_SELECT') {
      this.toArrival('scene-destinations');
    }
  }

  /**
   * Diagnostic summary for regression testing and telemetry
   */
  public getDiagnostics() {
    return {
      historyStackDepth: this.historyStackDepth,
      isHandlingPopstate: this.isHandlingPopstate,
      lastArrivalChapter: this.lastArrivalChapter,
      lastArrivalScrollTop: this.lastArrivalScrollTop,
      artifactOpenedInSession: this.artifactOpenedInSession,
      documentaryOpenedInSession: this.documentaryOpenedInSession,
      arrivalVisitedInSession: this.arrivalVisitedInSession,
      exhibitionVisitedInSession: this.exhibitionVisitedInSession,
    };
  }
}

export const navigation = new NavigationController();

// Expose globally for diagnostics and verification tests
if (typeof window !== 'undefined') {
  (window as any).__ORBITAL_NAV__ = navigation;
  (window as any).__AFTERLIGHT_NAV__ = navigation;
}
