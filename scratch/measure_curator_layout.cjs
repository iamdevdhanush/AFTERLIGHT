const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

async function main() {
  const PORT = 5160;
  const CDP_PORT = 9310;

  const fs = require('fs');
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

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--enable-webgl',
    '--use-gl=angle',
    '--no-sandbox',
    '--autoplay-policy=no-user-gesture-required',
    'about:blank',
  ]);

  await new Promise((r) => setTimeout(r, 1500));

  function getTargets() {
    return new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${CDP_PORT}/json`, (r) => {
        let d = '';
        r.on('data', c => d += c);
        r.on('end', () => resolve(JSON.parse(d)));
      }).on('error', reject);
    });
  }

  const targets = await getTargets();
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const WS = globalThis.WebSocket;
  const ws = new WS(pageTarget.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));

  let id = 1;
  const callbacks = new Map();
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
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

  async function evalJS(expr) {
    const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (res.exceptionDetails) throw new Error(JSON.stringify(res.exceptionDetails));
    return res.result?.value;
  }

  await send('Page.enable');
  await send('Runtime.enable');

  const viewports = [
    { w: 1920, h: 1080, name: '1920x1080' },
    { w: 1440, h: 900, name: '1440x900' },
    { w: 1024, h: 768, name: '1024x768' },
    { w: 768, h: 1024, name: '768x1024' },
    { w: 390, h: 844, name: '390x844' },
  ];

  for (const vp of viewports) {
    await send('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: 1, mobile: vp.w < 768 });
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?dest=moon&artifact=apollo11_eagle` });
    await new Promise((r) => setTimeout(r, 2000));

    const metrics = await evalJS(`(() => {
      const characterContainer = document.querySelector('img[alt*="Mae Vance"]')?.parentElement;
      const characterImg = document.querySelector('img[alt*="Mae Vance"]');
      const speechBubble = document.querySelector('.bg-\\\\[\\\\#FFFFFF\\\\]') || Array.from(document.querySelectorAll('div')).find(d => d.className?.includes('bg-[#FFFFFF]'));
      const aside = document.querySelector('aside[aria-label*="Curator"]');
      const storyBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('DOCUMENTARY STORY'));

      function getBox(el) {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) };
      }

      return {
        viewport: { w: window.innerWidth, h: window.innerHeight },
        characterContainer: getBox(characterContainer),
        characterImg: getBox(characterImg),
        speechBubble: getBox(speechBubble),
        aside: getBox(aside),
        storyBtn: getBox(storyBtn)
      };
    })()`);

    console.log(`\n=== VIEWPORT: ${vp.name} ===`);
    console.log('Metrics:', JSON.stringify(metrics, null, 2));

    // Check overlaps
    if (metrics.speechBubble && metrics.storyBtn) {
      const b = metrics.speechBubble;
      const s = metrics.storyBtn;
      const overlap = !(b.right < s.left || b.left > s.right || b.bottom < s.top || b.top > s.bottom);
      console.log('  ⚠️ Speech Bubble overlaps Story CTA button:', overlap);
    }
    if (metrics.characterImg && metrics.storyBtn) {
      const c = metrics.characterImg;
      const s = metrics.storyBtn;
      const overlap = !(c.right < s.left || c.left > s.right || c.bottom < s.top || c.top > s.bottom);
      console.log('  ⚠️ Character Image overlaps Story CTA button:', overlap);
    }
  }

  ws.close();
  edgeProc.kill();
}

main().catch(console.error);
