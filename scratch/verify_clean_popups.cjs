const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function main() {
  console.log('Starting preview server on port 5173...');
  const previewProc = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--port', '5173', '--host', '127.0.0.1'], {
    stdio: 'ignore'
  });

  await new Promise(r => setTimeout(r, 2500));

  console.log('Starting Edge in headless remote debugging mode...');
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--enable-webgl',
    '--use-gl=angle',
    '--window-size=1920,1080',
    '--no-sandbox',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 3000));

  function getTargets() {
    return new Promise((resolve, reject) => {
      http.get('http://127.0.0.1:9222/json', res => {
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

  // 1. Moon with Apollo 11 selected
  console.log('Navigating to Moon 3D Orbital Globe...');
  await send('Page.navigate', { url: 'http://127.0.0.1:5173/?state=PLANETARY_ARCHAEOLOGY&dest=moon' });
  await new Promise(r => setTimeout(r, 4000));

  console.log('Selecting Apollo 11 on Moon...');
  await send('Runtime.evaluate', {
    expression: `
      if (window.__selectPlanetarySite && window.__allPlanetarySites) {
        const apollo = window.__allPlanetarySites.find(s => s.id === 'apollo_11');
        if (apollo) window.__selectPlanetarySite(apollo);
      }
    `
  });
  await new Promise(r => setTimeout(r, 3000));

  const moonShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'fixed_moon_apollo11_clean.png'), Buffer.from(moonShot.data, 'base64'));
  console.log('Saved fixed_moon_apollo11_clean.png');

  // 2. Mars with Viking 1 selected
  console.log('Navigating to Mars 3D Orbital Globe...');
  await send('Page.navigate', { url: 'http://127.0.0.1:5173/?state=PLANETARY_ARCHAEOLOGY&dest=mars' });
  await new Promise(r => setTimeout(r, 4000));

  console.log('Selecting Viking 1 on Mars...');
  await send('Runtime.evaluate', {
    expression: `
      if (window.__selectPlanetarySite && window.__allPlanetarySites) {
        const viking = window.__allPlanetarySites.find(s => s.id === 'viking_1');
        if (viking) window.__selectPlanetarySite(viking);
      }
    `
  });
  await new Promise(r => setTimeout(r, 3000));

  const marsShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'fixed_mars_perseverance_clean.png'), Buffer.from(marsShot.data, 'base64'));
  console.log('Saved fixed_mars_perseverance_clean.png');

  // 3. Moon with Apollo 11 HOVERED (demonstrating the sleek, compact, non-scaling micro-HUD tooltip)
  console.log('Navigating to Moon with Apollo 11 hovered...');
  await send('Page.navigate', { url: 'http://127.0.0.1:5173/?state=PLANETARY_ARCHAEOLOGY&dest=moon' });
  await new Promise(r => setTimeout(r, 4000));

  await send('Runtime.evaluate', {
    expression: `
      if (window.__setHoveredSiteId) {
        window.__setHoveredSiteId('apollo_11');
      }
    `
  });
  await new Promise(r => setTimeout(r, 1500));

  const hoverShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'fixed_moon_hover_microhud.png'), Buffer.from(hoverShot.data, 'base64'));
  console.log('Saved fixed_moon_hover_microhud.png');

  console.log('All verification screenshots captured!');
  ws.close();
  edgeProc.kill();
  previewProc.kill();
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
