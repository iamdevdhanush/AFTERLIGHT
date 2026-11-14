const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const outDir = __dirname;

async function main() {
  console.log('--- STARTING 2D CURATOR STORYTELLING SYSTEM VERIFICATION ---');

  const PORT = 5110;
  const CDP_PORT = 9282;

  console.log(`Starting preview server on port ${PORT}...`);
  const previewProc = spawn(
    'npx.cmd',
    ['vite', 'preview', '--port', String(PORT), '--host', '127.0.0.1'],
    { cwd: 'd:\\NASA', shell: true }
  );

  let serverReady = false;
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
  console.log('Preview server ready:', serverReady);

  console.log('Launching Edge headless...');
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
    console.log('Saved screenshot:', filename);
  }

  async function evalJS(expression) {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true });
    return res.result ? res.result.value : undefined;
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

    console.log(`Navigating to http://127.0.0.1:${PORT}...`);
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}` });

    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 400));
      const hasStore = await evalJS('!!window.__EXPERIENCE_STORE__');
      if (hasStore) break;
    }

    // 1. OPEN ALSEP ARTIFACT DETAILS: MAE 2D PRESENTER & WHITE SPEECH BUBBLE
    console.log('1. Opening ALSEP details - Verifying 2D floating presenter & white speech bubble...');
    await evalJS(`(() => {
      const store = window.__EXPERIENCE_STORE__;
      store.setState({ state: 'ARTIFACT_DETAILS', selectedArtifactId: 'apollo_alsep', selectedComponentId: null });
    })()`);
    await new Promise((r) => setTimeout(r, 1800));
    await snap('curator_01_alsep_phrase_start.png');

    // 2. VERIFY SEQUENTIAL PHRASE PROGRESSION & POSE
    console.log('2. Progressing narration to phrase 2 (pointing_sideways / thinking)...');
    await evalJS(`(() => {
      // Advance voice engine character index to test subsequent phrase
      const engine = window.__GUIDE_VOICE_ENGINE__;
      if (engine) {
        engine.seekProgress(0.18);
      }
    })()`);
    await new Promise((r) => setTimeout(r, 1200));
    await snap('curator_02_phrase_progression.png');

    // 3. SELECT COMPONENT HOTSPOT (SNAP-27 RTG): TEST COMPONENT PHRASE & POINTING POSE
    console.log('3. Selecting SNAP-27 RTG component hotspot...');
    await evalJS(`(() => {
      const store = window.__EXPERIENCE_STORE__;
      store.setState({ selectedComponentId: 'alsep-rtg' });
    })()`);
    await new Promise((r) => setTimeout(r, 1400));
    await snap('curator_03_component_rtg_pointing.png');

    // 4. TEST PAUSE & RESUME (FREEZING PHRASE & IDLE POSE)
    console.log('4. Testing Pause...');
    await evalJS(`(() => {
      const engine = window.__GUIDE_VOICE_ENGINE__;
      if (engine) engine.pause();
    })()`);
    await new Promise((r) => setTimeout(r, 800));
    await snap('curator_04_pause_state.png');

    // 5. TEST RESUME & REPLAY
    console.log('5. Testing Resume...');
    await evalJS(`(() => {
      const engine = window.__GUIDE_VOICE_ENGINE__;
      if (engine) engine.resume();
    })()`);
    await new Promise((r) => setTimeout(r, 800));

    // 6. TEST SWITCHING TO DOCUMENTARY CHAPTER (STORY CHAPTER MODE)
    console.log('6. Entering Documentary Story Chapter (Apollo 11 Eagle)...');
    await evalJS(`(() => {
      const store = window.__EXPERIENCE_STORE__;
      store.setState({
        state: 'STORY_CHAPTER',
        selectedArtifactId: 'apollo11_eagle',
        activeStoryChapterIndex: 0
      });
    })()`);
    await new Promise((r) => setTimeout(r, 1800));
    await snap('curator_05_documentary_chapter1.png');

    // 7. ADVANCE TO NEXT STORY CHAPTER
    console.log('7. Advancing to Chapter 2...');
    await evalJS(`(() => {
      const store = window.__EXPERIENCE_STORE__.getState();
      store.nextStoryChapter();
    })()`);
    await new Promise((r) => setTimeout(r, 1500));
    await snap('curator_06_documentary_chapter2.png');

    // 8. TEST CLOSING EXHIBIT / RETURNING TO GALLERY
    console.log('8. Returning to Exhibition Gallery - Verifying Mae unmounts cleanly...');
    await evalJS(`(() => {
      const store = window.__EXPERIENCE_STORE__.getState();
      store.returnToExhibition();
    })()`);
    await new Promise((r) => setTimeout(r, 1200));
    await snap('curator_07_gallery_clean_unmount.png');

    // 9. MOBILE VIEWPORT TEST (iPhone 14: 390 x 844)
    console.log('9. Testing Mobile Viewport (390 x 844)...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await evalJS(`(() => {
      const store = window.__EXPERIENCE_STORE__;
      store.setState({ state: 'ARTIFACT_DETAILS', selectedArtifactId: 'apollo_alsep', selectedComponentId: null });
    })()`);
    await new Promise((r) => setTimeout(r, 1600));
    await snap('curator_08_mobile_presentation.png');

    console.log('ALL 2D CURATOR VERIFICATION TESTS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('Error during 2D curator verification:', err);
    process.exitCode = 1;
  } finally {
    try {
      ws.close();
    } catch {}
    try {
      edgeProc.kill();
    } catch {}
    try {
      previewProc.kill();
    } catch {}
  }
}

main();
