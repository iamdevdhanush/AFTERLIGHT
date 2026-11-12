const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');

async function main() {
  console.log('Starting preview server...');
  const previewProc = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--port', '5050', '--host', '127.0.0.1'], {
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

  // Get debug targets from http://127.0.0.1:9222/json
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
  console.log('Target WebSocket URL:', pageTarget.webSocketDebuggerUrl);

  // Use native WebSocket (built into Node 22)
  const WS = globalThis.WebSocket;
  const ws = new WS(pageTarget.webSocketDebuggerUrl);

  let id = 1;
  const callbacks = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log('BROWSER CONSOLE:', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('BROWSER EXCEPTION:', msg.params.exceptionDetails);
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
  console.log('Connected to browser via DevTools WebSocket!');

  await send('Page.enable');
  await send('Runtime.enable');

  const screens = [
    { name: 'screenshot_arrival.png', url: 'http://127.0.0.1:5050/?state=ARRIVAL&dest=moon' },
    { name: 'screenshot_inspection.png', url: 'http://127.0.0.1:5050/?state=ARTIFACT_INSPECTION&dest=moon&artifact=apollo11_eagle' },
    { name: 'screenshot_legacy.png', url: 'http://127.0.0.1:5050/?state=LEGACY&dest=moon&artifact=apollo11_eagle' },
    { name: 'screenshot_exploration.png', url: 'http://127.0.0.1:5050/?state=FREE_EXPLORATION&dest=moon' }
  ];

  for (const s of screens) {
    console.log('Navigating to', s.url);
    await send('Page.navigate', { url: s.url });
    // Wait for 3 seconds for Three.js WebGL & model to finish rendering
    await new Promise(r => setTimeout(r, 3500));
    console.log('Capturing screenshot:', s.name);
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(s.name, Buffer.from(screenshot.data, 'base64'));
    console.log('Saved', s.name, fs.statSync(s.name).size, 'bytes');
  }

  ws.close();
  edgeProc.kill();
  previewProc.kill();
  console.log('Finished capturing validation screenshots.');
}

main().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
