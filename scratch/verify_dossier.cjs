const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function main() {
  const previewProc = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--port', '5175', '--host', '127.0.0.1'], {
    stdio: 'ignore'
  });

  await new Promise(r => setTimeout(r, 2500));

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--enable-webgl',
    '--use-gl=angle',
    '--window-size=1920,1080',
    '--no-sandbox',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 3000));

  function getTargets() {
    return new Promise((resolve, reject) => {
      http.get('http://127.0.0.1:9224/json', res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });
  }

  const targets = await getTargets();
  const pageTarget = targets.find(t => t.type === 'page') || targets[0];
  const WS = globalThis.WebSocket;
  const ws = new WS(pageTarget.webSocketDebuggerUrl);

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

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Runtime.enable');

  const artifactDir = 'C:\\Users\\Adithya s shetty\\.gemini\\antigravity\\brain\\dc2a5fb0-dfd3-4d27-95dc-e81223bad2b3';

  // Navigate to Moon with Apollo 11 pre-selected or click a marker
  console.log('Navigating to Moon with dossier...');
  await send('Page.navigate', { url: 'http://127.0.0.1:5175/?state=PLANETARY_ARCHAEOLOGY&dest=moon' });
  await new Promise(r => setTimeout(r, 4000));

  // Trigger site selection programmatically via window event or DOM click
  await send('Runtime.evaluate', {
    expression: `
      // Find canvas and dispatch click or trigger selection
      const canvas = document.querySelector('canvas');
      if (canvas) {
        // Trigger click near Apollo 11 position
        const rect = canvas.getBoundingClientRect();
        canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: rect.width * 0.55, clientY: rect.height * 0.45, bubbles: true }));
        canvas.dispatchEvent(new PointerEvent('pointerup', { clientX: rect.width * 0.55, clientY: rect.height * 0.45, bubbles: true }));
      }
    `
  });

  await new Promise(r => setTimeout(r, 2000));
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'trek_orbital_moon_dossier.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved trek_orbital_moon_dossier.png');

  ws.close();
  edgeProc.kill();
  previewProc.kill();
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
