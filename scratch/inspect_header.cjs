const http = require('http');
const { spawn } = require('child_process');

async function inspectHeader() {
  const edgeProc = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new', '--remote-debugging-port=9290', '--no-sandbox', 'about:blank'
  ]);
  await new Promise(r => setTimeout(r, 1500));

  const targets = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9290/json', res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
  const pageTarget = targets.find(t => t.type === 'page') || targets[0];
  const ws = new globalThis.WebSocket(pageTarget.webSocketDebuggerUrl);
  let id = 1; const callbacks = new Map();
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && callbacks.has(m.id)) {
      const cb = callbacks.get(m.id); callbacks.delete(m.id);
      if (m.error) cb.reject(m.error); else cb.resolve(m.result);
    }
  };
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const reqId = id++; callbacks.set(reqId, { resolve, reject });
      ws.send(JSON.stringify({ id: reqId, method, params }));
    });
  }
  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Runtime.enable');
  const evalFn = exp => send('Runtime.evaluate', { expression: exp, returnByValue: true, awaitPromise: true }).then(r => r.result?.value);

  await send('Page.navigate', { url: 'http://127.0.0.1:5174/' });
  await new Promise(r => setTimeout(r, 2000));
  console.log('1. Header before click:', await evalFn('document.querySelector("header").innerText'));
  
  await evalFn('Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("SKIP TO MUSEUM")).click()');
  await new Promise(r => setTimeout(r, 1200));
  console.log('2. Header after click:', await evalFn('document.querySelector("header").innerText'));

  ws.close(); edgeProc.kill(); process.exit(0);
}
inspectHeader().catch(e => { console.error(e); process.exit(1); });

