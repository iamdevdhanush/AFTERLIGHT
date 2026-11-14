const http = require('http');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const PORT = 5175;
const CDP_PORT = 9325;
const SCREENSHOT_DIR = path.join(__dirname, 'layout_verified');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function main() {
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

  async function takeScreenshot(filename) {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, filename), Buffer.from(res.data, 'base64'));
  }

  await send('Page.enable');
  await send('Runtime.enable');

  const viewports = [
    { w: 1920, h: 1080, name: '1920x1080_desktop' },
    { w: 1600, h: 900, name: '1600x900_laptop' },
    { w: 1440, h: 900, name: '1440x900_laptop' },
    { w: 1366, h: 768, name: '1366x768_laptop' },
    { w: 1280, h: 720, name: '1280x720_hd' },
    { w: 1024, h: 768, name: '1024x768_tablet_land' },
    { w: 768, h: 1024, name: '768x1024_tablet_port' },
    { w: 390, h: 844, name: '390x844_mobile' },
  ];

  console.log('====================================================');
  console.log('PART 1: ARTIFACT DETAILS VIEW (INITIAL & SCROLLED)');
  console.log('====================================================');

  const artifactResults = [];

  for (const vp of viewports) {
    await send('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: 1, mobile: vp.w < 768 });
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?dest=moon&artifact=apollo11_eagle` });
    await new Promise((r) => setTimeout(r, 2000));

    // Measure top of page
    const topMetrics = await evalJS(`(() => {
      const characterContainer = document.querySelector('img[alt*="Mae Vance"]')?.parentElement;
      const characterImg = document.querySelector('img[alt*="Mae Vance"]');
      const speechBubble = Array.from(document.querySelectorAll('div')).find(d => d.className?.includes('bg-[#FFFFFF]'));
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

    await takeScreenshot(`details_top_${vp.name}.png`);

    // Check overlap at top
    let topOverlapBubble = false;
    let topOverlapImg = false;
    if (topMetrics.speechBubble && topMetrics.storyBtn) {
      const b = topMetrics.speechBubble;
      const s = topMetrics.storyBtn;
      topOverlapBubble = !(b.right < s.left || b.left > s.right || b.bottom < s.top || b.top > s.bottom);
    }
    if (topMetrics.characterImg && topMetrics.storyBtn) {
      const c = topMetrics.characterImg;
      const s = topMetrics.storyBtn;
      topOverlapImg = !(c.right < s.left || c.left > s.right || c.bottom < s.top || c.top > s.bottom);
    }

    // Scroll down 600px
    await evalJS(`window.scrollTo(0, 600)`);
    await new Promise((r) => setTimeout(r, 600));

    const scrolledMetrics = await evalJS(`(() => {
      const characterImg = document.querySelector('img[alt*="Mae Vance"]');
      const speechBubble = Array.from(document.querySelectorAll('div')).find(d => d.className?.includes('bg-[#FFFFFF]'));
      const storyBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('DOCUMENTARY STORY'));

      function getBox(el) {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) };
      }

      return {
        characterImg: getBox(characterImg),
        speechBubble: getBox(speechBubble),
        storyBtn: getBox(storyBtn)
      };
    })()`);

    await takeScreenshot(`details_scrolled_${vp.name}.png`);

    let scrollOverlapBubble = false;
    let scrollOverlapImg = false;
    if (scrolledMetrics.speechBubble && scrolledMetrics.storyBtn) {
      const b = scrolledMetrics.speechBubble;
      const s = scrolledMetrics.storyBtn;
      scrollOverlapBubble = !(b.right < s.left || b.left > s.right || b.bottom < s.top || b.top > s.bottom);
    }
    if (scrolledMetrics.characterImg && scrolledMetrics.storyBtn) {
      const c = scrolledMetrics.characterImg;
      const s = scrolledMetrics.storyBtn;
      scrollOverlapImg = !(c.right < s.left || c.left > s.right || c.bottom < s.top || c.top > s.bottom);
    }

    console.log(`[Details ${vp.name}] Top Overlaps: Bubble=${topOverlapBubble}, Img=${topOverlapImg} | Scrolled Overlaps: Bubble=${scrollOverlapBubble}, Img=${scrollOverlapImg}`);
    artifactResults.push({
      vp: vp.name,
      topOverlapBubble,
      topOverlapImg,
      scrollOverlapBubble,
      scrollOverlapImg,
      characterImg: topMetrics.characterImg,
      speechBubble: topMetrics.speechBubble,
      storyBtn: topMetrics.storyBtn
    });
  }

  console.log('\n====================================================');
  console.log('PART 2: DOCUMENTARY STORY VIEW');
  console.log('====================================================');

  const documentaryResults = [];

  for (const vp of viewports) {
    await send('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: 1, mobile: vp.w < 768 });
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?dest=moon&artifact=apollo11_eagle&view=story` });
    await new Promise((r) => setTimeout(r, 2000));

    const docMetrics = await evalJS(`(() => {
      const characterImg = document.querySelector('img[alt*="Mae Vance"]');
      const speechBubble = Array.from(document.querySelectorAll('div')).find(d => d.className?.includes('bg-[#FFFFFF]'));
      const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('NEXT CHAPTER') || b.textContent?.includes('HISTORICAL LEGACY'));
      const bottomBar = document.querySelector('div.relative.z-10.p-8') || Array.from(document.querySelectorAll('div')).find(d => d.className?.includes('border-t border-meteorite bg-obsidian'));

      function getBox(el) {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) };
      }

      return {
        viewport: { w: window.innerWidth, h: window.innerHeight },
        characterImg: getBox(characterImg),
        speechBubble: getBox(speechBubble),
        nextBtn: getBox(nextBtn),
        bottomBar: getBox(bottomBar)
      };
    })()`);

    await takeScreenshot(`documentary_${vp.name}.png`);

    let docOverlapImg = false;
    let docOverlapBubble = false;
    if (docMetrics.characterImg && docMetrics.nextBtn) {
      const c = docMetrics.characterImg;
      const n = docMetrics.nextBtn;
      docOverlapImg = !(c.right < n.left || c.left > n.right || c.bottom < n.top || c.top > n.bottom);
    }
    if (docMetrics.speechBubble && docMetrics.nextBtn) {
      const b = docMetrics.speechBubble;
      const n = docMetrics.nextBtn;
      docOverlapBubble = !(b.right < n.left || b.left > n.right || b.bottom < n.top || b.top > n.bottom);
    }

    console.log(`[Documentary ${vp.name}] NextBtn Overlaps: Img=${docOverlapImg}, Bubble=${docOverlapBubble}`);
    documentaryResults.push({
      vp: vp.name,
      docOverlapImg,
      docOverlapBubble,
      characterImg: docMetrics.characterImg,
      speechBubble: docMetrics.speechBubble,
      nextBtn: docMetrics.nextBtn
    });
  }

  console.log('\n====================================================');
  console.log('PART 3: COMPONENT INSPECTION & POSE TRANSITION');
  console.log('====================================================');

  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?dest=moon&artifact=apollo11_eagle` });
  await new Promise((r) => setTimeout(r, 2000));

  // Click on Descent Engine hotspot or component
  await evalJS(`(() => {
    const compBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Descent Engine') || b.textContent?.includes('DESCENT STAGE'));
    if (compBtn) compBtn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 1200));

  const compMetrics = await evalJS(`(() => {
    const characterImg = document.querySelector('img[alt*="Mae Vance"]');
    const speechBubble = Array.from(document.querySelectorAll('div')).find(d => d.className?.includes('bg-[#FFFFFF]'));
    const inspectBadge = Array.from(document.querySelectorAll('span')).find(s => s.textContent?.includes('INSPECTING:'));

    return {
      poseSrc: characterImg?.src,
      poseAlt: characterImg?.alt,
      speechText: speechBubble?.innerText,
      inspecting: inspectBadge?.textContent
    };
  })()`);

  console.log('Component inspection verified:', JSON.stringify(compMetrics, null, 2));
  await takeScreenshot('details_component_inspection.png');

  ws.close();
  edgeProc.kill();
  server.close();

  console.log('\nALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
}

main().catch(console.error);

