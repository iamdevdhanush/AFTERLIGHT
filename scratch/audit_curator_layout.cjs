const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const outDir = path.join(__dirname, 'layout_audit');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function main() {
  const PORT = 5160;
  const CDP_PORT = 9310;

  console.log('1. Starting static server on port ' + PORT);
  const server = http.createServer((req, res) => {
    let reqPath = decodeURIComponent(req.url.split('?')[0]);
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    let filePath = path.join('d:\\NASA\\dist', reqPath);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      const pubPath = path.join('d:\\NASA\\public', reqPath);
      if (fs.existsSync(pubPath) && fs.statSync(pubPath).isFile()) filePath = pubPath;
      else filePath = path.join('d:\\NASA\\dist', 'index.html');
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
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream', 'Access-Control-Allow-Origin': '*' });
    fs.createReadStream(filePath).pipe(res);
  });
  await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

  console.log('2. Launching Edge Headless on port ' + CDP_PORT);
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--enable-webgl',
    '--use-gl=angle',
    '--window-size=1920,1080',
    '--no-sandbox',
    '--autoplay-policy=no-user-gesture-required',
    'about:blank',
  ]);

  async function getTargets() {
    for (let i = 0; i < 20; i++) {
      try {
        const res = await new Promise((resolve, reject) => {
          const req = http.get(`http://127.0.0.1:${CDP_PORT}/json`, (r) => {
            let data = '';
            r.on('data', (c) => (data += c));
            r.on('end', () => resolve(JSON.parse(data)));
          });
          req.on('error', reject);
          req.setTimeout(800, () => req.destroy());
        });
        if (res && res.length > 0) return res;
      } catch {}
      await new Promise((r) => setTimeout(r, 400));
    }
    throw new Error('Failed to connect to Edge CDP');
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
    console.log('  📸 Screenshot captured:', filename);
  }

  await send('Page.enable');
  await send('DOM.enable');
  await send('Runtime.enable');

  const viewports = [
    { w: 1920, h: 1080, name: '1920x1080' },
    { w: 1440, h: 900, name: '1440x900' },
    { w: 1024, h: 768, name: '1024x768' },
    { w: 768, h: 1024, name: '768x1024' },
    { w: 390, h: 844, name: '390x844' },
  ];

  for (const vp of viewports) {
    console.log(`\nTesting viewport: ${vp.name} (${vp.w}x${vp.h})...`);
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.w,
      height: vp.h,
      deviceScaleFactor: 1,
      mobile: vp.w < 768,
    });

    // 1. Artifact Details - top
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?dest=moon&artifact=apollo11_eagle` });
    await new Promise((r) => setTimeout(r, 2200));
    await snap(`audit_details_top_${vp.name}.png`);

    // 2. Artifact Details - scrolled down
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, 700)` });
    await new Promise((r) => setTimeout(r, 800));
    await snap(`audit_details_scrolled_${vp.name}.png`);

    // 3. Documentary View
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?dest=moon&artifact=apollo11_eagle&view=story` });
    await new Promise((r) => setTimeout(r, 2000));
    await snap(`audit_documentary_${vp.name}.png`);
  }

  console.log('\n=== AUDIT COMPLETE ===');
  ws.close();
  edgeProc.kill();
  server.close();
}

main().catch(console.error);

