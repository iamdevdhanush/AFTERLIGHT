const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');

async function main() {
  console.log('====================================================');
  console.log('AFTERLIGHT - AUTOMATED REAL BROWSER NAVIGATION TESTS');
  console.log('====================================================\n');

  console.log('Starting preview server on port 5150...');
  const previewProc = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--port', '5150', '--host', '127.0.0.1'], {
    stdio: 'ignore'
  });

  await new Promise(r => setTimeout(r, 2000));

  const browserPath = fs.existsSync('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe')
    ? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
    : 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  console.log('Launching headless browser:', browserPath);
  const browserProc = spawn(browserPath, [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--enable-webgl',
    '--use-gl=angle',
    '--window-size=1920,1080',
    '--no-sandbox',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  function getTargets() {
    return new Promise((resolve, reject) => {
      http.get('http://127.0.0.1:9223/json', res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });
  }

  const targets = await getTargets();
  const pageTarget = targets.find(t => t.type === 'page') || targets[0];
  console.log('Connected to target:', pageTarget.webSocketDebuggerUrl);

  const WS = globalThis.WebSocket;
  const ws = new WS(pageTarget.webSocketDebuggerUrl);

  let id = 1;
  const callbacks = new Map();
  const consoleErrors = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      if (msg.params.type === 'error') {
        const text = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
        consoleErrors.push(text);
        console.error('  [BROWSER CONSOLE ERROR]:', text);
      }
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      const text = msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text;
      consoleErrors.push(text);
      console.error('  [BROWSER UNHANDLED EXCEPTION]:', text);
    }
    if (msg.id && callbacks.has(msg.id)) {
      const cb = callbacks.get(msg.id);
      callbacks.delete(msg.id);
      if (msg.error) cb.reject(msg.error);
      else cb.resolve(msg.result);
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

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text);
    }
    return res.result?.value;
  }

  async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  async function getAppState() {
    return await evaluate(`({
      state: window.__EXPERIENCE_STORE__?.getState().state,
      destination: window.__EXPERIENCE_STORE__?.getState().currentDestination,
      selectedArtifactId: window.__EXPERIENCE_STORE__?.getState().selectedArtifactId,
      exhibitionView: window.__EXPERIENCE_STORE__?.getState().exhibitionView,
      depth: window.__AFTERLIGHT_NAV__?.getDepth(),
      url: window.location.pathname + window.location.search
    })`);
  }

  const results = [];

  function recordResult(scenario, passed, details) {
    results.push({ scenario, passed, details });
    const mark = passed ? '✓ PASS' : '✗ FAIL';
    console.log(`[${mark}] ${scenario}: ${details}`);
  }

  try {
    // -------------------------------------------------------------------------
    // Scenario A: Arrival → Destination Select → Moon Museum → Artifact Details → Back → Back → Forward
    // -------------------------------------------------------------------------
    console.log('\n--- Running Scenario A ---');
    await send('Page.navigate', { url: 'http://127.0.0.1:5150/' });
    await sleep(1500);

    let stateA = await getAppState();
    const a0 = stateA.state === 'ARRIVAL';

    // Navigate to Destination Select
    await evaluate(`window.__AFTERLIGHT_NAV__.toDestinations()`);
    await sleep(500);
    stateA = await getAppState();
    const a1 = stateA.state === 'DESTINATION_SELECT';

    // Navigate to Moon Museum
    await evaluate(`window.__AFTERLIGHT_NAV__.toDestination('moon')`);
    await sleep(1300); // loading transition duration
    stateA = await getAppState();
    const a2 = stateA.state === 'EXHIBITION' && stateA.destination === 'moon';

    // Navigate to Artifact Details
    await evaluate(`window.__AFTERLIGHT_NAV__.toArtifact('apollo11_eagle')`);
    await sleep(500);
    stateA = await getAppState();
    const a3 = stateA.state === 'ARTIFACT_DETAILS' && stateA.selectedArtifactId === 'apollo11_eagle';

    // 1st Back: Should return to Moon Museum
    await evaluate(`window.history.back()`);
    await sleep(500);
    stateA = await getAppState();
    const a4 = stateA.state === 'EXHIBITION' && stateA.selectedArtifactId === null;

    // 2nd Back: Should return to Destination Select
    await evaluate(`window.history.back()`);
    await sleep(500);
    stateA = await getAppState();
    const a5 = stateA.state === 'DESTINATION_SELECT';

    // Forward: Should restore Moon Museum
    await evaluate(`window.history.forward()`);
    await sleep(500);
    stateA = await getAppState();
    const a6 = stateA.state === 'EXHIBITION' && stateA.destination === 'moon';

    const passA = a0 && a1 && a2 && a3 && a4 && a5 && a6;
    recordResult('Scenario A (Arrival → DestSelect → Moon → Artifact → Back → Back → Forward)', passA,
      `Arrival=${a0}, DestSelect=${a1}, Moon=${a2}, Artifact=${a3}, Back1=${a4}, Back2=${a5}, Forward=${a6}`);

    // -------------------------------------------------------------------------
    // Scenario B: Mars Museum → Opportunity → Documentary → Back → Exhibition
    // -------------------------------------------------------------------------
    console.log('\n--- Running Scenario B ---');
    await evaluate(`window.__AFTERLIGHT_NAV__.toExhibition('mars', 'collection')`);
    await sleep(500);
    let stateB = await getAppState();
    const b1 = stateB.state === 'EXHIBITION' && stateB.destination === 'mars';

    // Select Opportunity
    await evaluate(`window.__AFTERLIGHT_NAV__.toArtifact('opportunity')`);
    await sleep(500);
    stateB = await getAppState();
    const b2 = stateB.state === 'ARTIFACT_DETAILS' && stateB.selectedArtifactId === 'opportunity';

    // Enter Documentary
    await evaluate(`window.__AFTERLIGHT_NAV__.toStory('opportunity', 0)`);
    await sleep(500);
    stateB = await getAppState();
    const b3 = stateB.state === 'STORY_CHAPTER' && stateB.selectedArtifactId === 'opportunity';

    // Back from Documentary: Should return to Opportunity Artifact Details
    await evaluate(`window.__AFTERLIGHT_NAV__.goBack()`);
    await sleep(500);
    stateB = await getAppState();
    const b4 = stateB.state === 'ARTIFACT_DETAILS' && stateB.selectedArtifactId === 'opportunity';

    // Back from Artifact Details: Should return to Mars Exhibition
    await evaluate(`window.__AFTERLIGHT_NAV__.goBack()`);
    await sleep(500);
    stateB = await getAppState();
    const b5 = stateB.state === 'EXHIBITION' && stateB.destination === 'mars' && stateB.selectedArtifactId === null;

    const passB = b1 && b2 && b3 && b4 && b5;
    recordResult('Scenario B (Mars Museum → Opportunity → Documentary → Back → Exhibition)', passB,
      `MarsExhibition=${b1}, Opportunity=${b2}, Documentary=${b3}, BackToArtifact=${b4}, BackToExhibition=${b5}`);

    // -------------------------------------------------------------------------
    // Scenario C: Moon Museum → Legacy → Back
    // -------------------------------------------------------------------------
    console.log('\n--- Running Scenario C ---');
    await evaluate(`window.__AFTERLIGHT_NAV__.toExhibition('moon', 'collection')`);
    await sleep(500);
    let stateC = await getAppState();
    const c1 = stateC.state === 'EXHIBITION' && stateC.destination === 'moon';

    // Enter Legacy
    await evaluate(`window.__AFTERLIGHT_NAV__.toLegacy('apollo11_eagle')`);
    await sleep(500);
    stateC = await getAppState();
    const c2 = stateC.state === 'LEGACY' && stateC.selectedArtifactId === 'apollo11_eagle';

    // Back from Legacy: Should return to Moon Exhibition
    await evaluate(`window.__AFTERLIGHT_NAV__.goBack()`);
    await sleep(500);
    stateC = await getAppState();
    const c3 = stateC.state === 'EXHIBITION' && stateC.destination === 'moon';

    const passC = c1 && c2 && c3;
    recordResult('Scenario C (Moon Museum → Legacy → Back)', passC,
      `MoonExhibition=${c1}, Legacy=${c2}, BackToMoon=${c3}`);

    // -------------------------------------------------------------------------
    // Scenario D: Moon Collection → Moon Map → Mars Map → Mars Collection
    // -------------------------------------------------------------------------
    console.log('\n--- Running Scenario D ---');
    await evaluate(`window.__AFTERLIGHT_NAV__.toExhibition('moon', 'collection')`);
    await sleep(400);
    let stateD = await getAppState();
    const d1 = stateD.state === 'EXHIBITION' && stateD.destination === 'moon' && stateD.exhibitionView === 'collection';

    // Switch to Moon Map
    await evaluate(`window.__AFTERLIGHT_NAV__.setExhibitionView('map')`);
    await sleep(400);
    stateD = await getAppState();
    const d2 = stateD.exhibitionView === 'map' && stateD.destination === 'moon';

    // Switch to Mars Map
    await evaluate(`window.__AFTERLIGHT_NAV__.toExhibition('mars', 'map', true)`);
    await sleep(400);
    stateD = await getAppState();
    const d3 = stateD.destination === 'mars' && stateD.exhibitionView === 'map';

    // Switch to Mars Collection
    await evaluate(`window.__AFTERLIGHT_NAV__.setExhibitionView('collection')`);
    await sleep(400);
    stateD = await getAppState();
    const d4 = stateD.destination === 'mars' && stateD.exhibitionView === 'collection';

    const passD = d1 && d2 && d3 && d4;
    recordResult('Scenario D (Moon Collection → Moon Map → Mars Map → Mars Collection)', passD,
      `MoonCollection=${d1}, MoonMap=${d2}, MarsMap=${d3}, MarsCollection=${d4}`);

    // -------------------------------------------------------------------------
    // Scenario E: Rapidly enter and exit artifact details at least 10 times
    // -------------------------------------------------------------------------
    console.log('\n--- Running Scenario E ---');
    await evaluate(`window.__AFTERLIGHT_NAV__.toExhibition('moon', 'collection')`);
    await sleep(400);

    let rapidSuccess = true;
    for (let i = 0; i < 10; i++) {
      await evaluate(`window.__AFTERLIGHT_NAV__.toArtifact('apollo11_eagle')`);
      await sleep(60);
      await evaluate(`window.__AFTERLIGHT_NAV__.goBack()`);
      await sleep(60);
      const s = await getAppState();
      if (s.state !== 'EXHIBITION' || s.selectedArtifactId !== null) {
        // Wait a small extra tick in case history pop is processing
        await sleep(150);
        const s2 = await getAppState();
        if (s2.state !== 'EXHIBITION' || s2.selectedArtifactId !== null) {
          rapidSuccess = false;
          console.error(`  Rapid toggle failed at iteration ${i + 1}: state=${s2.state}, artifact=${s2.selectedArtifactId}`);
          break;
        }
      }
    }
    // Verify museum is fully responsive and interactive after the 10 rapid cycles
    await sleep(300);
    let stateE = await getAppState();
    await evaluate(`window.__AFTERLIGHT_NAV__.toArtifact('surveyor3')`);
    await sleep(300);
    const postRapidOpen = (await getAppState()).selectedArtifactId === 'surveyor3';
    await evaluate(`window.__AFTERLIGHT_NAV__.goBack()`);
    await sleep(300);
    const postRapidClose = (await getAppState()).selectedArtifactId === null;

    const passE = rapidSuccess && postRapidOpen && postRapidClose;
    recordResult('Scenario E (Rapidly enter and exit artifact details >= 10 times)', passE,
      `10xRapidToggles=${rapidSuccess}, ResponsiveAfterwards=${postRapidOpen && postRapidClose}`);

    // -------------------------------------------------------------------------
    // Scenario F: Navigate repeatedly between Museum and other screens without refreshing
    // -------------------------------------------------------------------------
    console.log('\n--- Running Scenario F ---');
    let fOk = true;
    const flow = [
      () => evaluate(`window.__AFTERLIGHT_NAV__.toDestinations()`),
      () => evaluate(`window.__AFTERLIGHT_NAV__.toArrival()`),
      () => evaluate(`window.__AFTERLIGHT_NAV__.toDestinations()`),
      () => evaluate(`window.__AFTERLIGHT_NAV__.toDestination('mars')`),
      () => sleep(1200),
      () => evaluate(`window.__AFTERLIGHT_NAV__.toArtifact('opportunity')`),
      () => evaluate(`window.__AFTERLIGHT_NAV__.toStory('opportunity', 1)`),
      () => evaluate(`window.__AFTERLIGHT_NAV__.toLegacy('opportunity')`),
      () => evaluate(`window.__AFTERLIGHT_NAV__.toExhibition('moon', 'collection')`),
      () => evaluate(`window.__AFTERLIGHT_NAV__.toArtifact('apollo_lrv')`),
      () => evaluate(`window.__AFTERLIGHT_NAV__.toExhibition('moon', 'map')`),
    ];
    for (const step of flow) {
      await step();
      await sleep(250);
    }
    const stateF = await getAppState();
    fOk = stateF.state === 'EXHIBITION' && stateF.destination === 'moon' && stateF.exhibitionView === 'map';
    recordResult('Scenario F (Navigate repeatedly across screens without refresh)', fOk,
      `FinalState=${stateF.state}, FinalDest=${stateF.destination}, FinalView=${stateF.exhibitionView}`);

    // -------------------------------------------------------------------------
    // Scenario G: Use browser Back and Forward repeatedly after several interactions
    // -------------------------------------------------------------------------
    console.log('\n--- Running Scenario G ---');
    // Start fresh chain
    await send('Page.navigate', { url: 'http://127.0.0.1:5150/' });
    await sleep(1000);
    await evaluate(`window.__AFTERLIGHT_NAV__.toDestinations()`);
    await sleep(300);
    await evaluate(`window.__AFTERLIGHT_NAV__.toDestination('moon')`);
    await sleep(1200);
    await evaluate(`window.__AFTERLIGHT_NAV__.toArtifact('apollo11_eagle')`);
    await sleep(300);

    // Now go back 3 times
    await evaluate(`window.history.back()`);
    await sleep(400);
    const gBack1 = (await getAppState()).state === 'EXHIBITION';

    await evaluate(`window.history.back()`);
    await sleep(400);
    const gBack2 = (await getAppState()).state === 'DESTINATION_SELECT';

    await evaluate(`window.history.back()`);
    await sleep(400);
    const gBack3 = (await getAppState()).state === 'ARRIVAL';

    // Now forward 3 times
    await evaluate(`window.history.forward()`);
    await sleep(400);
    const gFwd1 = (await getAppState()).state === 'DESTINATION_SELECT';

    await evaluate(`window.history.forward()`);
    await sleep(400);
    const gFwd2 = (await getAppState()).state === 'EXHIBITION';

    await evaluate(`window.history.forward()`);
    await sleep(400);
    const gFwd3 = (await getAppState()).state === 'ARTIFACT_DETAILS';

    const passG = gBack1 && gBack2 && gBack3 && gFwd1 && gFwd2 && gFwd3;
    recordResult('Scenario G (Repeated browser Back and Forward)', passG,
      `Backs=[${gBack1},${gBack2},${gBack3}], Forwards=[${gFwd1},${gFwd2},${gFwd3}]`);

    // -------------------------------------------------------------------------
    // Scenario H: Open Museum directly through a URL and refresh
    // -------------------------------------------------------------------------
    console.log('\n--- Running Scenario H ---');
    await send('Page.navigate', { url: 'http://127.0.0.1:5150/?dest=mars' });
    await sleep(1500);
    let stateH1 = await getAppState();
    const h1 = stateH1.state === 'EXHIBITION' && stateH1.destination === 'mars';

    // Reload page
    await send('Page.reload');
    await sleep(1500);
    let stateH2 = await getAppState();
    const h2 = stateH2.state === 'EXHIBITION' && stateH2.destination === 'mars';

    // Direct artifact URL
    await send('Page.navigate', { url: 'http://127.0.0.1:5150/?dest=moon&artifact=apollo11_eagle' });
    await sleep(1500);
    let stateH3 = await getAppState();
    const h3 = stateH3.state === 'ARTIFACT_DETAILS' && stateH3.selectedArtifactId === 'apollo11_eagle' && stateH3.destination === 'moon';

    // Reload artifact page
    await send('Page.reload');
    await sleep(1500);
    let stateH4 = await getAppState();
    const h4 = stateH4.state === 'ARTIFACT_DETAILS' && stateH4.selectedArtifactId === 'apollo11_eagle';

    // Go back from direct artifact URL: should fallback to Exhibition
    await evaluate(`window.__AFTERLIGHT_NAV__.goBack()`);
    await sleep(500);
    let stateH5 = await getAppState();
    const h5 = stateH5.state === 'EXHIBITION' && stateH5.destination === 'moon' && stateH5.selectedArtifactId === null;

    const passH = h1 && h2 && h3 && h4 && h5;
    recordResult('Scenario H (Direct URL entry and refresh)', passH,
      `DirectMuseum=${h1}, ReloadMuseum=${h2}, DirectArtifact=${h3}, ReloadArtifact=${h4}, BackFallback=${h5}`);

    // -------------------------------------------------------------------------
    // Scenario I: Attempt navigation after opening and closing overlays
    // -------------------------------------------------------------------------
    console.log('\n--- Running Scenario I ---');
    await evaluate(`window.__AFTERLIGHT_NAV__.toExhibition('moon', 'collection')`);
    await sleep(500);

    // Open detail overlay
    await evaluate(`window.__AFTERLIGHT_NAV__.toArtifact('apollo_alsep')`);
    await sleep(400);
    let stateI = await getAppState();
    const i1 = stateI.selectedArtifactId === 'apollo_alsep';

    // Close detail overlay
    await evaluate(`window.__AFTERLIGHT_NAV__.goBack()`);
    await sleep(400);
    stateI = await getAppState();
    const i2 = stateI.selectedArtifactId === null && stateI.state === 'EXHIBITION';

    // Open another artifact details overlay immediately
    await evaluate(`window.__AFTERLIGHT_NAV__.toArtifact('surveyor3')`);
    await sleep(400);
    stateI = await getAppState();
    const i3 = stateI.selectedArtifactId === 'surveyor3';

    // Close it
    await evaluate(`window.__AFTERLIGHT_NAV__.goBack()`);
    await sleep(400);
    stateI = await getAppState();
    const i4 = stateI.selectedArtifactId === null && stateI.state === 'EXHIBITION';

    // Navigate to another screen entirely
    await evaluate(`window.__AFTERLIGHT_NAV__.toDestinations()`);
    await sleep(400);
    stateI = await getAppState();
    const i5 = stateI.state === 'DESTINATION_SELECT';

    const passI = i1 && i2 && i3 && i4 && i5;
    recordResult('Scenario I (Navigation after opening and closing overlays)', passI,
      `Open1=${i1}, Close1=${i2}, Open2=${i3}, Close2=${i4}, NavAway=${i5}`);

    // -------------------------------------------------------------------------
    // Scenario J: Leave narration running, navigate away, and verify audio cleanup does not break navigation
    // -------------------------------------------------------------------------
    console.log('\n--- Running Scenario J ---');
    await evaluate(`window.__AFTERLIGHT_NAV__.toExhibition('moon', 'collection')`);
    await sleep(400);
    await evaluate(`window.__AFTERLIGHT_NAV__.toArtifact('apollo11_eagle')`);
    await sleep(400);

    // Trigger audio / speech playback
    await evaluate(`(() => {
      // Simulate narration speaking
      const engine = window.__EXPERIENCE_STORE__?.getState();
      const synth = window.speechSynthesis;
      if (synth) {
        const u = new SpeechSynthesisUtterance('Test narration speaking across transition');
        synth.speak(u);
      }
    })()`);

    // Immediately navigate away while audio is running
    await evaluate(`window.__AFTERLIGHT_NAV__.toExhibition('mars', 'collection')`);
    await sleep(500);

    // Verify audio synthesis was cancelled/stopped and navigation succeeded
    const isSpeaking = await evaluate(`window.speechSynthesis ? window.speechSynthesis.speaking : false`);
    const stateJ = await getAppState();
    const jNavOk = stateJ.state === 'EXHIBITION' && stateJ.destination === 'mars';
    const jAudioClean = !isSpeaking;

    const passJ = jNavOk && jAudioClean;
    recordResult('Scenario J (Narration running, navigate away, audio cleanup)', passJ,
      `NavSucceeded=${jNavOk}, AudioCleanedUp=${jAudioClean}`);

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    ws.close();
    browserProc.kill();
    previewProc.kill();
  }

  console.log('\n====================================================');
  console.log('TEST SUMMARY RESULTS');
  console.log('====================================================');
  let allPass = true;
  for (const r of results) {
    console.log(`${r.passed ? '✓ PASS' : '✗ FAIL'} - ${r.scenario}`);
    if (!r.passed) allPass = false;
  }
  console.log(`\nBrowser console errors count: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.log('Errors:', consoleErrors);
  }
  console.log(`\nOverall Result: ${allPass ? 'ALL TESTS PASSED SUCCESSFULLY' : 'SOME TESTS FAILED'}`);
  process.exit(allPass ? 0 : 1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
