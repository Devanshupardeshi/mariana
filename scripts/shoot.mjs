/**
 * Dependency-free CDP screenshotter for MARIANA QA.
 *
 * Drives the already-running headless Chrome (remote-debugging-port 9333) over
 * the DevTools Protocol using Node's built-in fetch + WebSocket. Seeks the
 * descent to a set of scroll-progress points via the in-page `__mariana.seek`
 * hook and captures a viewport PNG for each act.
 */
import { writeFileSync } from 'node:fs';

const PORT = process.argv[2] || '9333';
const PREFIX = process.argv[3] || '2';
const CDP = `http://127.0.0.1:${PORT}`;
const SHOT_DIR = 'C:/Users/devan/Desktop/20.06/shots';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SHOTS = [
  [null, `${PREFIX}0-surface`],
  [0.27, `${PREFIX}1-twilight`],
  [0.5, `${PREFIX}2-midnight`],
  [0.68, `${PREFIX}3-abyss`],
  [0.83, `${PREFIX}4-mariana`],
  [0.92, `${PREFIX}5-sanctuary`],
  [0.99, `${PREFIX}6-termination`],
];

async function main() {
  const targets = await (await fetch(`${CDP}/json`)).json();
  const page =
    targets.find((t) => t.type === 'page' && t.url.includes('localhost:3000')) ||
    targets.find((t) => t.type === 'page');
  if (!page) throw new Error('no page target found');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  });
  await new Promise((res, rej) => {
    ws.addEventListener('open', res);
    ws.addEventListener('error', rej);
  });

  const send = (method, params = {}) =>
    new Promise((res) => {
      const i = ++id;
      pending.set(i, res);
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  const evalJs = (expression) =>
    send('Runtime.evaluate', { expression, awaitPromise: true });

  await send('Page.enable');
  await send('Runtime.enable');

  // Reload to pick up the latest production build, then wait for first paint.
  await send('Page.navigate', { url: 'http://localhost:3000/' });
  await sleep(2500);

  // Make sure the experience has revealed and the seek hook exists.
  for (let i = 0; i < 20; i++) {
    const r = await evalJs('(!!(window.__mariana)).toString()');
    if (r.result && r.result.result && r.result.result.value === 'true') break;
    await sleep(700);
  }
  // Let the atmospheric preloader fully complete before the first (surface) shot.
  await sleep(5200);

  for (const [p, name] of SHOTS) {
    if (p !== null) {
      await evalJs(`window.__mariana && window.__mariana.seek(${p})`);
      await sleep(1900);
    } else {
      await sleep(400);
    }
    const res = await send('Page.captureScreenshot', { format: 'png' });
    if (res.result && res.result.data) {
      writeFileSync(`${SHOT_DIR}/${name}.png`, Buffer.from(res.result.data, 'base64'));
      console.log('saved', name);
    } else {
      console.log('FAILED', name, JSON.stringify(res).slice(0, 200));
    }
  }
  ws.close();
}

main()
  .then(() => console.log('DONE'))
  .catch((e) => {
    console.error('ERR', e);
    process.exit(1);
  });
