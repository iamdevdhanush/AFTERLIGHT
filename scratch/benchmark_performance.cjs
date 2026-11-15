const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const WS = globalThis.WebSocket;

async function runBenchmark(suiteName = 'BEFORE') {
  console.log(`=== RUNNING AFTERLIGHT PERFORMANCE BENCHMARK: ${suiteName} ===`);

  const PORT = 5174;
  const CDP_PORT = 9290;

  // 1. In-process static server
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
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.woff2': 'font/woff2',
    };

    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
    });
    fs.createReadStream(filePath).pipe(res);
  });

  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`✓ Static server listening on http://127.0.0.1:${PORT}`);

  // 2. Measure JS bundle size
  let totalBundleBytes = 0;
  const distAssetsDir = path.join('d:\\NASA\\dist\\assets');
  if (fs.existsSync(distAssetsDir)) {
    fs.readdirSync(distAssetsDir).forEach((f) => {
      if (f.endsWith('.js')) {
        totalBundleBytes += fs.statSync(path.join(distAssetsDir, f)).size;
      }
    });
  }
  const bundleSizeMB = (totalBundleBytes / (1024 * 1024)).toFixed(2);
  console.log(`Production JS Bundle Size: ${bundleSizeMB} MB (${totalBundleBytes} bytes)`);

  // 3. Launch Edge headless
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

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  const resolutions = [
    { label: '1920x1080 (Desktop Full HD)', width: 1920, height: 1080, mobile: false },
    { label: '1366x768 (Standard Laptop)', width: 1366, height: 768, mobile: false },
    { label: '1024x768 (Tablet Landscape)', width: 1024, height: 768, mobile: false },
    { label: '390x844 (Mobile Phone)', width: 390, height: 844, mobile: true },
  ];

  const results = [];

  for (const res of resolutions) {
    console.log(`\nTesting viewport: ${res.label}...`);
    await send('Emulation.setDeviceMetricsOverride', {
      width: res.width,
      height: res.height,
      deviceScaleFactor: res.mobile ? 2 : 1,
      mobile: res.mobile,
    });

    const startNav = Date.now();
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}` });
    await new Promise((r) => setTimeout(r, 3000));

    // Measure timing and memory
    const perfData = await evaluate(`
      (() => {
        const perf = window.performance;
        const nav = perf.getEntriesByType('navigation')[0] || {};
        const paint = perf.getEntriesByType('paint');
        const fcp = paint.find(p => p.name === 'first-contentful-paint');
        const memory = perf.memory ? {
          usedJSHeapSize: perf.memory.usedJSHeapSize,
          totalJSHeapSize: perf.memory.totalJSHeapSize,
        } : null;

        return {
          pageLoadMs: nav.loadEventEnd > 0 ? (nav.loadEventEnd - nav.startTime) : (Date.now() - ${startNav}),
          fcpMs: fcp ? fcp.startTime : null,
          domInteractiveMs: nav.domInteractive || null,
          memory,
        };
      })()
    `);

    // Measure FPS and frame drops over 3 seconds during animation & scroll interaction
    const fpsData = await evaluate(`
      new Promise((resolve) => {
        const frameTimes = [];
        let lastTime = performance.now();
        let frameDrops = 0;
        let framesCount = 0;
        const startTime = performance.now();
        const duration = 2500; // 2.5 seconds

        const container = document.querySelector('div[class*="overflow-y-auto"]') || window;

        function loop(now) {
          const delta = now - lastTime;
          lastTime = now;
          frameTimes.push(delta);
          framesCount++;

          if (delta > 24) { // Dropped frame (took > 24ms, i.e. < 41 FPS)
            frameDrops++;
          }

          // Simulate active scrolling interaction
          if (container && container.scrollTop !== undefined) {
            container.scrollTop += 8;
          }

          if (now - startTime < duration) {
            requestAnimationFrame(loop);
          } else {
            const avgDelta = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
            const avgFps = 1000 / avgDelta;
            resolve({
              avgFps: Math.round(avgFps * 10) / 10,
              frameDrops,
              framesCount,
              minFps: Math.round(1000 / Math.max(...frameTimes)),
              maxDeltaMs: Math.round(Math.max(...frameTimes) * 10) / 10,
            });
          }
        }

        requestAnimationFrame(loop);
      })
    `);

    const usedHeapMB = perfData.memory ? (perfData.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1) : 'N/A';

    console.log(`  Page Load Time: ${Math.round(perfData.pageLoadMs)} ms`);
    console.log(`  DOM Interactive: ${Math.round(perfData.domInteractiveMs)} ms`);
    console.log(`  Average FPS: ${fpsData.avgFps} FPS`);
    console.log(`  Frame Drops (>24ms): ${fpsData.frameDrops} / ${fpsData.framesCount} frames`);
    console.log(`  Max Frame Latency: ${fpsData.maxDeltaMs} ms`);
    console.log(`  JS Heap Memory: ${usedHeapMB} MB`);

    results.push({
      resolution: res.label,
      pageLoadMs: Math.round(perfData.pageLoadMs),
      domInteractiveMs: Math.round(perfData.domInteractiveMs),
      avgFps: fpsData.avgFps,
      frameDrops: fpsData.frameDrops,
      framesCount: fpsData.framesCount,
      maxDeltaMs: fpsData.maxDeltaMs,
      usedHeapMB,
      bundleSizeMB,
    });
  }

  ws.close();
  edgeProc.kill();
  server.close();

  const outReport = path.join(__dirname, `benchmark_${suiteName.toLowerCase()}.json`);
  fs.writeFileSync(outReport, JSON.stringify(results, null, 2));
  console.log(`\n✓ Benchmark results written to ${outReport}`);
  return results;
}

const suite = process.argv[2] || 'AFTER';
runBenchmark(suite).catch((err) => {
  console.error('Benchmark error:', err);
  process.exit(1);
});
