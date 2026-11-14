const http = require('http');
const { spawn } = require('child_process');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const edgeProc = spawn(edgePath, ['--headless=new', '--remote-debugging-port=9289', 'about:blank']);

setTimeout(async () => {
  try {
    const listRes = await new Promise((res, rej) => {
      http.get('http://127.0.0.1:9289/json', (r) => {
        let data = '';
        r.on('data', (c) => (data += c));
        r.on('end', () => res(JSON.parse(data)));
      }).on('error', rej);
    });

    const page = listRes.find((t) => t.type === 'page') || listRes[0];
    const ws = new globalThis.WebSocket(page.webSocketDebuggerUrl);

    await new Promise((r) => (ws.onopen = r));

    ws.send(
      JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `new Promise(resolve => {
            const get = () => {
              const v = window.speechSynthesis.getVoices();
              if (v.length > 0) resolve(v.filter(x => x.lang.startsWith('en')).map(x => ({ name: x.name, lang: x.lang, localService: x.localService })));
              else setTimeout(get, 100);
            };
            get();
            window.speechSynthesis.onvoiceschanged = get;
          })`,
          awaitPromise: true,
          returnByValue: true,
        },
      })
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id === 1) {
        console.log('ENGLISH VOICES IN EDGE/WINDOWS:');
        console.log(JSON.stringify(data.result.result.value, null, 2));
        edgeProc.kill();
        process.exit(0);
      }
    };
  } catch (e) {
    console.error(e);
    edgeProc.kill();
    process.exit(1);
  }
}, 1500);
