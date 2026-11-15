const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const WS = globalThis.WebSocket;

const outDir = path.join(__dirname, 'visual_repair_before');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function main() {
  console.log('=== CAPTURING VISUAL REPAIR BASELINE (BEFORE) ===');

  const PORT = 5174;
  const CDP_PORT = 9291;

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
      '.webp': 'image/webp',
    };

    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
    });
    fs.createReadStream(filePath).pipe(res);
  });

  await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--enable-webgl',
    '--use-gl=angle',
    '--window-size=1920,1080',
    '--no-sandbox',
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

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  async function snap(name, width = 1920, height = 1080, mobile = false) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile,
    });
    await new Promise((r) => setTimeout(r, 600));
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    fs.writeFileSync(path.join(outDir, `${name}.png`), buffer);
    console.log(`📸 Saved ${name}.png (${width}x${height})`);
  }

  // 1. Arrival Hero (Desktop 1920x1080)
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}` });
  await new Promise((r) => setTimeout(r, 2800));
  await snap('01_hero_arrival_1920x1080', 1920, 1080);
  await snap('01_hero_arrival_1366x768', 1366, 768);
  await snap('01_hero_arrival_390x844', 390, 844, true);

  // 2. Storytelling (Scene 2 The Leap & Stats)
  await send('Runtime.evaluate', {
    expression: `document.getElementById('scene-story')?.scrollIntoView();`,
  });
  await new Promise((r) => setTimeout(r, 1200));
  await snap('02_story_the_leap_1920x1080', 1920, 1080);

  // 3. Destination Selector in Arrival (Scene 6)
  await send('Runtime.evaluate', {
    expression: `document.getElementById('scene-archive')?.scrollIntoView();`,
  });
  await new Promise((r) => setTimeout(r, 1200));
  await snap('03_destination_portals_1920x1080', 1920, 1080);

  // 4. Dedicated 3D Destination Selector (?state=destinations)
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?state=destinations` });
  await new Promise((r) => setTimeout(r, 2500));
  await snap('04_3d_destinations_1920x1080', 1920, 1080);

  // 5. Artifact Exhibition Collection (?dest=moon)
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?dest=moon` });
  await new Promise((r) => setTimeout(r, 2500));
  await snap('05_moon_exhibition_1920x1080', 1920, 1080);

  // 6. Artifact Details & Dr. Mae Vance (?dest=moon&artifact=apollo11_eagle)
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?dest=moon&artifact=apollo11_eagle` });
  await new Promise((r) => setTimeout(r, 2500));
  await snap('06_artifact_details_mae_1920x1080', 1920, 1080);
  await snap('06_artifact_details_mae_1366x768', 1366, 768);
  await snap('06_artifact_details_mae_390x844', 390, 844, true);

  ws.close();
  edgeProc.kill();
  server.close();
  console.log('✓ Baseline screenshots capture complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

