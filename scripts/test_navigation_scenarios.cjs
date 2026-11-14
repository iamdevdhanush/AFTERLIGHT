/**
 * AFTERLIGHT Navigation Scenario Test Suite
 * Tests scenarios A through J against real NavigationController and ExperienceStore
 */

// 1. Setup minimal browser-like environment in Node
const eventListeners = new Map();

class FakeHistory {
  constructor() {
    this.entries = [{ state: null, title: '', url: 'http://localhost:5173/' }];
    this.currentIndex = 0;
  }

  get state() {
    return this.entries[this.currentIndex]?.state ?? null;
  }

  get length() {
    return this.entries.length;
  }

  pushState(state, title, url) {
    // Truncate any forward history
    this.entries = this.entries.slice(0, this.currentIndex + 1);
    this.entries.push({ state: JSON.parse(JSON.stringify(state)), title, url: url || '' });
    this.currentIndex++;
    syncLocation(url);
  }

  replaceState(state, title, url) {
    this.entries[this.currentIndex] = { state: JSON.parse(JSON.stringify(state)), title, url: url || '' };
    syncLocation(url);
  }

  back() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      const entry = this.entries[this.currentIndex];
      syncLocation(entry.url);
      dispatchPopstate(entry.state);
    }
  }

  forward() {
    if (this.currentIndex < this.entries.length - 1) {
      this.currentIndex++;
      const entry = this.entries[this.currentIndex];
      syncLocation(entry.url);
      dispatchPopstate(entry.state);
    }
  }
}

const fakeHistory = new FakeHistory();

const fakeLocation = {
  pathname: '/',
  search: '',
  get href() {
    return 'http://localhost:5173' + this.pathname + this.search;
  }
};

function syncLocation(url) {
  if (!url) return;
  const full = url.startsWith('http') ? url : 'http://localhost:5173' + url;
  const parsed = new URL(full);
  fakeLocation.pathname = parsed.pathname;
  fakeLocation.search = parsed.search;
}

function dispatchPopstate(state) {
  const listeners = eventListeners.get('popstate') || [];
  const event = { state: JSON.parse(JSON.stringify(state)) };
  for (const listener of listeners) {
    listener(event);
  }
}

globalThis.MutationObserver = class {
  constructor() {}
  observe() {}
  disconnect() {}
  takeRecords() { return []; }
};
globalThis.ResizeObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};
globalThis.CustomEvent = class {
  constructor(type, init) { this.type = type; Object.assign(this, init); }
};
globalThis.Event = globalThis.CustomEvent;

globalThis.document = {
  createElement: (tag) => ({
    tagName: tag.toUpperCase(),
    setAttribute() {},
    getAttribute() { return null; },
    style: {},
    appendChild() {},
    removeChild() {},
    addEventListener() {},
    removeEventListener() {},
    classList: { add() {}, remove() {}, contains() { return false; } }
  }),
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  addEventListener() {},
  removeEventListener() {},
  body: {
    appendChild() {},
    removeChild() {},
    style: {}
  },
  documentElement: {
    style: {},
    clientWidth: 1920,
    clientHeight: 1080
  }
};

function createAudioParam() {
  return {
    value: 1,
    setValueAtTime() { return this; },
    linearRampToValueAtTime() { return this; },
    exponentialRampToValueAtTime() { return this; },
    setTargetAtTime() { return this; }
  };
}

globalThis.window = {
  document: globalThis.document,
  history: fakeHistory,
  location: fakeLocation,
  addEventListener(event, fn) {
    if (!eventListeners.has(event)) eventListeners.set(event, []);
    eventListeners.get(event).push(fn);
  },
  removeEventListener(event, fn) {
    const list = eventListeners.get(event) || [];
    eventListeners.set(event, list.filter(f => f !== fn));
  },
  speechSynthesis: {
    speaking: false,
    cancel() { this.speaking = false; },
    speak() { this.speaking = true; },
    getVoices() { return []; },
    onvoiceschanged: null,
    addEventListener() {},
    removeEventListener() {}
  },
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  AudioContext: class {
    constructor() {
      this.currentTime = 0;
      this.destination = {};
    }
    createGain() { return { connect() {}, gain: createAudioParam() }; }
    createOscillator() { return { connect() {}, start() {}, stop() {}, frequency: createAudioParam() }; }
    createBiquadFilter() { return { connect() {}, frequency: createAudioParam(), Q: createAudioParam() }; }
    createBufferSource() { return { connect() {}, start() {}, stop() {}, buffer: null, loop: false }; }
    createBuffer() { return { getChannelData: () => new Float32Array(100) }; }
    decodeAudioData() { return Promise.resolve({}); }
    resume() { return Promise.resolve(); }
  },
  requestAnimationFrame: (cb) => setTimeout(cb, 16),
  cancelAnimationFrame: (id) => clearTimeout(id)
};

