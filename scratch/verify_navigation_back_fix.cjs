const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 5174;
const CDP_PORT = 9290;

async function runVerification() {
  console.log('================================================================');
  console.log('ORBITAL BROWSER BACK NAVIGATION — AUTOMATED VERIFICATION SUITE');
  console.log('================================================================\n');

  // 1. Static Web Server
  const server = http.createServer((req, res) => {
    let reqPath = decodeURIComponent(req.url.split('?')[0]);
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    let filePath = path.join('d:\\NASA\\dist', reqPath);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      const pubPath = path.join('d:\\NASA\\public', reqPath);
      if (fs.existsSync(pubPath) && fs.statSync(pubPath).isFile()) {
        filePath = pubPath;
      } else {
        filePath = path.join('d:\\NASA\\dist', 'index.html');
      }
    }
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.woff2': 'font/woff2',
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });

  try {
    await new Promise((resolve, reject) => {
      server.listen(PORT, '127.0.0.1', resolve).on('error', (err) => {
        if (err.code === 'EADDRINUSE') resolve();
        else reject(err);
      });
    });
  } catch {}
  console.log(`✓ Web Server active on http://127.0.0.1:${PORT}`);

  // 2. Launch Microsoft Edge in Headless mode with CDP
  console.log(`Launching Microsoft Edge CDP on port ${CDP_PORT}...`);
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--enable-webgl',
    '--use-gl=angle',
    '--window-size=1920,1080',
    '--no-sandbox',
    '--autoplay-policy=no-user-gesture-required',
    'about:blank'
  ]);

  let targets = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      targets = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${CDP_PORT}/json`, res => {
          let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d)));
        }).on('error', reject);
      });
      if (targets && targets.length > 0) break;
    } catch {}
  }

  const pageTarget = targets.find(t => t.type === 'page') || targets[0];
  const ws = new globalThis.WebSocket(pageTarget.webSocketDebuggerUrl);
  let id = 1;
  const callbacks = new Map();

  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && callbacks.has(m.id)) {
      const cb = callbacks.get(m.id);
      callbacks.delete(m.id);
      if (m.error) cb.reject(m.error);
      else cb.resolve(m.result);
    }
  };

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const reqId = id++;
      callbacks.set(reqId, { resolve, reject });
      ws.send(JSON.stringify({ id: reqId, method, params }));
    });
  }

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Runtime.enable');

  const evalFn = exp => send('Runtime.evaluate', { expression: exp, returnByValue: true, awaitPromise: true }).then(r => r.result?.value);

  async function getSnapshot() {
    return await evalFn(`({
      url: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      historyLength: window.history.length,
      orbitalDepth: window.history.state?._orbitalDepth,
      arrivalChapter: window.history.state?._arrivalChapter,
      storeState: window.__EXPERIENCE_STORE__?.getState().state,
      storeDest: window.__EXPERIENCE_STORE__?.getState().currentDestination,
      storeArtifact: window.__EXPERIENCE_STORE__?.getState().selectedArtifactId,
      headerTitle: document.querySelector('header')?.innerText?.replace(/\\n/g, ' | '),
      diagnostics: window.__ORBITAL_NAV__?.getDiagnostics()
    })`);
  }

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // -------------------------------------------------------------------------
  // TEST SUITE 1: The Exact User Sequence (Arrival -> Mars -> Native Back)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 1: Exact User Sequence (Arrival -> Mars -> Back -> Forward) ---');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
  await new Promise(r => setTimeout(r, 2000));
  let snap = await getSnapshot();
  assert(snap.storeState === 'ARRIVAL', 'Initial state is ARRIVAL');
  assert(snap.search === '', 'Initial search query is empty');

  // Click SKIP TO MUSEUM
  console.log('Navigating to Chapter 4 via SKIP TO MUSEUM...');
  await evalFn(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('SKIP TO MUSEUM'));
    if (btn) btn.click();
  })()`);
  await new Promise(r => setTimeout(r, 800));
  snap = await getSnapshot();
  assert(snap.headerTitle.includes('04. DESTINATIONS'), 'Active chapter indicator is 04. DESTINATIONS');

  // Click Mars Portal Card
  console.log('Clicking Mars Portal Card...');
  await evalFn(`(() => {
    const h3 = Array.from(document.querySelectorAll('h3')).find(h => h.innerText === 'MARS');
    if (h3) {
      const card = h3.closest('div.group');
      if (card) card.click();
    }
  })()`);
  await new Promise(r => setTimeout(r, 2000)); // Wait for 1100ms loading transition
  snap = await getSnapshot();
  assert(snap.search === '?dest=mars', 'URL updated to ?dest=mars');
  assert(snap.storeState === 'EXHIBITION', 'Store state transitioned to EXHIBITION');
  assert(snap.storeDest === 'mars', 'Store destination is mars');

  // Press Native Browser Back
  console.log('Pressing Native Browser Back from Mars Museum...');
  await evalFn('window.history.back()');
  await new Promise(r => setTimeout(r, 1200));
  snap = await getSnapshot();
  assert(snap.storeState === 'ARRIVAL', 'Store state returned to ARRIVAL on Back');
  assert(snap.search === '', 'URL returned to root on Back');
  assert(snap.headerTitle.includes('04. DESTINATIONS'), 'Scroll position preserved at Chapter 04. DESTINATIONS on Back');

  // Press Native Browser Forward
  console.log('Pressing Native Browser Forward...');
  await evalFn('window.history.forward()');
  await new Promise(r => setTimeout(r, 1500));
  snap = await getSnapshot();
  assert(snap.storeState === 'EXHIBITION', 'Store state returned to EXHIBITION on Forward');
  assert(snap.storeDest === 'mars', 'Store destination restored to mars on Forward');
  assert(snap.search === '?dest=mars', 'URL restored to ?dest=mars on Forward');

  // -------------------------------------------------------------------------
  // TEST SUITE 2: Repeat using the Moon
  // -------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 2: Destination Switch and Moon Navigation ---');
  // From Mars Museum, press Back to Arrival Chapter 4
  await evalFn('window.history.back()');
  await new Promise(r => setTimeout(r, 1200));

  // Click Moon Portal Card
  console.log('Clicking The Moon Portal Card in Chapter 4...');
  await evalFn(`(() => {
    const h3 = Array.from(document.querySelectorAll('h3')).find(h => h.innerText === 'THE MOON');
    if (h3) {
      const card = h3.closest('div.group');
      if (card) card.click();
    }
  })()`);
  await new Promise(r => setTimeout(r, 2000));
  snap = await getSnapshot();
  assert(snap.search === '?dest=moon', 'URL updated to ?dest=moon');
  assert(snap.storeState === 'EXHIBITION', 'Store state is EXHIBITION');
  assert(snap.storeDest === 'moon', 'Store destination is moon');

  // Press Back from Moon
  console.log('Pressing Back from Moon Museum...');
  await evalFn('window.history.back()');
  await new Promise(r => setTimeout(r, 1200));
  snap = await getSnapshot();
  assert(snap.storeState === 'ARRIVAL', 'Store state returned to ARRIVAL from Moon');
  assert(snap.headerTitle.includes('04. DESTINATIONS'), 'Returned cleanly to Chapter 4 Destinations');

  // -------------------------------------------------------------------------
  // TEST SUITE 3: Artifact Inspection Open / Close Trap Verification
  // -------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 3: Artifact Detail Open / Close (No Duplicate History) ---');
  // Forward to Moon Museum
  await evalFn('window.history.forward()');
  await new Promise(r => setTimeout(r, 1500));
  const preOpenSnap = await getSnapshot();
  const baseHistLength = preOpenSnap.historyLength;

  // Open Apollo 11 Eagle
  console.log('Opening Apollo 11 Eagle artifact details...');
  await evalFn('window.__EXPERIENCE_STORE__.getState().selectArtifact("apollo11_eagle")');
  await new Promise(r => setTimeout(r, 1200));
  snap = await getSnapshot();
  assert(snap.storeState === 'ARTIFACT_DETAILS', 'Store state is ARTIFACT_DETAILS');
  assert(snap.storeArtifact === 'apollo11_eagle', 'Selected artifact is apollo11_eagle');
  assert(snap.search.includes('artifact=apollo11_eagle'), 'URL contains artifact=apollo11_eagle');
  assert(snap.historyLength === baseHistLength + 1, 'History length incremented exactly by 1 for artifact modal');

  // Close artifact via in-app return / closeArtifact
  console.log('Closing artifact via returnToExhibition()...');
  await evalFn('window.__EXPERIENCE_STORE__.getState().returnToExhibition()');
  await new Promise(r => setTimeout(r, 1200));
  snap = await getSnapshot();
  assert(snap.storeState === 'EXHIBITION', 'Store state returned to EXHIBITION');
  assert(snap.storeArtifact === null, 'Selected artifact is null (modal closed)');
  assert(snap.search === '?dest=moon', 'URL restored to ?dest=moon');
  assert(snap.historyLength === baseHistLength + 1, 'History length did NOT bloat after closing');

  // Press Browser Back — MUST NOT REOPEN ARTIFACT
  console.log('Pressing native browser Back from Exhibition floor...');
  await evalFn('window.history.back()');
  await new Promise(r => setTimeout(r, 1200));
  snap = await getSnapshot();
  assert(snap.storeState === 'ARRIVAL', 'Back successfully returned to ARRIVAL (DID NOT REOPEN ARTIFACT)');
  assert(snap.storeArtifact === null, 'Artifact remains null');

  // -------------------------------------------------------------------------
  // TEST SUITE 4: Native Browser Back directly inside Artifact Details
  // -------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 4: Native Browser Back directly while Artifact Modal is Open ---');
  // Forward back to Moon Museum
  await evalFn('window.history.forward()');
  await new Promise(r => setTimeout(r, 1500));

  // Open Apollo LRV
  console.log('Opening Apollo Lunar Roving Vehicle details...');
  await evalFn('window.__EXPERIENCE_STORE__.getState().selectArtifact("apollo_lrv")');
  await new Promise(r => setTimeout(r, 1200));
  snap = await getSnapshot();
  assert(snap.storeArtifact === 'apollo_lrv', 'Apollo LRV is open');

  // Press Native Browser Back
  console.log('Pressing Native Browser Back while LRV is open...');
  await evalFn('window.history.back()');
  await new Promise(r => setTimeout(r, 1200));
  snap = await getSnapshot();
  assert(snap.storeState === 'EXHIBITION', 'Modal closed and museum floor returned');
  assert(snap.storeArtifact === null, 'Artifact is null');
  assert(snap.search === '?dest=moon', 'URL returned to ?dest=moon');

  // -------------------------------------------------------------------------
  // TEST SUITE 5: In-App "RETURN TO STORY"
  // -------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 5: In-App "RETURN TO STORY" Control ---');
  console.log('Clicking in-app RETURN TO STORY button...');
  await evalFn('window.__ORBITAL_NAV__.returnToStory()');
  await new Promise(r => setTimeout(r, 1200));
  snap = await getSnapshot();
  assert(snap.storeState === 'ARRIVAL', 'In-app returnToStory transitioned to ARRIVAL');
  assert(snap.search === '', 'URL is root');

  // -------------------------------------------------------------------------
  // TEST SUITE 6: 3D Globe Selector Destination Switching (replaceState sync)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 6: 3D Globe Selector Destination Sync ---');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?state=destinations` });
  await new Promise(r => setTimeout(r, 1500));
  snap = await getSnapshot();
  assert(snap.storeState === 'DESTINATION_SELECT', 'On 3D Globe Selector Screen');

  console.log('Selecting Mars on 3D globe...');
  await evalFn('window.__EXPERIENCE_STORE__.getState().previewDestination("mars")');
  await new Promise(r => setTimeout(r, 800));
  snap = await getSnapshot();
  assert(snap.storeDest === 'mars', 'currentDestination is mars');
  assert(snap.search.includes('dest=mars'), 'URL synchronized to dest=mars via replaceState');

  console.log('Entering Mars Museum from 3D globe...');
  await evalFn('window.__ORBITAL_NAV__.toDestination("mars")');
  await new Promise(r => setTimeout(r, 2000));
  snap = await getSnapshot();
  assert(snap.storeState === 'EXHIBITION' && snap.storeDest === 'mars', 'Entered Mars Museum');

  console.log('Pressing Browser Back...');
  await evalFn('window.history.back()');
  await new Promise(r => setTimeout(r, 1200));
  snap = await getSnapshot();
  assert(snap.storeState === 'DESTINATION_SELECT', 'Returned to 3D Globe Selector');
  assert(snap.storeDest === 'mars', 'Mars destination was preserved on 3D globe');

  // -------------------------------------------------------------------------
  // TEST SUITE 7: Direct URL Deep Links
  // -------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 7: Direct URL Deep Links ---');
  // 1. Direct link to Mars
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?dest=mars` });
  await new Promise(r => setTimeout(r, 1500));
  snap = await getSnapshot();
  assert(snap.storeState === 'EXHIBITION' && snap.storeDest === 'mars', 'Direct deep link to /?dest=mars works');

  // 2. Direct link to Opportunity Artifact
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?dest=mars&artifact=opportunity` });
  await new Promise(r => setTimeout(r, 1500));
  snap = await getSnapshot();
  assert(snap.storeState === 'ARTIFACT_DETAILS' && snap.storeArtifact === 'opportunity', 'Direct deep link to /?dest=mars&artifact=opportunity works');

  // Close artifact on fresh direct entry
  console.log('Closing artifact on fresh direct entry...');
  await evalFn('window.__ORBITAL_NAV__.closeArtifact()');
  await new Promise(r => setTimeout(r, 1200));
  snap = await getSnapshot();
  assert(snap.storeState === 'EXHIBITION' && snap.search === '?dest=mars', 'Direct close replaces URL with /?dest=mars cleanly');

  // -------------------------------------------------------------------------
  // TEST SUITE 8: 10 Consecutive Back / Forward Stress Test
  // -------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 8: 10 Consecutive Native Back / Forward Stress Test ---');
  // Build a multi-step history stack:
  // 1: /
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
  await new Promise(r => setTimeout(r, 1500));
  // 2: /?dest=moon
  await evalFn('window.__ORBITAL_NAV__.toDestination("moon")');
  await new Promise(r => setTimeout(r, 1800));
  // 3: /?dest=moon&artifact=apollo11_eagle
  await evalFn('window.__EXPERIENCE_STORE__.getState().selectArtifact("apollo11_eagle")');
  await new Promise(r => setTimeout(r, 1200));
  // 4: /?dest=moon&artifact=apollo11_eagle&view=story
  await evalFn('window.__EXPERIENCE_STORE__.getState().enterStory()');
  await new Promise(r => setTimeout(r, 1200));
  // 5: /?dest=moon&artifact=apollo11_eagle&view=legacy
  await evalFn('window.__EXPERIENCE_STORE__.getState().enterLegacy()');
  await new Promise(r => setTimeout(r, 1200));

  snap = await getSnapshot();
  console.log(`Starting stress test at: ${snap.url} (State: ${snap.storeState})`);

  // Execute 4 consecutive Back operations
  for (let step = 1; step <= 4; step++) {
    await evalFn('window.history.back()');
    await new Promise(r => setTimeout(r, 1000));
    snap = await getSnapshot();
    console.log(`  Back step ${step} -> State: ${snap.storeState}, URL: ${snap.search || '/'}`);
    assert(snap.storeState !== undefined, `State remains valid after Back step ${step}`);
  }

  // Execute 4 consecutive Forward operations
  for (let step = 1; step <= 4; step++) {
    await evalFn('window.history.forward()');
    await new Promise(r => setTimeout(r, 1000));
    snap = await getSnapshot();
    console.log(`  Forward step ${step} -> State: ${snap.storeState}, URL: ${snap.search || '/'}`);
    assert(snap.storeState !== undefined, `State remains valid after Forward step ${step}`);
  }

  console.log('\n================================================================');
  console.log(`ALL TESTS PASSED! (${passedTests} / ${totalTests} assertions passed)`);
  console.log('================================================================\n');

  ws.close();
  edgeProc.kill();
  try { server.close(); } catch {}
  process.exit(0);
}

runVerification().catch(err => {
  console.error('\nTest Suite Failed:', err);
  process.exit(1);
});
