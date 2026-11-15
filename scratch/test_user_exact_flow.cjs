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
  const consoleMessages = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      const line = msg.params.args.map(a => a.value || a.description).join(' ');
      consoleMessages.push(line);
      console.log('BROWSER:', line);
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

  async function getFullState() {
    return await evaluate(`({
      url: window.location.href,
      search: window.location.search,
      historyLength: window.history.length,
      historyState: window.history.state,
      storeState: window.__EXPERIENCE_STORE__?.getState().state,
      storeDest: window.__EXPERIENCE_STORE__?.getState().currentDestination,
      storeArtifact: window.__EXPERIENCE_STORE__?.getState().selectedArtifactId,
      firstVisibleHeading: document.querySelector('h1, h2, h3')?.textContent?.trim()
    })`);
  }

  console.log('\n--- TEST CASE A: Navigating from Guided Arrival Beat 4 (Mars Portal) ---');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
  await new Promise(r => setTimeout(r, 2000));
  console.log('Initial State:', await getFullState());

  // Click Mars Portal in Arrival Chapter 4:
  // In ScreenArrival.tsx: div with text "ENTER MARS EXHIBITION"
  console.log('Clicking "ENTER MARS EXHIBITION" in Arrival...');
  const clickedMars = await evaluate(`(() => {
    const btn = Array.from(document.querySelectorAll('*')).find(el => el.textContent && el.textContent.includes('ENTER MARS EXHIBITION'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  })()`);
  console.log('Clicked Mars Portal:', clickedMars);

  // Wait for loading transition
  await new Promise(r => setTimeout(r, 2000));
  console.log('State in Mars Museum:', await getFullState());

  // Click Back
  console.log('Triggering window.history.back()...');
  await evaluate('window.history.back()');
  await new Promise(r => setTimeout(r, 1500));
  console.log('State after Back from Mars Museum:', await getFullState());

  console.log('\n--- TEST CASE B: Navigating to 3D Globe -> Mars -> Back ---');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?state=destinations` });
  await new Promise(r => setTimeout(r, 2000));
  console.log('State at 3D globe:', await getFullState());

  // Switch to Mars on 3D globe
  console.log('Clicking Mars tab on 3D globe...');
  await evaluate(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(el => el.textContent && el.textContent.includes('MARS'));
    if (btn) btn.click();
  })()`);
  await new Promise(r => setTimeout(r, 1000));
  console.log('State after Mars tab clicked:', await getFullState());

  // Click MUSEUM CATALOG
  console.log('Clicking MUSEUM CATALOG for Mars...');
  await evaluate(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(el => el.textContent && el.textContent.includes('MUSEUM CATALOG'));
    if (btn) btn.click();
  })()`);
  await new Promise(r => setTimeout(r, 2000));
  console.log('State in Mars Museum via 3D globe:', await getFullState());

  // Click Back
  console.log('Triggering window.history.back()...');
  await evaluate('window.history.back()');
  await new Promise(r => setTimeout(r, 1500));
  console.log('State after Back from Mars Museum:', await getFullState());

  console.log('\n--- TEST CASE C: Mars Museum -> Artifact Details -> Back ---');
  // Click examine on Opportunity
  console.log('Clicking EXAMINE on artifact card in Mars Museum...');
  const clickedArtifact = await evaluate(`(() => {
    const card = Array.from(document.querySelectorAll('article, div, button')).find(el => el.textContent && el.textContent.includes('OPPORTUNITY') && el.textContent.includes('EXAMINE'));
    if (card) {
      card.click();
      return true;
    }
    // Alternatively call selectArtifact('opportunity')
    window.__EXPERIENCE_STORE__.getState().selectArtifact('opportunity');
    return 'store_called';
  })()`);
  console.log('Clicked Artifact:', clickedArtifact);
  await new Promise(r => setTimeout(r, 2000));
  console.log('State in Artifact Details:', await getFullState());

  // Click Back
  console.log('Triggering window.history.back()...');
  await evaluate('window.history.back()');
  await new Promise(r => setTimeout(r, 1500));
  console.log('State after Back from Artifact Details:', await getFullState());

  console.log('\n--- TEST CASE D: Clicking RETURN TO STORY in Mars Museum ---');
  await evaluate('window.__ORBITAL_NAV__.toDestination("mars")');
  await new Promise(r => setTimeout(r, 2000));
  console.log('Back in Mars Museum:', await getFullState());

  console.log('Clicking RETURN TO STORY button...');
  await evaluate(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(el => el.textContent && el.textContent.includes('RETURN TO STORY'));
    if (btn) btn.click();
  })()`);
  await new Promise(r => setTimeout(r, 1500));
  console.log('State after clicking RETURN TO STORY:', await getFullState());

  ws.close();
  edgeProc.kill();
  server.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
