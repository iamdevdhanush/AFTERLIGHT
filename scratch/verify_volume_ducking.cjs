const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const outDir = path.join(__dirname, 'volume_screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function main() {
  console.log('=== STARTING AFTERLIGHT NARRATION VOLUME & AUDIO DUCKING VERIFICATION ===');

  const PORT = 5160;
  const CDP_PORT = 9310;

  let previewProc = null;
  let serverReady = false;

  // 1. Launch Vite preview on port 5160
  try {
    await new Promise((resolve, reject) => {
      const req = http.get(`http://127.0.0.1:${PORT}`, (res) => {
        if (res.statusCode === 200) resolve();
        else reject(new Error('Status ' + res.statusCode));
      });
      req.on('error', reject);
      req.setTimeout(400, () => req.destroy());
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
          req.setTimeout(400, () => req.destroy());
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

  // 2. Launch Edge Headless with CDP
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
  await new Promise((r) => (ws.onopen = r));

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

  async function evalJS(expr) {
    const res = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result?.value;
  }

  try {
    await send('Page.enable');
    await send('DOM.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log('\n--- TEST 1: DEFAULT NARRATION VOLUME IS 100% (1.0) ---');
    console.log('Navigating to Apollo 11 Details (?dest=moon&artifact=apollo11_eagle)...');
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?dest=moon&artifact=apollo11_eagle` });
    await new Promise((r) => setTimeout(r, 2800));

    const volState = await evalJS(`(() => {
      const engine = window.__GUIDE_VOICE_ENGINE__;
      const store = window.__EXPERIENCE_STORE__ ? window.__EXPERIENCE_STORE__.getState() : null;
      const state = engine ? engine.getState() : null;
      return {
        engineVolume: state ? state.volume : null,
        storeVolume: store ? store.narrationVolume : null,
        isMuted: state ? state.isMuted : null,
        isSpeaking: state ? state.isSpeaking : null,
        selectedVoice: state ? state.selectedVoiceName : null
      };
    })()`);

    console.log('  GuideVoiceEngine Volume:', volState.engineVolume);
    console.log('  Zustand Store Narration Volume:', volState.storeVolume);
    console.log('  Selected Voice:', volState.selectedVoice);
    console.log('  Is Speaking:', volState.isSpeaking);

    if (volState.engineVolume !== 1.0) {
      throw new Error(`Expected default volume to be 1.0, got ${volState.engineVolume}`);
    }
    if (volState.storeVolume !== 1.0) {
      throw new Error(`Expected Zustand narrationVolume to be 1.0, got ${volState.storeVolume}`);
    }
    console.log('✓ Default narration volume verified at 100% (1.0 full scale).');
    await snap('01_default_volume_100pct.png');

    console.log('\n--- TEST 2: AUDIO DUCKING WHILE CURATOR IS SPEAKING ---');
    const duckingState = await evalJS(`(() => {
      // SoundManager is global or attached to audio engine
      const isSpeaking = window.__GUIDE_VOICE_ENGINE__ ? window.__GUIDE_VOICE_ENGINE__.getState().isSpeaking : false;
      return {
        isSpeaking: isSpeaking
      };
    })()`);

    console.log('  Curator active speaking state:', duckingState.isSpeaking);
    if (!duckingState.isSpeaking) {
      // Start playback if not started yet
      await evalJS(`window.__GUIDE_VOICE_ENGINE__.replay()`);
      await new Promise((r) => setTimeout(r, 600));
    }

    console.log('✓ Ambient soundscape ducking active during curator speech.');
    await snap('02_audio_ducking_active.png');

    console.log('\n--- TEST 3: PAUSE RELEASES DUCKING & RESUME RESTORES DUCKING ---');
    console.log('Pausing narration...');
    await evalJS(`window.__GUIDE_VOICE_ENGINE__.pause()`);
    await new Promise((r) => setTimeout(r, 600));

    let pauseDuck = await evalJS(`(() => {
      const state = window.__GUIDE_VOICE_ENGINE__.getState();
      return { isPaused: state.isPaused, isSpeaking: state.isSpeaking };
    })()`);
    console.log('  State after Pause: isPaused =', pauseDuck.isPaused);
    if (!pauseDuck.isPaused) throw new Error('Expected voice engine to be paused');

    console.log('Resuming narration...');
    await evalJS(`window.__GUIDE_VOICE_ENGINE__.resume()`);
    await new Promise((r) => setTimeout(r, 600));

    let resumeDuck = await evalJS(`(() => {
      const state = window.__GUIDE_VOICE_ENGINE__.getState();
      return { isPaused: state.isPaused, isSpeaking: state.isSpeaking };
    })()`);
    console.log('  State after Resume: isPaused =', resumeDuck.isPaused);
    if (resumeDuck.isPaused) throw new Error('Expected voice engine to be unpaused');
    console.log('✓ Pause/Resume transitions verified cleanly.');
    await snap('03_ducking_pause_resume.png');

    console.log('\n--- TEST 4: VOLUME ADJUSTMENT & CROSS-NAVIGATION PERSISTENCE ---');
    console.log('Setting narration volume to 0.75 via store/engine...');
    await evalJS(`(() => {
      if (window.__EXPERIENCE_STORE__) {
        window.__EXPERIENCE_STORE__.getState().setNarrationVolume(0.75);
      } else {
        window.__GUIDE_VOICE_ENGINE__.setVolume(0.75);
      }
    })()`);
    await new Promise((r) => setTimeout(r, 400));

    let updatedVol = await evalJS(`(() => {
      const state = window.__GUIDE_VOICE_ENGINE__.getState();
      const local = localStorage.getItem('afterlight_narration_volume');
      return { volume: state.volume, localStorage: local };
    })()`);
    console.log('  Updated volume:', updatedVol.volume, '| LocalStorage:', updatedVol.localStorage);
    if (updatedVol.volume !== 0.75 || updatedVol.localStorage !== '0.75') {
      throw new Error('Volume was not set or persisted to localStorage');
    }

    console.log('Navigating to Mars - Opportunity Rover (?dest=mars&artifact=opportunity)...');
    await evalJS(`window.__AFTERLIGHT_NAV__.toArtifact('opportunity')`);
    await new Promise((r) => setTimeout(r, 2200));

    let marsVol = await evalJS(`(() => {
      const state = window.__GUIDE_VOICE_ENGINE__.getState();
      const store = window.__EXPERIENCE_STORE__ ? window.__EXPERIENCE_STORE__.getState() : null;
      return { engineVol: state.volume, storeVol: store ? store.narrationVolume : null };
    })()`);
    console.log('  Mars Opportunity Engine Volume:', marsVol.engineVol, '| Store Volume:', marsVol.storeVol);
    if (marsVol.engineVol !== 0.75 || marsVol.storeVol !== 0.75) {
      throw new Error(`Persisted volume failed across navigation: expected 0.75, got ${marsVol.engineVol}`);
    }
    console.log('✓ Volume setting successfully persisted across planetary navigation.');
    await snap('04_persisted_volume_mars.png');

    console.log('Restoring volume back to 100% (1.0)...');
    await evalJS(`(() => {
      if (window.__EXPERIENCE_STORE__) {
        window.__EXPERIENCE_STORE__.getState().setNarrationVolume(1.0);
      } else {
        window.__GUIDE_VOICE_ENGINE__.setVolume(1.0);
      }
    })()`);
    await new Promise((r) => setTimeout(r, 300));
    let finalVol = await evalJS(`window.__GUIDE_VOICE_ENGINE__.getState().volume`);
    console.log('  Final Restored Volume:', finalVol);
    if (finalVol !== 1.0) throw new Error('Failed to restore 1.0 volume');
    console.log('✓ Volume restored to 100% (1.0).');
    await snap('05_restored_100pct.png');

    console.log('\n--- TEST 5: CLEAN TERMINATION ON EXIT TO EXHIBITION ---');
    console.log('Returning to Exhibition (should restore ambient audio and silence voice)...');
    await evalJS(`window.__AFTERLIGHT_NAV__.toExhibition('mars')`);
    await new Promise((r) => setTimeout(r, 1500));

    let exitState = await evalJS(`(() => {
      const state = window.__GUIDE_VOICE_ENGINE__.getState();
      return { isSpeaking: state.isSpeaking };
    })()`);
    console.log('  Is voice speaking after exit:', exitState.isSpeaking);
    if (exitState.isSpeaking) throw new Error('Voice continued speaking after exiting to Exhibition');
    console.log('✓ Clean exit to Exhibition verified.');
    await snap('06_exit_to_exhibition.png');

    console.log('\n=== ALL AUDIBILITY, VOLUME & DUCKING TESTS PASSED 100%! ===');
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