// 2. Load compiled dist bundle or modules to test production behavior
async function runTests() {
  console.log('====================================================');
  console.log('AFTERLIGHT - NAVIGATION SCENARIOS VERIFICATION SUITE');
  console.log('====================================================\n');

  // Dynamically import the compiled production assets or source
  // To test the exact production bundle in dist/assets:
  const fs = require('fs');
  const path = require('path');

  // Find the index-*.js file in dist/assets
  const distAssets = fs.readdirSync('dist/assets');
  const jsFile = distAssets.find(f => f.startsWith('index-') && f.endsWith('.js'));
  console.log('Loading compiled production build:', jsFile);

  const fullPath = path.resolve('dist/assets', jsFile);
  await import('file:///' + fullPath.replace(/\\/g, '/'));

  const nav = globalThis.window.__AFTERLIGHT_NAV__;
  const store = globalThis.window.__EXPERIENCE_STORE__;

  if (!nav || !store) {
    throw new Error('__AFTERLIGHT_NAV__ or __EXPERIENCE_STORE__ not exported on window!');
  }

  console.log('Successfully connected to production navigation controller and store.\n');

  const results = [];
  function record(scenario, passed, details) {
    results.push({ scenario, passed, details });
    console.log(`[${passed ? '✓ PASS' : '✗ FAIL'}] ${scenario}\n   Details: ${details}\n`);
  }

  function getNavSummary() {
    const s = store.getState();
    return {
      state: s.state,
      dest: s.currentDestination,
      artifact: s.selectedArtifactId,
      view: s.exhibitionView,
      depth: nav.getDepth(),
      search: globalThis.window.location.search
    };
  }

  // -------------------------------------------------------------------------
  // Scenario A: Arrival → Destination Select → Moon Museum → Artifact Details → Back → Back → Forward
  // -------------------------------------------------------------------------
  nav.toArrival();
  let s = getNavSummary();
  const a1 = s.state === 'ARRIVAL';

  nav.toDestinations();
  s = getNavSummary();
  const a2 = s.state === 'DESTINATION_SELECT' && s.depth === 1;

  nav.toDestination('moon');
  // Transition into exhibition
  store.setState({ state: 'EXHIBITION' });
  s = getNavSummary();
  const a3 = s.state === 'EXHIBITION' && s.dest === 'moon' && s.depth === 2;

  nav.toArtifact('apollo11_eagle');
  s = getNavSummary();
  const a4 = s.state === 'ARTIFACT_DETAILS' && s.artifact === 'apollo11_eagle' && s.depth === 3;

  // 1st Back: Must return to Moon Museum (depth 2)
  fakeHistory.back();
  s = getNavSummary();
  const a5 = s.state === 'EXHIBITION' && s.dest === 'moon' && s.artifact === null && s.depth === 2;

  // 2nd Back: Must return to Destination Select (depth 1)
  fakeHistory.back();
  s = getNavSummary();
  const a6 = s.state === 'DESTINATION_SELECT' && s.depth === 1;

  // Forward: Must restore Moon Museum (depth 2)
  fakeHistory.forward();
  s = getNavSummary();
  const a7 = s.state === 'EXHIBITION' && s.dest === 'moon' && s.artifact === null && s.depth === 2;

  const passA = a1 && a2 && a3 && a4 && a5 && a6 && a7;
  record('Scenario A (Arrival → Destination Select → Moon Museum → Artifact Details → Back → Back → Forward)', passA,
    `Arrival=${a1}, DestSelect=${a2}, MoonMuseum=${a3}, ArtifactDetails=${a4}, BackToMoon=${a5}, BackToDest=${a6}, ForwardToMoon=${a7}`);

  // -------------------------------------------------------------------------
  // Scenario B: Mars Museum → Opportunity → Documentary → Back → Exhibition
  // -------------------------------------------------------------------------
  nav.toExhibition('mars', 'collection');
  s = getNavSummary();
  const b1 = s.state === 'EXHIBITION' && s.dest === 'mars';

  nav.toArtifact('opportunity');
  s = getNavSummary();
  const b2 = s.state === 'ARTIFACT_DETAILS' && s.artifact === 'opportunity';

  nav.toStory('opportunity', 0);
  s = getNavSummary();
  const b3 = s.state === 'STORY_CHAPTER' && s.artifact === 'opportunity';

  // Back from Documentary: Should return to Opportunity
  nav.goBack();
  s = getNavSummary();
  const b4 = s.state === 'ARTIFACT_DETAILS' && s.artifact === 'opportunity';

  // Back from Opportunity: Should return to Mars Exhibition
  nav.goBack();
  s = getNavSummary();
  const b5 = s.state === 'EXHIBITION' && s.dest === 'mars' && s.artifact === null;

  const passB = b1 && b2 && b3 && b4 && b5;
  record('Scenario B (Mars Museum → Opportunity → Documentary → Back → Exhibition)', passB,
    `MarsMuseum=${b1}, Opportunity=${b2}, Documentary=${b3}, BackToArtifact=${b4}, BackToExhibition=${b5}`);

  // -------------------------------------------------------------------------
  // Scenario C: Moon Museum → Legacy → Back
  // -------------------------------------------------------------------------
  nav.toExhibition('moon', 'collection');
  s = getNavSummary();
  const c1 = s.state === 'EXHIBITION' && s.dest === 'moon';

  nav.toLegacy('apollo11_eagle');
  s = getNavSummary();
  const c2 = s.state === 'LEGACY' && s.artifact === 'apollo11_eagle';

  // Back from Legacy: Should return to Moon Museum
  nav.goBack();
  s = getNavSummary();
  const c3 = s.state === 'EXHIBITION' && s.dest === 'moon';

  const passC = c1 && c2 && c3;
  record('Scenario C (Moon Museum → Legacy → Back)', passC,
    `MoonMuseum=${c1}, Legacy=${c2}, BackToMoon=${c3}`);

  // -------------------------------------------------------------------------
  // Scenario D: Moon Collection → Moon Map → Mars Map → Mars Collection
  // -------------------------------------------------------------------------
  nav.toExhibition('moon', 'collection');
  s = getNavSummary();
  const d1 = s.state === 'EXHIBITION' && s.dest === 'moon' && s.view === 'collection';

  // Switch to Moon Map
  nav.setExhibitionView('map');
  s = getNavSummary();
  const d2 = s.view === 'map' && s.dest === 'moon';

  // Switch to Mars Map
  nav.toExhibition('mars', 'map', true);
  s = getNavSummary();
  const d3 = s.dest === 'mars' && s.view === 'map';

  // Switch to Mars Collection
  nav.setExhibitionView('collection');
  s = getNavSummary();
  const d4 = s.dest === 'mars' && s.view === 'collection';

  const passD = d1 && d2 && d3 && d4;
  record('Scenario D (Moon Collection → Moon Map → Mars Map → Mars Collection)', passD,
    `MoonCollection=${d1}, MoonMap=${d2}, MarsMap=${d3}, MarsCollection=${d4}`);

  // -------------------------------------------------------------------------
  // Scenario E: Rapidly enter and exit artifact details at least 10 times
  // -------------------------------------------------------------------------
  nav.toExhibition('moon', 'collection');
  const baseDepth = nav.getDepth();
  let rapidOk = true;

  for (let i = 0; i < 12; i++) {
    nav.toArtifact('apollo11_eagle');
    if (store.getState().state !== 'ARTIFACT_DETAILS' || store.getState().selectedArtifactId !== 'apollo11_eagle') {
      rapidOk = false;
      break;
    }
    nav.goBack();
    if (store.getState().state !== 'EXHIBITION' || store.getState().selectedArtifactId !== null) {
      rapidOk = false;
      break;
    }
  }
  const finalDepth = nav.getDepth();
  const depthStable = finalDepth === baseDepth;

  // Verify responsive afterwards
  nav.toArtifact('surveyor3');
  const postOpen = store.getState().selectedArtifactId === 'surveyor3';
  nav.goBack();
  const postClose = store.getState().selectedArtifactId === null && store.getState().state === 'EXHIBITION';

  const passE = rapidOk && depthStable && postOpen && postClose;
  record('Scenario E (Rapidly enter and exit artifact details >= 10 times)', passE,
    `RapidLoop12x=${rapidOk}, DepthStable(${baseDepth}==${finalDepth})=${depthStable}, PostOpen=${postOpen}, PostClose=${postClose}`);

  // -------------------------------------------------------------------------
  // Scenario F: Navigate repeatedly between Museum and other screens without refreshing
  // -------------------------------------------------------------------------
  const steps = [
    () => nav.toDestinations(),
    () => nav.toArrival(),
    () => nav.toDestinations(),
    () => nav.toExhibition('mars', 'collection'),
    () => nav.toArtifact('opportunity'),
    () => nav.toStory('opportunity', 2),
    () => nav.toLegacy('opportunity'),
    () => nav.toExhibition('moon', 'collection'),
    () => nav.toArtifact('apollo_lrv'),
    () => nav.toExhibition('moon', 'map'),
  ];
  for (const step of steps) step();
  s = getNavSummary();
  const passF = s.state === 'EXHIBITION' && s.dest === 'moon' && s.view === 'map';
  record('Scenario F (Navigate repeatedly across screens without refresh)', passF,
    `FinalState=${s.state}, FinalDest=${s.dest}, FinalView=${s.view}`);

  // -------------------------------------------------------------------------
  // Scenario G: Use browser Back and Forward repeatedly after several different Museum interactions
  // -------------------------------------------------------------------------
  // Execute several museum interactions:
  nav.toExhibition('moon', 'collection'); // Interaction 1: Moon Museum
  nav.toArtifact('apollo11_eagle');       // Interaction 2: Examine Eagle
  nav.toExhibition('mars', 'collection'); // Interaction 3: Mars Museum
  nav.toArtifact('opportunity');          // Interaction 4: Examine Opportunity

  // Test browser Back 3 times:
  fakeHistory.back();
  s = getNavSummary();
  const g1 = s.state === 'EXHIBITION' && s.dest === 'mars' && s.artifact === null;

  fakeHistory.back();
  s = getNavSummary();
  const g2 = s.state === 'ARTIFACT_DETAILS' && s.artifact === 'apollo11_eagle' && s.dest === 'moon';

  fakeHistory.back();
  s = getNavSummary();
  const g3 = s.state === 'EXHIBITION' && s.dest === 'moon' && s.artifact === null;

  // Test browser Forward 3 times:
  fakeHistory.forward();
  s = getNavSummary();
  const g4 = s.state === 'ARTIFACT_DETAILS' && s.artifact === 'apollo11_eagle' && s.dest === 'moon';

  fakeHistory.forward();
  s = getNavSummary();
  const g5 = s.state === 'EXHIBITION' && s.dest === 'mars' && s.artifact === null;

  fakeHistory.forward();
  s = getNavSummary();
  const g6 = s.state === 'ARTIFACT_DETAILS' && s.artifact === 'opportunity' && s.dest === 'mars';

  const passG = g1 && g2 && g3 && g4 && g5 && g6;
  record('Scenario G (Repeated browser Back and Forward after Museum interactions)', passG,
    `BackToMarsMuseum=${g1}, BackToEagle=${g2}, BackToMoonMuseum=${g3}, FwdToEagle=${g4}, FwdToMarsMuseum=${g5}, FwdToOpportunity=${g6}`);

  // -------------------------------------------------------------------------
  // Scenario H: Open Museum directly through a URL and refresh
  // -------------------------------------------------------------------------
  // Simulate opening directly at ?dest=mars
  syncLocation('http://localhost:5173/?dest=mars');
  fakeHistory.entries = [{ state: { _afterlightDepth: 0 }, title: '', url: 'http://localhost:5173/?dest=mars' }];
  fakeHistory.currentIndex = 0;
  nav.init();
  s = getNavSummary();
  const h1 = s.state === 'EXHIBITION' && s.dest === 'mars';

  // Refresh (re-run init with same URL)
  nav.init();
  s = getNavSummary();
  const h2 = s.state === 'EXHIBITION' && s.dest === 'mars';

  // Direct artifact entry ?dest=moon&artifact=apollo11_eagle at depth 0
  syncLocation('http://localhost:5173/?dest=moon&artifact=apollo11_eagle');
  fakeHistory.entries = [{ state: { _afterlightDepth: 0 }, title: '', url: 'http://localhost:5173/?dest=moon&artifact=apollo11_eagle' }];
  fakeHistory.currentIndex = 0;
  nav.init();
  s = getNavSummary();
  const h3 = s.state === 'ARTIFACT_DETAILS' && s.artifact === 'apollo11_eagle' && s.dest === 'moon';

  // Refresh artifact entry
  nav.init();
  s = getNavSummary();
  const h4 = s.state === 'ARTIFACT_DETAILS' && s.artifact === 'apollo11_eagle';

  // Back from direct URL entry at depth 0: Must fallback to parent Exhibition with replaceState
  nav.goBack();
  s = getNavSummary();
  const h5 = s.state === 'EXHIBITION' && s.dest === 'moon' && s.artifact === null;

  const passH = h1 && h2 && h3 && h4 && h5;
  record('Scenario H (Open Museum directly through a URL and refresh)', passH,
    `DirectMarsMuseum=${h1}, RefreshMarsMuseum=${h2}, DirectMoonArtifact=${h3}, RefreshArtifact=${h4}, FallbackToExhibition=${h5}`);

  // -------------------------------------------------------------------------
  // Scenario I: Attempt navigation after opening and closing overlays
  // -------------------------------------------------------------------------
  nav.toExhibition('moon', 'collection');
  nav.toArtifact('apollo_alsep');
  const i1 = store.getState().selectedArtifactId === 'apollo_alsep';
  nav.goBack();
  const i2 = store.getState().selectedArtifactId === null && store.getState().state === 'EXHIBITION';

  nav.toArtifact('surveyor3');
  const i3 = store.getState().selectedArtifactId === 'surveyor3';
  nav.goBack();
  const i4 = store.getState().selectedArtifactId === null && store.getState().state === 'EXHIBITION';

  nav.toDestinations();
  const i5 = store.getState().state === 'DESTINATION_SELECT';

  const passI = i1 && i2 && i3 && i4 && i5;
  record('Scenario I (Navigation after opening and closing overlays)', passI,
    `OpenAlsep=${i1}, CloseAlsep=${i2}, OpenSurveyor=${i3}, CloseSurveyor=${i4}, ToDestinations=${i5}`);

  // -------------------------------------------------------------------------
  // Scenario J: Leave narration running, navigate away, and verify audio cleanup does not break navigation
  // -------------------------------------------------------------------------
  nav.toExhibition('moon', 'collection');
  nav.toArtifact('apollo11_eagle');
  globalThis.window.speechSynthesis.speak();
  const jSpeaking = globalThis.window.speechSynthesis.speaking;

  // Navigate away to Mars Exhibition
  nav.toExhibition('mars', 'collection');
  s = getNavSummary();
  const jNavSuccess = s.state === 'EXHIBITION' && s.dest === 'mars';
  const jAudioClean = !globalThis.window.speechSynthesis.speaking;

  const passJ = jSpeaking && jNavSuccess && jAudioClean;
  record('Scenario J (Leave narration running, navigate away, verify audio cleanup)', passJ,
    `NarrationStarted=${jSpeaking}, NavCompleted=${jNavSuccess}, NarrationCleaned=${jAudioClean}`);

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('====================================================');
  console.log('FINAL AUTOMATED TEST SUITE SUMMARY');
  console.log('====================================================');
  let allPass = true;
  for (const r of results) {
    console.log(`${r.passed ? '✓ PASS' : '✗ FAIL'} : ${r.scenario}`);
    if (!r.passed) allPass = false;
  }
  console.log(`\nOverall Test Result: ${allPass ? 'ALL SCENARIOS PASSED (10/10)' : 'SOME SCENARIOS FAILED'}`);
  process.exit(allPass ? 0 : 1);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
