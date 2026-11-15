const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 5174;

async function testArtifactTrap() {
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
      '.svg': 'image/svg+xml',
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });

  try {
    await new Promise((resolve, reject) => {
      server.listen(PORT, '127.0.0.1', resolve).on('error', (err) => {
        if (err.code === 'EADDRINUSE') resolve(); // already running
        else reject(err);
      });
    });
  } catch {}

  const edgeProc = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9290',
    '--no-sandbox',
    'about:blank'
  ]);
  await new Promise(r => setTimeout(r, 1500));

  const targets = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9290/json', res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
  const pageTarget = targets.find(t => t.type === 'page') || targets[0];
  const ws = new globalThis.WebSocket(pageTarget.webSocketDebuggerUrl);
  let id = 1; const callbacks = new Map();
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && callbacks.has(m.id)) {
      const cb = callbacks.get(m.id); callbacks.delete(m.id);
      if (m.error) cb.reject(m.error); else cb.resolve(m.result);
    }
  };
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const reqId = id++; callbacks.set(reqId, { resolve, reject });
      ws.send(JSON.stringify({ id: reqId, method, params }));
    });
  }
  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Runtime.enable');
  const evalFn = exp => send('Runtime.evaluate', { expression: exp, returnByValue: true, awaitPromise: true }).then(r => r.result?.value);

  // Load Mars Museum
  await send('Page.navigate', { url: 'http://127.0.0.1:5174/?dest=mars' });
  await new Promise(r => setTimeout(r, 2000));
  console.log('1. Initial Mars Museum:', await evalFn('({ url: window.location.href, histLen: window.history.length })'));

  // Open Opportunity
  await evalFn('window.__EXPERIENCE_STORE__.getState().selectArtifact("opportunity")');
  await new Promise(r => setTimeout(r, 1000));
  console.log('2. After selectArtifact("opportunity"):', await evalFn('({ url: window.location.href, histLen: window.history.length, art: window.__EXPERIENCE_STORE__.getState().selectedArtifactId })'));

  // Close Opportunity via returnToExhibition
  await evalFn('window.__EXPERIENCE_STORE__.getState().returnToExhibition()');
  await new Promise(r => setTimeout(r, 1000));
  console.log('3. After returnToExhibition():', await evalFn('({ url: window.location.href, histLen: window.history.length, art: window.__EXPERIENCE_STORE__.getState().selectedArtifactId })'));

  // Now press Browser Back!
  await evalFn('window.history.back()');
  await new Promise(r => setTimeout(r, 1000));
  console.log('4. After pressing browser Back:', await evalFn('({ url: window.location.href, histLen: window.history.length, art: window.__EXPERIENCE_STORE__.getState().selectedArtifactId })'));

  ws.close();
  edgeProc.kill();
  try { server.close(); } catch {}
  process.exit(0);
}

testArtifactTrap().catch(e => { console.error(e); process.exit(1); });
