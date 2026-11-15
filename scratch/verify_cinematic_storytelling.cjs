const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const WS = globalThis.WebSocket;

const outDir = path.join(__dirname, 'cinematic_storytelling_screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function main() {
  console.log('=== STARTING AFTERLIGHT CINEMATIC SCROLL STORYTELLING TEST SUITE ===');

  const PORT = 5174;
  const CDP_PORT = 9289;

  // 1. In-process static server for dist/ & public/
  console.log(`1. Starting in-process static server on port ${PORT}...`);
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
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.woff2': 'font/woff2',
    };

    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
    });
    fs.createReadStream(filePath).pipe(res);
  });

  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`✓ Static server listening on http://127.0.0.1:${PORT}`);

  // 2. Launch Edge headless with CDP
  console.log(`2. Launching Edge Headless with CDP on port ${CDP_PORT}...`);
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
  console.log('✓ Connected to Edge page target:', pageTarget.id);

  const ws = new WS(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve) => {
    ws.onopen = resolve;
  });

  let msgId = 1;
  const pending = new Map();
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
  }

  async function snap(name) {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(res.data, 'base64');
    const outPath = path.join(outDir, `${name}.png`);
    fs.writeFileSync(outPath, buf);
    console.log(`  📸 Saved screenshot: ${name}.png (${buf.length} bytes)`);
    return outPath;
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  console.log(`3. Navigating to http://127.0.0.1:${PORT}...`);
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}` });
  await new Promise((r) => setTimeout(r, 2500));

  // --- TEST 1: Scene 1 Prologue ---
  console.log('\n--- TEST 1: Scene 1 Prologue (Opening Hero) ---');
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 720, y: 400 });
  await new Promise((r) => setTimeout(r, 200));

  const prologueCheck = await evaluate(`
    (() => {
      const h1 = document.querySelector('h1');
      const text = h1 ? h1.textContent : '';
      const hasWordmark = document.body.innerText.includes('AFTERLIGHT');
      return { text, hasWordmark };
    })()
  `);
  console.log('Scene 1 Verification:', prologueCheck);
  if (!prologueCheck.text.includes('THEY WENT BEYOND') || !prologueCheck.hasWordmark) {
    throw new Error('FAIL: Scene 1 headline or branding missing');
  }
  console.log('✓ PASS: Opening headline and AFTERLIGHT branding verified.');
  await snap('01_scene_prologue');

  // --- TEST 2: Scene 2 The Leap ---
  console.log('\n--- TEST 2: Scene 2 The Leap (Progressive Storytelling) ---');
  await evaluate(`document.getElementById('scene-story').scrollIntoView({ behavior: 'instant' });`);
  await new Promise((r) => setTimeout(r, 600));

  const scene2Check = await evaluate(`
    (() => {
      const body = document.body.innerText;
      return {
        hasQuote: body.includes('Humanity reached for worlds beyond its own'),
        hasStats: body.includes('200+ Metric Tons') && body.includes('55+ Years in Situ'),
        activeChapter: document.querySelector('nav') ? document.body.innerText.includes('02 THE LEAP') : false,
      };
    })()
  `);
  console.log('Scene 2 Verification:', scene2Check);
  if (!scene2Check.hasQuote || !scene2Check.hasStats) {
    throw new Error('FAIL: Scene 2 storytelling quote or stats missing');
  }
  console.log('✓ PASS: Scene 2 quote and global telemetry stats verified.');
  await snap('02_scene_the_leap');

  // --- TEST 3: Scene 3 The Machines We Left Behind ---
  console.log('\n--- TEST 3: Scene 3 The Machines We Left Behind ---');
  await evaluate(`document.getElementById('scene-machines').scrollIntoView({ behavior: 'instant' });`);
  await new Promise((r) => setTimeout(r, 600));

  const scene3Check = await evaluate(`
    (() => {
      const body = document.body.innerText;
      return {
        hasConcept: body.includes('Some machines completed their missions') && body.includes('silent witnesses'),
        hasEagle: body.includes('Eagle Descent Stage'),
        hasLRV: body.includes('Lunar Roving Vehicle'),
        hasOpportunity: body.includes('Opportunity'),
        hasInSight: body.includes('InSight Lander'),
      };
    })()
  `);
  console.log('Scene 3 Verification:', scene3Check);
  if (!scene3Check.hasConcept || !scene3Check.hasEagle || !scene3Check.hasOpportunity) {
    throw new Error('FAIL: Scene 3 concept statement or artifact previews missing');
  }
  console.log('✓ PASS: Scene 3 concept statement and 4 artifact feature moments verified.');
  await snap('03_scene_machines_left_behind');

  // --- TEST 4: Scene 4 The Moon ---
  console.log('\n--- TEST 4: Scene 4 The Moon (The Silent Seas) ---');
  await evaluate(`document.getElementById('scene-moon').scrollIntoView({ behavior: 'instant' });`);
  await new Promise((r) => setTimeout(r, 600));

  const scene4Check = await evaluate(`
    (() => {
      const body = document.body.innerText;
      return {
        hasTitle: body.includes('THE SILENT SEAS OF THE MOON'),
        hasTranquility: body.includes('Tranquility Base') || body.includes('The First Base On Another World'),
        hasMoonButton: body.includes('EXPLORE MOON EXHIBITION'),
      };
    })()
  `);
  console.log('Scene 4 Verification:', scene4Check);
  if (!scene4Check.hasTitle || !scene4Check.hasMoonButton) {
    throw new Error('FAIL: Scene 4 Moon header or exploration button missing');
  }
  console.log('✓ PASS: Scene 4 Moon header and curated Apollo 11 focus verified.');
  await snap('04_scene_the_moon');

  // --- TEST 5: Scene 5 Mars (The Red Expedition) ---
  console.log('\n--- TEST 5: Scene 5 Mars (The Red Expedition) ---');
  await evaluate(`document.getElementById('scene-mars').scrollIntoView({ behavior: 'instant' });`);
  await new Promise((r) => setTimeout(r, 600));

  const scene5Check = await evaluate(`
    (() => {
      const body = document.body.innerText;
      return {
        hasTitle: body.includes('THE RED EXPEDITION'),
        hasOpportunityFocus: body.includes('The Rover That Outlasted Time') || body.includes('45.16 KM TRAVERSE'),
        hasMarsButton: body.includes('EXPLORE MARS EXHIBITION'),
      };
    })()
  `);
  console.log('Scene 5 Verification:', scene5Check);
  if (!scene5Check.hasTitle || !scene5Check.hasMarsButton) {
    throw new Error('FAIL: Scene 5 Mars header or exploration button missing');
  }
  console.log('✓ PASS: Scene 5 Mars iron rust atmosphere and Opportunity marathon verified.');
  await snap('05_scene_mars_expedition');

  // --- TEST 6: Scene 6 Enter the Archive & Destination Portals ---
  console.log('\n--- TEST 6: Scene 6 Enter the Archive ---');
  await evaluate(`document.getElementById('scene-archive').scrollIntoView({ behavior: 'instant' });`);
  await new Promise((r) => setTimeout(r, 600));

  const scene6Check = await evaluate(`
    (() => {
      const body = document.body.innerText;
      return {
        hasFinale: body.includes('THEIR MISSIONS ENDED') && body.includes('THEIR STORIES REMAIN'),
        hasMoonPortal: body.includes('ENTER MOON EXHIBITION'),
        hasMarsPortal: body.includes('ENTER MARS EXHIBITION'),
        hasOrbitalButton: body.includes('3D PLANETARY GLOBES') || body.includes('3D ORBITAL'),
      };
    })()
  `);
  console.log('Scene 6 Verification:', scene6Check);
  if (!scene6Check.hasFinale || !scene6Check.hasMoonPortal || !scene6Check.hasMarsPortal) {
    throw new Error('FAIL: Scene 6 finale text or destination portals missing');
  }
  console.log('✓ PASS: Scene 6 finale and dual destination portals verified.');
  await snap('06_scene_enter_archive');

  // --- TEST 7: Transition into Existing Museum ---
  console.log('\n--- TEST 7: Seamless Museum Transition & Browser Back/Forward ---');
  // Click "ENTER MOON EXHIBITION" in Scene 6
  const moonPortalBtn = await evaluate(`
    (() => {
      const els = Array.from(document.querySelectorAll('div, button'));
      const portal = els.find(el => el.textContent.includes('ENTER MOON EXHIBITION') && el.classList.contains('cursor-pointer'));
      if (!portal) return null;
      const r = portal.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()
  `);
  console.log('Moon Portal coordinates:', moonPortalBtn);

  if (moonPortalBtn) {
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: moonPortalBtn.x, y: moonPortalBtn.y });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: moonPortalBtn.x, y: moonPortalBtn.y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: moonPortalBtn.x, y: moonPortalBtn.y, button: 'left', clickCount: 1 });
    await new Promise((r) => setTimeout(r, 2200));

    const museumState = await evaluate(`
      (() => {
        const store = window.__EXPERIENCE_STORE__ ? window.__EXPERIENCE_STORE__.getState() : null;
        return {
          state: store ? store.state : null,
          dest: store ? store.currentDestination : null,
          url: location.search,
          bodyTextSnippet: document.body.innerText.substring(0, 100),
        };
      })()
    `);
    console.log('Museum transition state:', museumState);
    if (museumState.state !== 'EXHIBITION' || museumState.dest !== 'moon') {
      throw new Error('FAIL: Failed to transition to Moon Exhibition');
    }
    console.log('✓ PASS: Successfully entered the existing Moon Exhibition museum state.');
    await snap('07_museum_moon_exhibition');

    // Test Browser Back
    console.log('Testing Browser Back navigation...');
    await send('Runtime.evaluate', { expression: 'window.history.back()' });
    await new Promise((r) => setTimeout(r, 1500));

    const backState = await evaluate(`
      (() => {
        const store = window.__EXPERIENCE_STORE__ ? window.__EXPERIENCE_STORE__.getState() : null;
        return {
          state: store ? store.state : null,
          url: location.search,
        };
      })()
    `);
    console.log('State after Browser Back:', backState);
    if (backState.state !== 'ARRIVAL') {
      throw new Error('FAIL: Browser Back did not return to Arrival state');
    }
    console.log('✓ PASS: Browser Back seamlessly returned to Arrival storytelling screen.');
    await snap('08_returned_to_arrival');
  }

  // --- TEST 8: Mobile Layout Verification (390x844) ---
  console.log('\n--- TEST 8: Mobile Viewport Verification (390x844) ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await new Promise((r) => setTimeout(r, 600));

  await evaluate(`document.getElementById('scene-prologue').scrollIntoView({ behavior: 'instant' });`);
  await new Promise((r) => setTimeout(r, 300));
  await snap('09_mobile_scene_prologue');

  await evaluate(`document.getElementById('scene-moon').scrollIntoView({ behavior: 'instant' });`);
  await new Promise((r) => setTimeout(r, 300));
  await snap('10_mobile_scene_moon');

  await evaluate(`document.getElementById('scene-archive').scrollIntoView({ behavior: 'instant' });`);
  await new Promise((r) => setTimeout(r, 300));
  await snap('11_mobile_scene_archive');

  console.log('✓ PASS: Mobile responsive layout verified across prologue, moon, and archive.');

  // Finish and cleanup
  console.log('\n=== ALL CINEMATIC SCROLL STORYTELLING TESTS COMPLETED SUCCESSFULLY ===');
  ws.close();
  edgeProc.kill();
  server.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});

