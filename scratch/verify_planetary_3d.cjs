const http = require('http');
const fs = require('fs');
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
  console.log('Target WebSocket URL:', pageTarget.webSocketDebuggerUrl);

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
      console.error('BROWSER EXCEPTION:', JSON.stringify(msg.params.exceptionDetails));
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

  const screenshots = [
    {
      name: 'scratch/screenshot_01_destination_select.png',
      url: 'http://127.0.0.1:5173/?state=DESTINATION_SELECT&dest=moon',
      waitMs: 3000
    },
    {
      name: 'scratch/screenshot_02_moon_3d_globe.png',
      url: 'http://127.0.0.1:5173/?state=PLANETARY_ARCHAEOLOGY&dest=moon',
      waitMs: 4000
    },
    {
      name: 'scratch/screenshot_03_mars_3d_globe.png',
      url: 'http://127.0.0.1:5173/?state=PLANETARY_ARCHAEOLOGY&dest=mars',
      action: async () => {
        // Click Mars tab button
        await send('Runtime.evaluate', {
          expression: `
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('MARS'));
            if (btn) btn.click();
          `
        });
      },
      waitMs: 4000
    },
    {
      name: 'scratch/screenshot_04_site_modal.png',
      url: 'http://127.0.0.1:5173/?state=PLANETARY_ARCHAEOLOGY&dest=moon',
      action: async () => {
        // Open archive directory and click Apollo 11
        await send('Runtime.evaluate', {
          expression: `
            const dirBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('ARCHIVE DIRECTORY'));
            if (dirBtn) dirBtn.click();
          `
        });
        await new Promise(r => setTimeout(r, 600));
        await send('Runtime.evaluate', {
          expression: `
            const apolloBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Apollo 11'));
            if (apolloBtn) apolloBtn.click();
          `
        });
      },
      waitMs: 3500
    },
    {
      name: 'scratch/screenshot_05_terrain_inspector.png',
      url: 'http://127.0.0.1:5173/?state=PLANETARY_ARCHAEOLOGY&dest=mars',
      action: async () => {
        // Click Mars, open directory, select Curiosity Rover, click inspect terrain
        await send('Runtime.evaluate', {
          expression: `
            const marsBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('MARS'));
            if (marsBtn) marsBtn.click();
          `
        });
        await new Promise(r => setTimeout(r, 600));
        await send('Runtime.evaluate', {
          expression: `
            const dirBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('ARCHIVE DIRECTORY'));
            if (dirBtn) dirBtn.click();
          `
        });
        await new Promise(r => setTimeout(r, 600));
        await send('Runtime.evaluate', {
          expression: `
            const curiosityBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Curiosity'));
            if (curiosityBtn) curiosityBtn.click();
          `
        });
        await new Promise(r => setTimeout(r, 1200));
        await send('Runtime.evaluate', {
          expression: `
            const terrainBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('RE-CENTER') || b.textContent.includes('INSPECT'));
            // Click any regional inspect button or open terrain inspector
            const allBtns = Array.from(document.querySelectorAll('button'));
            const inspectBtn = allBtns.find(b => b.textContent.includes('INSPECT') || b.textContent.includes('TERRAIN'));
            if (inspectBtn) inspectBtn.click();
          `
        });
      },
      waitMs: 4000
    }
  ];

  for (const s of screenshots) {
    console.log('Navigating to', s.url);
    await send('Page.navigate', { url: s.url });
    await new Promise(r => setTimeout(r, s.waitMs));

    if (s.action) {
      console.log('Executing action for', s.name);
      await s.action();
      await new Promise(r => setTimeout(r, 2000));
    }

    console.log('Capturing screenshot:', s.name);
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(s.name, Buffer.from(screenshot.data, 'base64'));
    console.log('Saved', s.name, fs.statSync(s.name).size, 'bytes');
  }

  ws.close();
  try { edgeProc.kill(); } catch (e) {}
  try { previewProc.kill(); } catch (e) {}
  console.log('Finished capturing all verification screenshots successfully!');
}

main().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
