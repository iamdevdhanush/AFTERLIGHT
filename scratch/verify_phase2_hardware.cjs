const http = require('http');
const fs = require('fs');
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
      name: 'scratch/phase2_01_search_opportunity.png',
      url: 'http://127.0.0.1:5174/?state=PLANETARY_ARCHAEOLOGY&dest=mars',
      action: async () => {
        // Open search, type Opportunity, click Opportunity Rover
        await send('Runtime.evaluate', {
          expression: `
            const input = document.querySelector('input[placeholder*="Search planetary"]');
            if (input) {
              input.focus();
              input.value = 'Opportunity';
              input.dispatchEvent(new Event('input', { bubbles: true }));
            }
          `
        });
        await new Promise(r => setTimeout(r, 800));
        await send('Runtime.evaluate', {
          expression: `
            const oppBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Final Known Position') || b.textContent.includes('Opportunity Rover'));
            if (oppBtn) oppBtn.click();
          `
        });
      },
      waitMs: 4000
    },
    {
      name: 'scratch/phase2_02_rover_traverse_path.png',
      url: 'http://127.0.0.1:5174/?state=PLANETARY_ARCHAEOLOGY&dest=mars',
      action: async () => {
        // Re-focus on Opportunity Rover to see full 3D traverse ribbon and waypoints
        await send('Runtime.evaluate', {
          expression: `
            const dirBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('DIRECTORY'));
            if (dirBtn) dirBtn.click();
          `
        });
        await new Promise(r => setTimeout(r, 600));
        await send('Runtime.evaluate', {
          expression: `
            const oppBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Opportunity Rover — Final'));
            if (oppBtn) oppBtn.click();
          `
        });
      },
      waitMs: 4000
    },
    {
      name: 'scratch/phase2_03_hardware_filter_drawer.png',
      url: 'http://127.0.0.1:5174/?state=PLANETARY_ARCHAEOLOGY&dest=mars',
      action: async () => {
        // Open filter drawer
        await send('Runtime.evaluate', {
          expression: `
            const filterBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('FILTERS'));
            if (filterBtn) filterBtn.click();
          `
        });
      },
      waitMs: 3000
    },
    {
      name: 'scratch/phase2_04_discarded_component_modal.png',
      url: 'http://127.0.0.1:5174/?state=PLANETARY_ARCHAEOLOGY&dest=mars',
      action: async () => {
        // Open directory, click Curiosity Heat Shield or Opportunity Heat Shield
        await send('Runtime.evaluate', {
          expression: `
            const dirBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('DIRECTORY'));
            if (dirBtn) dirBtn.click();
          `
        });
        await new Promise(r => setTimeout(r, 600));
        await send('Runtime.evaluate', {
          expression: `
            const heatBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Heat Shield') || b.textContent.includes('Discarded'));
            if (heatBtn) heatBtn.click();
          `
        });
      },
      waitMs: 3500
    },
    {
      name: 'scratch/phase2_05_moon_alsep_and_impacts.png',
      url: 'http://127.0.0.1:5174/?state=PLANETARY_ARCHAEOLOGY&dest=moon',
      action: async () => {
        // Open directory, click Apollo 13 Saturn IVB Impact Crater
        await send('Runtime.evaluate', {
          expression: `
            const dirBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('DIRECTORY'));
            if (dirBtn) dirBtn.click();
          `
        });
        await new Promise(r => setTimeout(r, 600));
        await send('Runtime.evaluate', {
          expression: `
            const impactBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Saturn IVB') || b.textContent.includes('Apollo 13'));
            if (impactBtn) impactBtn.click();
          `
        });
      },
      waitMs: 3500
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
  console.log('Finished capturing all Phase 2 verification screenshots successfully!');
}

main().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
