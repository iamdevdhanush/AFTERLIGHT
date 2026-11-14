const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const outDir = path.join(__dirname, 'navigation_screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function main() {
  console.log('=== STARTING AFTERLIGHT NAVIGATION & HISTORY STABILIZATION TEST SUITE ===');

  const PORT = 5099;
  const CDP_PORT = 9272;

  let previewProc = null;
  let serverReady = false;

  // Check if server is already running on PORT
  try {
    await new Promise((resolve, reject) => {
      const req = http.get(`http://127.0.0.1:${PORT}`, (res) => {
        if (res.statusCode === 200) resolve();
        else reject(new Error('Status ' + res.statusCode));
      });
      req.on('error', reject);
      req.setTimeout(500, () => req.destroy());
    });
    serverReady = true;
    console.log(`✓ Preview server already active on port ${PORT}.`);
  } catch {
    console.log(`1. Launching Vite preview on port ${PORT}...`);
    previewProc = spawn(
      process.execPath,
      ['d:\\NASA\\node_modules\\vite\\bin\\vite.js', 'preview', '--port', String(PORT), '--host', '127.0.0.1'],
      { cwd: 'd:\\NASA', stdio: 'inherit' }
    );

    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 400));
      try {
        await new Promise((resolve, reject) => {
          const req = http.get(`http://127.0.0.1:${PORT}`, (res) => {
            if (res.statusCode === 200) resolve();
            else reject(new Error('Status ' + res.statusCode));
          });
          req.on('error', reject);
          req.setTimeout(500, () => req.destroy());
        });
        serverReady = true;
        break;
      } catch {}
    }
  }

  if (!serverReady) {
    console.error('ERROR: Preview server failed to start!');
    if (previewProc) previewProc.kill();
    process.exit(1);
  }
  console.log('✓ Preview server ready.');

  console.log('2. Launching Edge Headless with CDP on port ' + CDP_PORT + '...');
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--enable-webgl',
    '--use-gl=angle',
    '--window-size=1440,900',
    '--no-sandbox',
    '--autoplay-policy=no-user-gesture-required',
    'about:blank',
  ]);

  await new Promise((r) => setTimeout(r, 2200));

  function getTargets() {
    return new Promise((resolve, reject) => {
      http
        .get(`http://127.0.0.1:${CDP_PORT}/json`, (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => resolve(JSON.parse(data)));
        })
        .on('error', reject);
    });
  }

  const targets = await getTargets();
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const WS = globalThis.WebSocket;
  const ws = new WS(pageTarget.webSocketDebuggerUrl);

  let id = 1;
  const callbacks = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
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

  async function snap(filename) {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const filePath = path.join(outDir, filename);
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log('  📸 Screenshot saved:', filename);
  }

  async function evalJS(expression) {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return res.result ? res.result.value : undefined;
  }

  async function getAppState() {
    return await evalJS(`(() => {
      const s = window.__EXPERIENCE_STORE__.getState();
      return {
        state: s.state,
        dest: s.currentDestination,
        artifact: s.selectedArtifactId,
        chapter: s.activeStoryChapterIndex,
        view: s.exhibitionView,
        search: window.location.search,
        pathname: window.location.pathname,
      };
    })()`);
  }

  try {
    await new Promise((r) => (ws.onopen = r));
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log('\n--- JOURNEY A: BASIC NAVIGATION & BROWSER BACK/FORWARD ---');
    console.log('A1. Navigating to root / ...');
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
    await new Promise((r) => setTimeout(r, 2000));
    let st = await getAppState();
    console.log('  Initial state:', st.state, '| URL:', st.search);
    if (st.state !== 'ARRIVAL') throw new Error(`Expected ARRIVAL, got ${st.state}`);
    await snap('journeyA_01_arrival.png');

    console.log('A2. Clicking BEGIN EXPLORATION...');
    await evalJS(`(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('BEGIN EXPLORATION'));
      if (btn) btn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 1200));
    st = await getAppState();
    console.log('  State after Begin Exploration:', st.state, '| URL:', st.search);
    if (st.state !== 'DESTINATION_SELECT') throw new Error(`Expected DESTINATION_SELECT, got ${st.state}`);
    await snap('journeyA_02_destinations.png');

    console.log('A3. Selecting THE MOON...');
    await evalJS(`(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim().includes('ENTER THE MOON') || b.textContent.trim().startsWith('ENTER '));
      if (btn) {
        btn.click();
      } else {
        window.__AFTERLIGHT_NAV__.toDestination('moon');
      }
    })()`);
    // Wait for orbital descent into exhibition
    await new Promise((r) => setTimeout(r, 2200));
    st = await getAppState();
    console.log('  State after Moon Selection:', st.state, '| Dest:', st.dest, '| URL:', st.search);
    if (st.state !== 'EXHIBITION' || st.dest !== 'moon') throw new Error(`Expected EXHIBITION on moon, got ${st.state} on ${st.dest}`);
    await snap('journeyA_03_moon_exhibition.png');

    console.log('A4. Selecting Apollo 11 Eagle artifact...');
    await evalJS(`(() => {
      window.__AFTERLIGHT_NAV__.toArtifact('apollo11_eagle');
    })()`);
    await new Promise((r) => setTimeout(r, 1500));
    st = await getAppState();
    console.log('  State after Artifact Select:', st.state, '| Artifact:', st.artifact, '| URL:', st.search);
    if (st.state !== 'ARTIFACT_DETAILS' || st.artifact !== 'apollo11_eagle') throw new Error(`Expected ARTIFACT_DETAILS for apollo11_eagle`);
    await snap('journeyA_04_apollo11_details.png');

    console.log('A5. Pressing Browser Back (should return to Moon Exhibition)...');
    await evalJS(`window.history.back()`);
    await new Promise((r) => setTimeout(r, 1500));
    st = await getAppState();
    console.log('  State after 1st Back:', st.state, '| Dest:', st.dest, '| URL:', st.search);
    if (st.state !== 'EXHIBITION' || st.dest !== 'moon') throw new Error(`Expected EXHIBITION on moon after Back`);
    await snap('journeyA_05_back_to_exhibition.png');

    console.log('A6. Pressing Browser Back again (should return to Destination Selection)...');
    await evalJS(`window.history.back()`);
    await new Promise((r) => setTimeout(r, 1500));
    st = await getAppState();
    console.log('  State after 2nd Back:', st.state, '| URL:', st.search);
    if (st.state !== 'DESTINATION_SELECT') throw new Error(`Expected DESTINATION_SELECT after 2nd Back`);
    await snap('journeyA_06_back_to_destinations.png');

    console.log('A7. Pressing Browser Forward (should restore Moon Exhibition)...');
    await evalJS(`window.history.forward()`);
    await new Promise((r) => setTimeout(r, 1500));
    st = await getAppState();
    console.log('  State after 1st Forward:', st.state, '| Dest:', st.dest, '| URL:', st.search);
    if (st.state !== 'EXHIBITION' || st.dest !== 'moon') throw new Error(`Expected EXHIBITION on moon after Forward`);
    await snap('journeyA_07_forward_to_exhibition.png');

    console.log('A8. Pressing Browser Forward again (should restore Apollo 11 Details)...');
    await evalJS(`window.history.forward()`);
    await new Promise((r) => setTimeout(r, 1500));
    st = await getAppState();
    console.log('  State after 2nd Forward:', st.state, '| Artifact:', st.artifact, '| URL:', st.search);
    if (st.state !== 'ARTIFACT_DETAILS' || st.artifact !== 'apollo11_eagle') throw new Error(`Expected ARTIFACT_DETAILS after 2nd Forward`);
    await snap('journeyA_08_forward_to_details.png');
    console.log('✓ JOURNEY A PASSED!');

    console.log('\n--- JOURNEY B: MARS NAVIGATION ---');
    console.log('B1. Navigating to Destination Selection...');
    await evalJS(`window.__AFTERLIGHT_NAV__.toDestinations()`);
    await new Promise((r) => setTimeout(r, 1200));
    console.log('B2. Selecting MARS...');
    await evalJS(`window.__AFTERLIGHT_NAV__.toDestination('mars')`);
    await new Promise((r) => setTimeout(r, 2200));
    st = await getAppState();
    console.log('  State after Mars Select:', st.state, '| Dest:', st.dest, '| URL:', st.search);
    if (st.state !== 'EXHIBITION' || st.dest !== 'mars') throw new Error(`Expected EXHIBITION on mars, got ${st.dest}`);
    await snap('journeyB_01_mars_exhibition.png');

    console.log('B3. Selecting Opportunity Rover...');
    await evalJS(`window.__AFTERLIGHT_NAV__.toArtifact('opportunity')`);
    await new Promise((r) => setTimeout(r, 1500));
    st = await getAppState();
    console.log('  State after Opportunity Select:', st.state, '| Artifact:', st.artifact, '| URL:', st.search);
    if (st.state !== 'ARTIFACT_DETAILS' || st.artifact !== 'opportunity') throw new Error(`Expected ARTIFACT_DETAILS for opportunity`);
    await snap('journeyB_02_opportunity_details.png');

    console.log('B4. Pressing Back...');
    await evalJS(`window.history.back()`);
    await new Promise((r) => setTimeout(r, 1500));
    st = await getAppState();
    console.log('  State after Back:', st.state, '| Dest:', st.dest);
    if (st.state !== 'EXHIBITION' || st.dest !== 'mars') throw new Error(`Expected EXHIBITION on mars after Back`);
    console.log('✓ JOURNEY B PASSED!');

    console.log('\n--- JOURNEY C: STORY CHAPTER NAVIGATION ---');
    console.log('C1. Opening Opportunity Details...');
    await evalJS(`window.__AFTERLIGHT_NAV__.toArtifact('opportunity')`);
    await new Promise((r) => setTimeout(r, 1200));
    console.log('C2. Entering Documentary Story...');
    await evalJS(`window.__AFTERLIGHT_NAV__.toStory('opportunity', 0)`);
    await new Promise((r) => setTimeout(r, 1500));
    st = await getAppState();
    console.log('  State in Story:', st.state, '| Chapter:', st.chapter, '| URL:', st.search);
    if (st.state !== 'STORY_CHAPTER' || st.chapter !== 0) throw new Error(`Expected STORY_CHAPTER chapter 0`);
    await snap('journeyC_01_story_chapter0.png');

    console.log('C3. Advancing to Chapter 1...');
    await evalJS(`window.__AFTERLIGHT_NAV__.nextStoryChapter()`);
    await new Promise((r) => setTimeout(r, 1000));
    st = await getAppState();
    console.log('  State in Story Ch1:', st.state, '| Chapter:', st.chapter, '| URL:', st.search);
    if (st.chapter !== 1) throw new Error(`Expected Chapter 1, got ${st.chapter}`);
    await snap('journeyC_02_story_chapter1.png');

    console.log('C4. Returning to Chapter 0...');
    await evalJS(`window.__AFTERLIGHT_NAV__.prevStoryChapter()`);
    await new Promise((r) => setTimeout(r, 1000));
    st = await getAppState();
    console.log('  State in Story Ch0:', st.state, '| Chapter:', st.chapter, '| URL:', st.search);
    if (st.chapter !== 0) throw new Error(`Expected Chapter 0, got ${st.chapter}`);

    console.log('C5. Exiting Story via goBack()...');
    await evalJS(`window.__AFTERLIGHT_NAV__.goBack()`);
    await new Promise((r) => setTimeout(r, 1500));
    st = await getAppState();
    console.log('  State after Story Exit:', st.state, '| Artifact:', st.artifact);
    if (st.state !== 'ARTIFACT_DETAILS' || st.artifact !== 'opportunity') throw new Error(`Expected ARTIFACT_DETAILS for opportunity`);
    await snap('journeyC_03_returned_to_artifact.png');
    console.log('✓ JOURNEY C PASSED!');

    console.log('\n--- JOURNEY D: DESTINATION SWITCHING & CONTEXT PRESERVATION ---');
    console.log('D1. Navigating to Moon Exhibition...');
    await evalJS(`window.__AFTERLIGHT_NAV__.toExhibition('moon', 'map')`);
    await new Promise((r) => setTimeout(r, 1200));
    st = await getAppState();
    console.log('  Moon Map view:', st.dest, '| View:', st.view, '| URL:', st.search);
    if (st.dest !== 'moon' || st.view !== 'map') throw new Error(`Expected Moon map view`);
    await snap('journeyD_01_moon_map.png');

    console.log('D2. Switching to Mars Exhibition...');
    await evalJS(`window.__AFTERLIGHT_NAV__.toExhibition('mars', 'map')`);
    await new Promise((r) => setTimeout(r, 1200));
    st = await getAppState();
    console.log('  Mars Map view:', st.dest, '| View:', st.view, '| URL:', st.search);
    if (st.dest !== 'mars' || st.view !== 'map') throw new Error(`Expected Mars map view`);
    await snap('journeyD_02_mars_map.png');

    console.log('D3. Switching back to Moon Exhibition (collection mode)...');
    await evalJS(`window.__AFTERLIGHT_NAV__.toExhibition('moon', 'collection')`);
    await new Promise((r) => setTimeout(r, 1200));
    st = await getAppState();
    console.log('  Moon Collection view:', st.dest, '| View:', st.view, '| URL:', st.search);
    if (st.dest !== 'moon' || st.view !== 'collection') throw new Error(`Expected Moon collection view`);
    console.log('✓ JOURNEY D PASSED!');

    console.log('\n--- JOURNEY E: RAPID INTERACTIONS & TRANSITION STABILITY ---');
    console.log('E1. Firing rapid sequential navigation actions...');
    for (let i = 0; i < 8; i++) {
      await evalJS(`(() => {
        const dest = ${i % 2 === 0 ? "'mars'" : "'moon'"};
        window.__AFTERLIGHT_NAV__.toExhibition(dest);
      })()`);
      await new Promise((r) => setTimeout(r, 80));
    }
    await new Promise((r) => setTimeout(r, 1000));
    st = await getAppState();
    console.log('  State after rapid clicks:', st.state, '| Dest:', st.dest);
    if (st.state !== 'EXHIBITION') throw new Error(`Expected EXHIBITION after rapid clicks, got ${st.state}`);
    await snap('journeyE_01_rapid_clicks_settled.png');
    console.log('✓ JOURNEY E PASSED!');

    console.log('\n--- JOURNEY F: DIRECT URL ENTRY & PAGE REFRESH ---');
    console.log('F1. Direct URL: Apollo 11 Details (?dest=moon&artifact=apollo11_eagle)...');
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?dest=moon&artifact=apollo11_eagle` });
    await new Promise((r) => setTimeout(r, 2000));
    st = await getAppState();
    console.log('  Direct load Apollo 11:', st.state, '| Artifact:', st.artifact, '| Dest:', st.dest);
    if (st.state !== 'ARTIFACT_DETAILS' || st.artifact !== 'apollo11_eagle') throw new Error(`Direct URL Apollo 11 failed`);
    await snap('journeyF_01_direct_apollo11.png');

    console.log('F2. Direct URL: Mars Surface Map (?dest=mars&view=map)...');
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?dest=mars&view=map` });
    await new Promise((r) => setTimeout(r, 2000));
    st = await getAppState();
    console.log('  Direct load Mars Map:', st.state, '| Dest:', st.dest, '| View:', st.view);
    if (st.state !== 'EXHIBITION' || st.dest !== 'mars' || st.view !== 'map') throw new Error(`Direct URL Mars Map failed`);
    await snap('journeyF_02_direct_mars_map.png');

    console.log('F3. Direct URL: Story Chapter (?dest=moon&artifact=apollo11_eagle&view=story&chapter=1)...');
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?dest=moon&artifact=apollo11_eagle&view=story&chapter=1` });
    await new Promise((r) => setTimeout(r, 2000));
    st = await getAppState();
    console.log('  Direct load Story Ch1:', st.state, '| Artifact:', st.artifact, '| Chapter:', st.chapter);
    if (st.state !== 'STORY_CHAPTER' || st.chapter !== 1) throw new Error(`Direct URL Story Chapter failed`);
    await snap('journeyF_03_direct_story_chapter1.png');
    console.log('✓ JOURNEY F PASSED!');

    console.log('\n--- JOURNEY G: ERROR RECOVERY & SANITIZATION ---');
    console.log('G1. Stale Deep Space URL (?dest=deep_space)...');
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?dest=deep_space` });
    await new Promise((r) => setTimeout(r, 2000));
    st = await getAppState();
    console.log('  Sanitized Deep Space URL:', st.state, '| Dest:', st.dest, '| URL:', st.search);
    if (st.dest === 'deep_space') throw new Error(`Deep Space was not sanitized`);
    if (st.state !== 'EXHIBITION') throw new Error(`Expected EXHIBITION after sanitization`);
    await snap('journeyG_01_sanitized_deep_space.png');

    console.log('G2. Missing Artifact ID (?state=ARTIFACT_DETAILS with no artifact)...');
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?state=ARTIFACT_DETAILS` });
    await new Promise((r) => setTimeout(r, 2000));
    st = await getAppState();
    console.log('  Missing Artifact Fallback:', st.state, '| Artifact:', st.artifact);
    if (!st.artifact || st.state !== 'ARTIFACT_DETAILS') throw new Error(`Missing artifact fallback failed`);
    await snap('journeyG_02_missing_artifact_recovery.png');

    console.log('G3. Mismatched Artifact and Destination (?dest=mars&artifact=apollo11_eagle)...');
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?dest=mars&artifact=apollo11_eagle` });
    await new Promise((r) => setTimeout(r, 2000));
    st = await getAppState();
    console.log('  Mismatched Dest/Artifact:', st.dest, '| Artifact:', st.artifact);
    // Should have synchronized destination to moon because Apollo 11 is on the Moon
    if (st.dest !== 'moon') throw new Error(`Destination not synchronized to Moon for Apollo 11`);
    await snap('journeyG_03_mismatched_dest_corrected.png');
    console.log('✓ JOURNEY G PASSED!');

    console.log('\n=== ALL JOURNEYS A THROUGH G COMPLETED WITH 100% SUCCESS! ===');
  } catch (err) {
    console.error('TEST EXECUTION FAILURE:', err);
    process.exit(1);
  } finally {
    try {
      ws.close();
      edgeProc.kill();
      if (previewProc) previewProc.kill();
    } catch {}
  }
}

main();
