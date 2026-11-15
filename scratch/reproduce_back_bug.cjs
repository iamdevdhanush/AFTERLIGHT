const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 5174;
const CDP_PORT = 9290;

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
      console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
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

  async function getAppState() {
    return await evaluate(`({
      url: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      historyLength: window.history.length,
      historyState: window.history.state,
      storeState: window.__EXPERIENCE_STORE__?.getState().state,
      storeDestination: window.__EXPERIENCE_STORE__?.getState().currentDestination,
      storeArtifact: window.__EXPERIENCE_STORE__?.getState().selectedArtifactId,
      renderedTextPreview: document.body.innerText.slice(0, 150).replace(/\\n/g, ' ')
    })`);
  }

  console.log('\n=== STEP 1: OPEN ORBITAL ROOT ===');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
  await new Promise(r => setTimeout(r, 2000));
  console.log('State at root:', await getAppState());

  console.log('\n=== STEP 2: NAVIGATE TO DESTINATION SELECTION ===');
  // Click "OR OPEN 3D ORBITAL GLOBE SELECTOR" or call navigation.toDestinations()
  await evaluate('window.__ORBITAL_NAV__.toDestinations()');
  await new Promise(r => setTimeout(r, 1500));
  console.log('State at destinations:', await getAppState());

  console.log('\n=== STEP 3: PREVIEW AND SELECT MARS ===');
  // Select Mars destination
  await evaluate('window.__ORBITAL_NAV__.toDestination("mars")');
  console.log('State immediately after toDestination("mars"):', await getAppState());
  
  // Wait for loading transition (1100ms)
  await new Promise(r => setTimeout(r, 2000));
  console.log('State after Mars museum finishes loading:', await getAppState());

  console.log('\n=== STEP 4: PRESS BROWSER BACK BUTTON ===');
  // Native browser back
  await evaluate('window.history.back()');
  await new Promise(r => setTimeout(r, 1500));
  const stateAfterBack = await getAppState();
  console.log('State after first Back:', stateAfterBack);

  console.log('\n=== STEP 5: PRESS BROWSER BACK BUTTON AGAIN ===');
  await evaluate('window.history.back()');
  await new Promise(r => setTimeout(r, 1500));
  const stateAfterSecondBack = await getAppState();
  console.log('State after second Back:', stateAfterSecondBack);

  console.log('\n=== STEP 6: PRESS BROWSER FORWARD BUTTON ===');
  await evaluate('window.history.forward()');
  await new Promise(r => setTimeout(r, 1500));
  const stateAfterForward = await getAppState();
  console.log('State after Forward:', stateAfterForward);

  ws.close();
  edgeProc.kill();
  server.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
