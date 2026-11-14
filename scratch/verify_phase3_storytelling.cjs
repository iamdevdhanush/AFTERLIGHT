const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

async function main() {
  console.log('Starting preview server on port 5175...');
  const previewProc = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--port', '5175', '--host', '127.0.0.1'], {
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
      name: 'scratch/phase3_01_storytelling_chronicles.png',
      url: 'http://127.0.0.1:5175/?state=PLANETARY_ARCHAEOLOGY&dest=moon',
      action: async () => {
        await new Promise(r => setTimeout(r, 2000));
        // Click CHRONICLES button in HUD
        await send('Runtime.evaluate', {
          expression: `
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('CHRONICLES'));
            if (btn) btn.click();
          `
        });
        await new Promise(r => setTimeout(r, 1200));
      }
    },
    {
      name: 'scratch/phase3_02_story_chapter_landing.png',
      url: 'http://127.0.0.1:5175/?state=PLANETARY_ARCHAEOLOGY&dest=moon',
      action: async () => {
        // Open chronicles, jump to Chapter 4 (Landing and Exploration)
        await send('Runtime.evaluate', {
          expression: `
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('CHRONICLES'));
            if (btn) btn.click();
          `
        });
        await new Promise(r => setTimeout(r, 800));
        await send('Runtime.evaluate', {
          expression: `
            const ch4Btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('LANDING') || b.textContent.trim() === '4' || b.textContent.includes('CHAPTER 4'));
            if (ch4Btn) ch4Btn.click();
            else {
              // Click NEXT CHAPTER three times
              const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('NEXT CHAPTER'));
              if (nextBtn) { nextBtn.click(); nextBtn.click(); nextBtn.click(); }
            }
          `
        });
        await new Promise(r => setTimeout(r, 1500));
      }
    },
    {
      name: 'scratch/phase3_03_hardware_inspection_studio_apollo.png',
      url: 'http://127.0.0.1:5175/?state=PLANETARY_ARCHAEOLOGY&dest=moon',
      action: async () => {
        await new Promise(r => setTimeout(r, 1500));
        // Click 3D STUDIO button in HUD
        await send('Runtime.evaluate', {
          expression: `
            const studioBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('3D STUDIO'));
            if (studioBtn) studioBtn.click();
          `
        });
        await new Promise(r => setTimeout(r, 2000));
      }
    },
    {
      name: 'scratch/phase3_04_hardware_inspection_exploded_view.png',
      url: 'http://127.0.0.1:5175/?state=PLANETARY_ARCHAEOLOGY&dest=moon',
      action: async () => {
        // Open studio and toggle exploded view
        await send('Runtime.evaluate', {
          expression: `
            const studioBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('3D STUDIO'));
            if (studioBtn) studioBtn.click();
          `
        });
        await new Promise(r => setTimeout(r, 1500));
        await send('Runtime.evaluate', {
          expression: `
            const explodedBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('EXPLODED VIEW'));
            if (explodedBtn) explodedBtn.click();
          `
        });
        await new Promise(r => setTimeout(r, 1500));
      }
    },
    {
      name: 'scratch/phase3_05_educational_hub_glossary.png',
      url: 'http://127.0.0.1:5175/?state=PLANETARY_ARCHAEOLOGY&dest=moon',
      action: async () => {
        await new Promise(r => setTimeout(r, 1500));
        // Click ACADEMY in HUD
        await send('Runtime.evaluate', {
          expression: `
            const academyBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('ACADEMY'));
            if (academyBtn) academyBtn.click();
          `
        });
        await new Promise(r => setTimeout(r, 1200));
      }
    },
    {
      name: 'scratch/phase3_06_educational_hub_comparisons.png',
      url: 'http://127.0.0.1:5175/?state=PLANETARY_ARCHAEOLOGY&dest=moon',
      action: async () => {
        // Open Academy and select MISSION COMPARISONS
        await send('Runtime.evaluate', {
          expression: `
            const academyBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('ACADEMY'));
            if (academyBtn) academyBtn.click();
          `
        });
        await new Promise(r => setTimeout(r, 800));
        await send('Runtime.evaluate', {
          expression: `
            const compTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('MISSION COMPARISONS'));
            if (compTab) compTab.click();
          `
        });
        await new Promise(r => setTimeout(r, 1200));
      }
    },
    {
      name: 'scratch/phase3_07_educational_hub_quiz.png',
      url: 'http://127.0.0.1:5175/?state=PLANETARY_ARCHAEOLOGY&dest=moon',
      action: async () => {
        // Open Academy and select KNOWLEDGE CHALLENGE, select option and verify
        await send('Runtime.evaluate', {
          expression: `
            const academyBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('ACADEMY'));
            if (academyBtn) academyBtn.click();
          `
        });
        await new Promise(r => setTimeout(r, 800));
        await send('Runtime.evaluate', {
          expression: `
            const quizTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('KNOWLEDGE CHALLENGE'));
            if (quizTab) quizTab.click();
          `
        });
        await new Promise(r => setTimeout(r, 800));
        await send('Runtime.evaluate', {
          expression: `
            // Click first option of Question 1 (Tunnel air pressure venting)
            const optionA = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Unmodeled residual cabin gas pressure'));
            if (optionA) optionA.click();
          `
        });
        await new Promise(r => setTimeout(r, 400));
        await send('Runtime.evaluate', {
          expression: `
            const verifyBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('VERIFY ANSWER'));
            if (verifyBtn) verifyBtn.click();
          `
        });
        await new Promise(r => setTimeout(r, 1200));
      }
    }
  ];

  for (const s of screenshots) {
    console.log('Navigating to', s.url);
    await send('Page.navigate', { url: s.url });
    // Wait for globe WebGL shaders to finish initial frame
    await new Promise(r => setTimeout(r, 3000));
    if (s.action) {
      await s.action();
    }
    console.log('Capturing screenshot:', s.name);
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(s.name, Buffer.from(screenshot.data, 'base64'));
    console.log('Saved', s.name, fs.statSync(s.name).size, 'bytes');
  }

  ws.close();
  edgeProc.kill();
  previewProc.kill();
  console.log('Finished capturing all Phase 3 validation screenshots.');
}

main().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
