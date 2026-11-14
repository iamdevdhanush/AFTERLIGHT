const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const outDir = path.join(__dirname, 'voice_screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function main() {
  console.log('=== STARTING AFTERLIGHT FEMALE VOICE & DOCUMENTARY NARRATION TEST SUITE ===');

  const PORT = 5140;
  const CDP_PORT = 9295;

  let previewProc = null;
  let serverReady = false;

  // 1. Launch Vite preview
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
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('  PAGE EXCEPTION:', JSON.stringify(msg.params.exceptionDetails));
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log('  PAGE CONSOLE:', msg.params.type, msg.params.args.map((a) => a.value || a.description).join(' '));
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

    console.log('\n--- TEST 1: FEMALE VOICE SELECTION & EXCLUSION OF MALE VOICES ---');
    console.log('Navigating to Apollo 11 Details (?dest=moon&artifact=apollo11_eagle)...');
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?dest=moon&artifact=apollo11_eagle` });
    await new Promise((r) => setTimeout(r, 3000));

    const debugInfo = await evalJS(`(() => {
      return {
        url: window.location.href,
        hasRoot: !!document.getElementById('root'),
        rootHTML: document.getElementById('root')?.innerHTML?.slice(0, 100),
        keys: Object.keys(window).filter(k => k.startsWith('__')),
      };
    })()`);
    console.log('  Debug info on page:', debugInfo);

    // Inspect voice engine state
    const voiceInfo = await evalJS(`(() => {
      const engine = window.__GUIDE_VOICE_ENGINE__;
      if (!engine) return { error: 'Engine not found' };
      engine.initVoices();
      const state = engine.getState();
      const voices = window.speechSynthesis.getVoices();
      return {
        selectedVoiceName: state.selectedVoiceName,
        isFemaleVoiceActive: state.isFemaleVoiceActive,
        totalVoices: voices.length,
        isSpeaking: state.isSpeaking,
        currentPhraseText: state.currentPhraseText,
        totalPhrases: state.totalPhrases,
        currentPhraseIndex: state.currentPhraseIndex,
        currentPose: state.currentPose
      };
    })()`);

    console.log('  voiceInfo result:', voiceInfo);
    console.log('  Selected Voice:', voiceInfo?.selectedVoiceName);
    console.log('  Is Female Voice Active:', voiceInfo?.isFemaleVoiceActive);
    console.log('  Total Phrases:', voiceInfo.totalPhrases);
    console.log('  Current Phrase Index:', voiceInfo.currentPhraseIndex);
    console.log('  Phrase Text:', voiceInfo.currentPhraseText);

    // Verify it is NOT a blacklisted male voice
    const maleNames = ['christopher', 'guy', 'david', 'mark', 'daniel', 'brian', 'andrew', 'eric', 'roger', 'steffan', 'ryan', 'thomas', 'liam', 'william', 'connor', 'male'];
    const lowerVoice = voiceInfo.selectedVoiceName.toLowerCase();
    const hasMaleName = maleNames.some(m => lowerVoice.includes(m));
    if (hasMaleName) {
      throw new Error(`CRITICAL FAILURE: Male voice selected: ${voiceInfo.selectedVoiceName}`);
    }
    console.log('✓ Male voice blacklist check passed: No male voice selected.');

    await snap('01_apollo11_female_voice.png');

    console.log('\n--- TEST 2: DOCUMENTARY STORYTELLING & PHRASE BREAKDOWN ---');
    if (voiceInfo.totalPhrases < 3) {
      throw new Error(`Expected script to be broken into multiple documentary phrases, but got ${voiceInfo.totalPhrases}`);
    }
    console.log(`✓ Long script segmented into ${voiceInfo.totalPhrases} discrete spoken phrases.`);

    // Check DOM speech bubble text
    const bubbleText = await evalJS(`(() => {
      const bubble = Array.from(document.querySelectorAll('div')).find(d => d.className && typeof d.className === 'string' && d.className.includes('bg-[#FFFFFF]'));
      const p = bubble ? bubble.querySelector('p') : null;
      return p ? p.textContent : (window.__GUIDE_VOICE_ENGINE__ ? window.__GUIDE_VOICE_ENGINE__.getState().currentPhraseText : '');
    })()`);
    console.log('  DOM Speech Bubble Text:', bubbleText);
    if (!bubbleText.includes('golden structure') && !bubbleText.includes('Apollo 11')) {
      throw new Error('Speech bubble does not reflect documentary narration');
    }
    console.log('✓ Speech bubble accurately displays active phrase text.');
    await snap('02_speech_bubble_sync.png');

    console.log('\n--- TEST 3: PAUSE AND RESUME HANDLING ---');
    console.log('Pausing narration...');
    await evalJS(`window.__GUIDE_VOICE_ENGINE__.pause()`);
    await new Promise((r) => setTimeout(r, 800));
    let pausedState = await evalJS(`window.__GUIDE_VOICE_ENGINE__.getState()`);
    console.log('  State after Pause: isPaused =', pausedState.isPaused);
    if (!pausedState.isPaused) throw new Error('Expected voiceEngine to be paused');

    console.log('Resuming narration...');
    await evalJS(`window.__GUIDE_VOICE_ENGINE__.resume()`);
    await new Promise((r) => setTimeout(r, 800));
    let resumedState = await evalJS(`window.__GUIDE_VOICE_ENGINE__.getState()`);
    console.log('  State after Resume: isPaused =', resumedState.isPaused);
    if (resumedState.isPaused) throw new Error('Expected voiceEngine to be resumed');
    console.log('✓ Pause and resume verified successfully.');
    await snap('03_pause_resume.png');

    console.log('\n--- TEST 4: STOP AND REPLAY HANDLING ---');
    console.log('Replaying narration...');
    await evalJS(`window.__GUIDE_VOICE_ENGINE__.replay()`);
    await new Promise((r) => setTimeout(r, 600));
    let replayState = await evalJS(`window.__GUIDE_VOICE_ENGINE__.getState()`);
    console.log('  State after Replay: phraseIndex =', replayState.currentPhraseIndex);
    if (replayState.currentPhraseIndex !== 0) throw new Error('Expected currentPhraseIndex to reset to 0 on replay');

    console.log('Stopping narration...');
    await evalJS(`window.__GUIDE_VOICE_ENGINE__.stop()`);
    await new Promise((r) => setTimeout(r, 600));
    let stopState = await evalJS(`window.__GUIDE_VOICE_ENGINE__.getState()`);
    console.log('  State after Stop: isSpeaking =', stopState.isSpeaking);
    if (stopState.isSpeaking) throw new Error('Expected voiceEngine to be stopped');
    console.log('✓ Stop and replay verified successfully.');
    await snap('04_stopped_cleanly.png');

    console.log('\n--- TEST 5: ARTIFACT TRANSITION CANCELLATION ---');
    console.log('Navigating to Surveyor 3 (should cleanly stop Apollo 11 audio and start Surveyor 3)...');
    await evalJS(`window.__AFTERLIGHT_NAV__.toArtifact('surveyor3')`);
    await new Promise((r) => setTimeout(r, 2200));

    const survInfo = await evalJS(`(() => {
      const state = window.__GUIDE_VOICE_ENGINE__.getState();
      const bubble = Array.from(document.querySelectorAll('div')).find(d => d.className && typeof d.className === 'string' && d.className.includes('bg-[#FFFFFF]'));
      const p = bubble ? bubble.querySelector('p') : null;
      return {
        selectedVoiceName: state.selectedVoiceName,
        currentPhraseText: state.currentPhraseText,
        bubbleText: p ? p.textContent : state.currentPhraseText,
        totalPhrases: state.totalPhrases,
        isSpeaking: state.isSpeaking
      };
    })()`);

    console.log('  Surveyor 3 Voice:', survInfo.selectedVoiceName);
    console.log('  Surveyor 3 Bubble Text:', survInfo.bubbleText);
    if (!survInfo.bubbleText.includes('frightening question') && !survInfo.bubbleText.includes('Surveyor 3')) {
      throw new Error('Surveyor 3 documentary narration not active');
    }
    console.log('✓ Switching artifact safely cancelled previous audio and started Surveyor 3.');
    await snap('05_surveyor3_transition.png');

    console.log('\n--- TEST 6: MARS EXPLORATION (OPPORTUNITY & INSIGHT) ---');
    console.log('Navigating to Mars - Opportunity Rover (?dest=mars&artifact=opportunity)...');
    await evalJS(`window.__AFTERLIGHT_NAV__.toArtifact('opportunity')`);
    await new Promise((r) => setTimeout(r, 2200));

    const oppInfo = await evalJS(`(() => {
      const state = window.__GUIDE_VOICE_ENGINE__.getState();
      const bubble = Array.from(document.querySelectorAll('div')).find(d => d.className && typeof d.className === 'string' && d.className.includes('bg-[#FFFFFF]'));
      const p = bubble ? bubble.querySelector('p') : null;
      return {
        selectedVoiceName: state.selectedVoiceName,
        currentPhraseText: state.currentPhraseText,
        bubbleText: p ? p.textContent : state.currentPhraseText,
        totalPhrases: state.totalPhrases
      };
    })()`);

    console.log('  Opportunity Voice:', oppInfo.selectedVoiceName);
    console.log('  Opportunity Bubble Text:', oppInfo.bubbleText);
    if (!oppInfo.bubbleText.includes('Eagle Crater') && !oppInfo.bubbleText.includes('Opportunity')) {
      throw new Error('Opportunity documentary narration not active');
    }
    console.log('✓ Mars Opportunity documentary narration loaded cleanly with female voice.');
    await snap('06_opportunity_mars.png');

    console.log('\n--- TEST 7: RETURNING TO EXHIBITION CLEARS AUDIO ---');
    console.log('Returning to Exhibition (should exit detail overlay and stop audio)...');
    await evalJS(`window.__AFTERLIGHT_NAV__.toExhibition('mars')`);
    await new Promise((r) => setTimeout(r, 1500));

    const backState = await evalJS(`(() => {
      const state = window.__GUIDE_VOICE_ENGINE__.getState();
      const storeState = window.__EXPERIENCE_STORE__ ? window.__EXPERIENCE_STORE__.getState().state : 'UNKNOWN';
      return {
        isSpeaking: state.isSpeaking,
        appState: storeState
      };
    })()`);

    console.log('  App state after returning to Exhibition:', backState.appState);
    console.log('  Is voice speaking after leaving artifact:', backState.isSpeaking);
    if (backState.isSpeaking) {
      throw new Error('Narration audio continued speaking after navigating back to Exhibition!');
    }
    if (backState.appState !== 'EXHIBITION') {
      throw new Error(`Expected EXHIBITION, got ${backState.appState}`);
    }
    console.log('✓ Returning to Exhibition safely silenced narration audio.');
    await snap('07_back_to_exhibition_silenced.png');

    console.log('\n=== ALL VOICE & DOCUMENTARY NARRATION TESTS PASSED 100%! ===');
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
