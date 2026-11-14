const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function main() {
  console.log('Starting preview server on port 5174...');
  const previewProc = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--port', '5174', '--host', '127.0.0.1'], {
    stdio: 'ignore'
  });

  await new Promise(r => setTimeout(r, 2500));

  console.log('Starting Edge in headless remote debugging mode...');
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--enable-webgl',
    '--use-gl=angle',
    '--window-size=1920,1080',
    '--no-sandbox',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 3000));

  function getTargets() {
    return new Promise((resolve, reject) => {
      http.get('http://127.0.0.1:9223/json', res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });
  }

  const targets = await getTargets();
  const pageTarget = targets.find(t => t.type === 'page') || targets[0];
  console.log('Target WebSocket URL:', pageTarget.webSocketDebuggerUrl);

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
  console.log('Connected to browser via DevTools WebSocket!');

  await send('Page.enable');
  await send('Runtime.enable');

  const artifactDir = 'C:\\Users\\Adithya s shetty\\.gemini\\antigravity\\brain\\dc2a5fb0-dfd3-4d27-95dc-e81223bad2b3';

  // 1. Moon Orbital Globe
  console.log('Navigating to Moon 3D Orbital Globe...');
  await send('Page.navigate', { url: 'http://127.0.0.1:5174/?state=PLANETARY_ARCHAEOLOGY&dest=moon' });
  await new Promise(r => setTimeout(r, 4500));
  const moonShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'trek_orbital_moon.png'), Buffer.from(moonShot.data, 'base64'));
  console.log('Saved trek_orbital_moon.png');

  // 2. Mars Orbital Globe
  console.log('Navigating to Mars 3D Orbital Globe...');
  await send('Page.navigate', { url: 'http://127.0.0.1:5174/?state=PLANETARY_ARCHAEOLOGY&dest=mars' });
  await new Promise(r => setTimeout(r, 4500));
  const marsShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'trek_orbital_mars.png'), Buffer.from(marsShot.data, 'base64'));
  console.log('Saved trek_orbital_mars.png');

  // 3. Destination Select Screen with 3D Map CTA
  console.log('Navigating to Destination Select Screen...');
  await send('Page.navigate', { url: 'http://127.0.0.1:5174/?state=DESTINATION_SELECT&dest=mars' });
  await new Promise(r => setTimeout(r, 3000));
  const destShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'trek_destination_select.png'), Buffer.from(destShot.data, 'base64'));
  console.log('Saved trek_destination_select.png');

  console.log('All verification screenshots captured successfully!');
  ws.close();
  edgeProc.kill();
  previewProc.kill();
  process.exit(0);
}

main().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
