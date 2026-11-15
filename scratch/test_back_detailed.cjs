const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 5174;
const CDP_PORT = 9290;

async function main() {
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
    await new Promise(r => setTimeout(r, 600));
    try {
      targets = await new Promise((resolve, reject) => {
        const req = http.get(`http://127.0.0.1:${CDP_PORT}/json`, res => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
      });
      if (targets && targets.length > 0) break;
    } catch {}
  }

  const pageTarget = targets.find(t => t.type === 'page') || targets[0];
  const WS = globalThis.WebSocket;
  const ws = new WS(pageTarget.webSocketDebuggerUrl);

  let id = 1;
  const callbacks = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      const line = msg.params.args.map(a => a.value || a.description).join(' ');
      console.log('BROWSER CONSOLE:', line);
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
    return res.result ? res.result.value : null;
  }

  async function logState(label) {
    const s = await evaluate(`({
      url: window.location.href,
      search: window.location.search,
      historyLength: window.history.length,
      historyState: window.history.state,
      storeState: window.__EXPERIENCE_STORE__?.getState().state,
      storeDest: window.__EXPERIENCE_STORE__?.getState().currentDestination,
      storeArtifact: window.__EXPERIENCE_STORE__?.getState().selectedArtifactId,
      headerTitle: document.querySelector('header')?.innerText?.replace(/\\n/g, ' | '),
      bodySnippet: document.body.innerText.slice(0, 100).replace(/\\n/g, ' ')
    })`);
    console.log(`[${label}]`, JSON.stringify(s, null, 2));
    return s;
  }

  console.log('--- TEST 1: The exact user sequence ---');
  // 1. Open ORBITAL
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
  await new Promise(r => setTimeout(r, 2000));
  await logState('1. Open ORBITAL');

  // 2. Enter the guided experience / Navigate to destination selection
  // In ScreenArrival, clicking "SKIP TO MUSEUM"
  console.log('Clicking SKIP TO MUSEUM button in header...');
  await evaluate(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('SKIP TO MUSEUM'));
    if (btn) btn.click();
  })()`);
  await new Promise(r => setTimeout(r, 1000));
  await logState('2. After SKIP TO MUSEUM');

  // 3. In Arrival beat 4, clicking the Mars Portal Card
  console.log('Clicking Mars Portal Card in Chapter 4...');
  const clickedMarsCard = await evaluate(`(() => {
    const h3 = Array.from(document.querySelectorAll('h3')).find(h => h.innerText === 'MARS');
    if (h3) {
      const card = h3.closest('div.group');
      if (card) {
        card.click();
        return 'card_clicked';
      }
    }
    return 'not_found';
  })()`);
  console.log('Clicked Mars Card result:', clickedMarsCard);

  // 4. Wait for Mars Museum to load (1100ms transition)
  await new Promise(r => setTimeout(r, 2000));
  await logState('3. In Mars Museum');

  // 5. Press the browser native Back button
  console.log('\n--- Pressing Native Browser Back from Mars Museum ---');
  await evaluate('window.history.back()');
  await new Promise(r => setTimeout(r, 1500));
  await logState('4. After first Back');

  // 6. Press Back again
  console.log('\n--- Pressing Back again ---');
  await evaluate('window.history.back()');
  await new Promise(r => setTimeout(r, 1500));
  await logState('5. After second Back');

  console.log('\n--- TEST 2: Navigating from 3D Globe selector ---');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
  await new Promise(r => setTimeout(r, 2000));
  await logState('2.1 Root');

  // Open 3D selector
  console.log('Clicking "OR OPEN 3D ORBITAL GLOBE SELECTOR"...');
  await evaluate(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('3D ORBITAL GLOBE SELECTOR'));
    if (btn) btn.click();
  })()`);
  await new Promise(r => setTimeout(r, 1500));
  await logState('2.2 On 3D Selector Screen');

  // Click Mars tab
  console.log('Selecting Mars on 3D globe...');
  await evaluate(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('MARS'));
    if (btn) btn.click();
  })()`);
  await new Promise(r => setTimeout(r, 1000));
  await logState('2.3 Mars selected on 3D globe');

  // Click MUSEUM CATALOG
  console.log('Clicking MUSEUM CATALOG...');
  await evaluate(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('MUSEUM CATALOG'));
    if (btn) btn.click();
  })()`);
  await new Promise(r => setTimeout(r, 2000));
  await logState('2.4 In Mars Museum from 3D globe');

  // Click Back
  console.log('Pressing Back from Mars Museum (entered from 3D globe)...');
  await evaluate('window.history.back()');
  await new Promise(r => setTimeout(r, 1500));
  await logState('2.5 After Back (should be on 3D globe or Arrival?)');

  console.log('\n--- TEST 3: Inside Museum: Open Artifact Details -> Back ---');
  // In Mars museum, open artifact
  console.log('Opening Opportunity details...');
  await evaluate(`window.__EXPERIENCE_STORE__.getState().selectArtifact('opportunity')`);
  await new Promise(r => setTimeout(r, 2000));
  await logState('3.1 Opportunity Details Overlay Open');

  // Press Back
  console.log('Pressing Back from Opportunity Details...');
  await evaluate('window.history.back()');
  await new Promise(r => setTimeout(r, 1500));
  await logState('3.2 After Back from Opportunity Details');

  console.log('\n--- TEST 4: Direct URL Loading then Back ---');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?dest=mars` });
  await new Promise(r => setTimeout(r, 2000));
  await logState('4.1 Direct entry to Mars Museum');

  console.log('Calling navigation.goBack() when history length is fresh...');
  await evaluate('window.__ORBITAL_NAV__.goBack()');
  await new Promise(r => setTimeout(r, 1500));
  await logState('4.2 After goBack() on direct entry');

  ws.close();
  edgeProc.kill();
  server.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
