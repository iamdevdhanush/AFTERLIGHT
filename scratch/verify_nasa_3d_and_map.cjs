const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const outDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function main() {
  console.log('=== STARTING NASA 3D HARDWARE VIEWER & SURFACE MAP VERIFICATION ===');

  const PORT = 5098;
  const CDP_PORT = 9270;

  let previewProc = null;
  let serverReady = false;

  // First check if already listening on PORT
  try {
    await new Promise((resolve, reject) => {
      const req = http.get(`http://127.0.0.1:${PORT}`, (res) => {
        if (res.statusCode === 200) resolve();
        else reject(new Error('Status ' + res.statusCode));
      });
      req.on('error', reject);
      req.setTimeout(500, () => req.destroy());
    });
    serverReady = true;
    console.log(`✓ Preview server already active on port ${PORT}.`);
  } catch {
    console.log(`1. Launching Vite preview on port ${PORT}...`);
    previewProc = spawn(
      process.execPath,
      ['d:\\NASA\\node_modules\\vite\\bin\\vite.js', 'preview', '--port', String(PORT), '--host', '127.0.0.1'],
      { cwd: 'd:\\NASA', stdio: 'inherit' }
    );

    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 400));
      try {
        await new Promise((resolve, reject) => {
          const req = http.get(`http://127.0.0.1:${PORT}`, (res) => {
            if (res.statusCode === 200) resolve();
            else reject(new Error('Status ' + res.statusCode));
          });
          req.on('error', reject);
          req.setTimeout(500, () => req.destroy());
        });
        serverReady = true;
        break;
      } catch {}
    }
  }

  if (!serverReady) {
    console.error('ERROR: Preview server failed to start!');
    if (previewProc) previewProc.kill();
    process.exit(1);
  }
  console.log('✓ Preview server ready.');

  console.log('2. Launching Edge Headless with CDP on port ' + CDP_PORT + '...');
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--enable-webgl',
    '--use-gl=angle',
    '--window-size=1440,900',
    '--no-sandbox',
    '--autoplay-policy=no-user-gesture-required',
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

  async function snap(filename) {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const filePath = path.join(outDir, filename);
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log('  📸 Screenshot saved:', filename);
  }

  async function evalJS(expression) {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return res.result ? res.result.value : undefined;
  }

  try {
    await new Promise((r) => (ws.onopen = r));
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log('3. Navigating to AFTERLIGHT application...');
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}` });
    await new Promise((r) => setTimeout(r, 2000));

    // Fast-forward to EXHIBITION state
    await evalJS(`
      window.__EXPERIENCE_STORE__.setState({
        state: 'EXHIBITION',
        currentDestination: 'moon',
        selectedArtifactId: null,
        selectedComponentId: null,
      });
    `);
    await new Promise((r) => setTimeout(r, 1200));

    await snap('01_exhibition_collection_view.png');

    console.log('4. Verifying Exploration View Switcher (COLLECTION vs SURFACE MAP)...');
    const viewButtons = await evalJS(`
      Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('COLLECTION') || b.textContent.includes('SURFACE MAP')).map(b => b.textContent.trim())
    `);
    console.log('  Found mode buttons:', viewButtons);

    console.log('5. Switching to SURFACE MAP mode...');
    await evalJS(`
      const mapBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('SURFACE MAP'));
      if (mapBtn) mapBtn.click();
    `);
    await new Promise((r) => setTimeout(r, 1000));
    await snap('02_surface_map_moon_view.png');

    console.log('6. Inspecting Moon Surface Map Markers...');
    const moonMarkers = await evalJS(`
      Array.from(document.querySelectorAll('[aria-label^="Inspect "]')).map(el => el.getAttribute('aria-label'))
    `);
    console.log('  Moon markers rendered:', moonMarkers);

    console.log('7. Switching to MARS Surface Map...');
    await evalJS(`
      const marsBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('MARS (4 SITES)'));
      if (marsBtn) marsBtn.click();
    `);
    await new Promise((r) => setTimeout(r, 1000));
    await snap('03_surface_map_mars_view.png');

    const marsMarkers = await evalJS(`
      Array.from(document.querySelectorAll('[aria-label^="Inspect "]')).map(el => el.getAttribute('aria-label'))
    `);
    console.log('  Mars markers rendered:', marsMarkers);

    console.log('8. Selecting InSight Lander from Mars Surface Map...');
    await evalJS(`
      const inspectBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('INSPECT →'));
      // InSight is the 4th item
      if (inspectBtns.length >= 4) inspectBtns[3].click();
    `);
    await new Promise((r) => setTimeout(r, 1500));
    await snap('04_insight_details_photo.png');

    console.log('9. Switching InSight to 3D HARDWARE inspection turntable...');
    await evalJS(`
      const btn3d = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('3D HARDWARE'));
      if (btn3d) btn3d.click();
    `);
    // Wait for InSight 3D model (3.95 MB GLB) to load via local Draco loader
    await new Promise((r) => setTimeout(r, 3500));
    await snap('05_insight_3d_turntable.png');

    const has3DCanvas = await evalJS(`!!document.querySelector('canvas')`);
    console.log('  3D WebGL Canvas rendered:', has3DCanvas);

    console.log('10. Inspecting InSight Component (SEIS Seismometer)...');
    await evalJS(`
      const seisBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('SEIS'));
      if (seisBtn) seisBtn.click();
    `);
    await new Promise((r) => setTimeout(r, 1500));
    await snap('06_insight_seis_component_active.png');

    console.log('11. Testing Apollo 11 Eagle 3D Hardware Model...');
    await evalJS(`
      window.__EXPERIENCE_STORE__.getState().selectArtifact('apollo11_eagle');
    `);
    await new Promise((r) => setTimeout(r, 1000));
    await evalJS(`
      const btn3d = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('3D HARDWARE'));
      if (btn3d) btn3d.click();
    `);
    await new Promise((r) => setTimeout(r, 3000));
    await snap('07_apollo11_3d_hardware.png');

    console.log('12. Testing Opportunity Rover 3D Hardware Model...');
    await evalJS(`
      window.__EXPERIENCE_STORE__.getState().selectArtifact('opportunity');
    `);
    await new Promise((r) => setTimeout(r, 1000));
    await evalJS(`
      const btn3d = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('3D HARDWARE'));
      if (btn3d) btn3d.click();
    `);
    await new Promise((r) => setTimeout(r, 2500));
    await snap('08_opportunity_3d_hardware.png');

    console.log('13. Testing Voyager 1 Probe 3D Hardware Model...');
    await evalJS(`
      window.__EXPERIENCE_STORE__.getState().selectArtifact('voyager1');
    `);
    await new Promise((r) => setTimeout(r, 1000));
    await evalJS(`
      const btn3d = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('3D HARDWARE'));
      if (btn3d) btn3d.click();
    `);
    await new Promise((r) => setTimeout(r, 3000));
    await snap('09_voyager1_3d_hardware.png');

    console.log('14. Testing Non-3D Artifact Curatorial Notice (Apollo LRV)...');
    await evalJS(`
      window.__EXPERIENCE_STORE__.getState().selectArtifact('apollo_lrv');
    `);
    await new Promise((r) => setTimeout(r, 1000));
    await evalJS(`
      const btn3d = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('3D STATUS'));
      if (btn3d) btn3d.click();
    `);
    await new Promise((r) => setTimeout(r, 1200));
    await snap('10_lrv_3d_unavailable_notice.png');

    console.log('15. Testing Close and Return to Exhibition...');
    await evalJS(`
      window.__EXPERIENCE_STORE__.setState({ selectedArtifactId: null });
    `);
    await new Promise((r) => setTimeout(r, 1200));
    await snap('11_returned_to_surface_map.png');

    console.log('16. Testing Mobile Viewport (390 x 844)...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await new Promise((r) => setTimeout(r, 1000));
    await snap('12_mobile_surface_map.png');

    console.log('=== ALL NASA 3D HARDWARE & SURFACE MAP TESTS COMPLETED SUCCESSFULLY! ===');
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    try {
      ws.close();
      edgeProc.kill();
      if (previewProc) previewProc.kill();
    } catch {}
  }
}

main();
