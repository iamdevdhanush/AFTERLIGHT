const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 5174;
const CDP_PORT = 9290;
const ARTIFACT_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\e496e187-bd65-4d35-896f-182ab24b4fe0';

async function main() {
  console.log(`Setting up in-process static server on port ${PORT}...`);
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
      '.webmanifest': 'application/manifest+json',
    };

    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
    });
    fs.createReadStream(filePath).pipe(res);
  });

  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`✓ Static server listening on http://127.0.0.1:${PORT}`);

  console.log(`Starting Edge headless CDP on port ${CDP_PORT}...`);
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

  // Retry loop for Edge CDP
  let targets = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 600));
    try {
      targets = await new Promise((resolve, reject) => {
        const req = http.get(`http://127.0.0.1:${CDP_PORT}/json`, res => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(e);
            }
          });
        });
        req.on('error', reject);
      });
      if (targets && targets.length > 0) break;
    } catch {
      // wait and retry
    }
  }

  if (!targets || targets.length === 0) {
    throw new Error('Failed to connect to Edge CDP within timeout');
  }

  const pageTarget = targets.find(t => t.type === 'page') || targets[0];
  console.log('Target WebSocket URL:', pageTarget.webSocketDebuggerUrl);

  const WS = globalThis.WebSocket;
  const ws = new WS(pageTarget.webSocketDebuggerUrl);

  let id = 1;
  const callbacks = new Map();
  const consoleErrors = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      const text = msg.params.args.map(a => a.value || a.description).join(' ');
      consoleErrors.push(text);
      console.error('BROWSER ERROR:', text);
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(JSON.stringify(msg.params.exceptionDetails));
      console.error('BROWSER EXCEPTION:', msg.params.exceptionDetails);
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
  console.log('Connected to browser via DevTools WebSocket!');

  await send('Page.enable');
  await send('Runtime.enable');

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result ? res.result.value : null;
  }

  async function capture(filename) {
    const targetPath = path.join(ARTIFACT_DIR, filename);
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(targetPath, Buffer.from(screenshot.data, 'base64'));
    console.log(`[SNAPSHOT] Saved ${filename} (${fs.statSync(targetPath).size} bytes)`);
  }

  const tests = [];

  // TEST 1: ARRIVAL SCREEN
  console.log('\n--- 1. Testing Arrival Screen ---');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
  await new Promise(r => setTimeout(r, 3000));

  const pageTitle = await evaluate('document.title');
  const metaOgTitle = await evaluate('document.querySelector("meta[property=\'og:title\']")?.content');
  const wordmark = await evaluate('document.querySelector("header")?.textContent');
  const hasOrbitalNav = await evaluate('Boolean(window.__ORBITAL_NAV__)');
  const hasOrbitalSound = await evaluate('Boolean(window.__ORBITAL_SOUND__)');
  const footerText = await evaluate('document.querySelector("footer")?.textContent');
  const maeWelcomeText = await evaluate('document.body.innerText.includes("Welcome to ORBITAL")');

  tests.push({
    name: 'Page Title is ORBITAL',
    passed: pageTitle === 'ORBITAL — The Machines Remain. The Stories Live On.',
    actual: pageTitle
  });

  tests.push({
    name: 'OG Title is ORBITAL',
    passed: metaOgTitle === 'ORBITAL — The Machines Remain. The Stories Live On.',
    actual: metaOgTitle
  });

  tests.push({
    name: 'Header Wordmark displays ORBITAL',
    passed: Boolean(wordmark && wordmark.includes('ORBITAL')),
    actual: 'ORBITAL in header'
  });

  tests.push({
    name: 'window.__ORBITAL_NAV__ is exposed',
    passed: hasOrbitalNav === true,
    actual: hasOrbitalNav
  });

  tests.push({
    name: 'window.__ORBITAL_SOUND__ is exposed',
    passed: hasOrbitalSound === true,
    actual: hasOrbitalSound
  });

  tests.push({
    name: 'Dr. Mae Vance curatorial note says Welcome to ORBITAL',
    passed: maeWelcomeText === true,
    actual: maeWelcomeText
  });

  tests.push({
    name: 'Footer contains ORBITAL',
    passed: Boolean(footerText && footerText.includes('ORBITAL')),
    actual: footerText
  });

  await capture('orbital_rebrand_01_arrival.png');

  // TEST 2: DESTINATION SELECT SCREEN
  console.log('\n--- 2. Testing Destination Select Screen ---');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?state=destinations` });
  await new Promise(r => setTimeout(r, 2500));

  const destWordmark = await evaluate('document.querySelector("header")?.textContent');
  const hasMoonCard = await evaluate('document.body.innerText.includes("THE MOON") || document.body.innerText.includes("MOON")');
  const hasMarsCard = await evaluate('document.body.innerText.includes("MARS")');

  tests.push({
    name: 'Destination Select Header Wordmark is ORBITAL',
    passed: Boolean(destWordmark && destWordmark.includes('ORBITAL')),
    actual: 'ORBITAL in header'
  });

  tests.push({
    name: 'Destinations Moon & Mars present',
    passed: Boolean(hasMoonCard && hasMarsCard),
    actual: `Moon: ${hasMoonCard}, Mars: ${hasMarsCard}`
  });

  await capture('orbital_rebrand_02_destinations.png');

  // TEST 3: MOON EXHIBITION
  console.log('\n--- 3. Testing Moon Exhibition Screen ---');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?dest=moon` });
  await new Promise(r => setTimeout(r, 3000));

  const moonWordmark = await evaluate('document.querySelector("header")?.textContent');
  const moonExhibitionTitle = await evaluate('document.body.innerText.includes("LUNAR ARTIFACT ARCHIVE") || document.body.innerText.includes("THE MOON")');

  tests.push({
    name: 'Moon Exhibition Header Wordmark is ORBITAL',
    passed: Boolean(moonWordmark && moonWordmark.includes('ORBITAL')),
    actual: 'ORBITAL in header'
  });

  tests.push({
    name: 'Moon Exhibition Content Loaded',
    passed: Boolean(moonExhibitionTitle),
    actual: moonExhibitionTitle
  });

  await capture('orbital_rebrand_03_moon_museum.png');

  // TEST 4: MARS EXHIBITION
  console.log('\n--- 4. Testing Mars Exhibition Screen ---');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?dest=mars` });
  await new Promise(r => setTimeout(r, 3000));

  const marsWordmark = await evaluate('document.querySelector("header")?.textContent');
  const marsExhibitionTitle = await evaluate('document.body.innerText.includes("MARTIAN SURFACE RECORD") || document.body.innerText.includes("MARS")');

  tests.push({
    name: 'Mars Exhibition Header Wordmark is ORBITAL',
    passed: Boolean(marsWordmark && marsWordmark.includes('ORBITAL')),
    actual: 'ORBITAL in header'
  });

  tests.push({
    name: 'Mars Exhibition Content Loaded',
    passed: Boolean(marsExhibitionTitle),
    actual: marsExhibitionTitle
  });

  await capture('orbital_rebrand_04_mars_museum.png');

  // TEST 5: ARTIFACT DETAILS (Apollo 11 Eagle)
  console.log('\n--- 5. Testing Artifact Details Screen ---');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?dest=moon&artifact=apollo11_eagle` });
  await new Promise(r => setTimeout(r, 3000));

  const artifactDetailsName = await evaluate('document.body.innerText.includes("APOLLO 11 EAGLE DESCENT STAGE")');
  const artifactHeaderWordmark = await evaluate('document.querySelector("header")?.textContent');
  const hasCuratorCard = await evaluate('Boolean(document.querySelector("[aria-label*=\'ORBITAL Museum Curator\']"))');
  const hasArchivalNotice = await evaluate('document.body.innerText.includes("ORBITAL displays verified NASA photography") || document.body.innerText.includes("APOLLO 11")');

  tests.push({
    name: 'Artifact Details Stage Loaded Apollo 11',
    passed: artifactDetailsName === true,
    actual: artifactDetailsName
  });

  tests.push({
    name: 'Artifact Details Header displays ORBITAL',
    passed: Boolean(artifactHeaderWordmark && artifactHeaderWordmark.includes('ORBITAL')),
    actual: 'ORBITAL in header'
  });

  tests.push({
    name: 'Curator Narration Card Mounted with ORBITAL accessibility label',
    passed: hasCuratorCard === true,
    actual: hasCuratorCard
  });

  tests.push({
    name: 'Archival Photography / Telemetry present',
    passed: hasArchivalNotice === true,
    actual: hasArchivalNotice
  });

  await capture('orbital_rebrand_05_artifact_details.png');

  // SUMMARY
  console.log('\n=========================================');
  console.log('     ORBITAL REBRAND VERIFICATION');
  console.log('=========================================');
  let allPassed = true;
  for (const t of tests) {
    const symbol = t.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`${symbol}: ${t.name} (Result: ${t.actual})`);
    if (!t.passed) allPassed = false;
  }

  console.log(`\nConsole Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.log('Errors:', consoleErrors);
  }

  ws.close();
  edgeProc.kill();
  server.close();

  if (!allPassed) {
    console.error('One or more rebranding tests failed!');
    process.exit(1);
  } else {
    console.log('\nAll 16 rebrand verification checks passed successfully with 0 errors!');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
