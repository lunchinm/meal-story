/**
 * 轨迹追踪：逐步打印当前节点与画面首行，用于定位循环。
 * 用法：node tools/qa-trace.mjs http://127.0.0.1:4174 200
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PORT = 9600 + Math.floor(Math.random() * 300);
const baseUrl = process.argv[2] ?? 'http://127.0.0.1:4174';
const maxSteps = Number(process.argv[3] ?? 200);
const BROWSERS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];

class Cdp {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map();
    ws.addEventListener('message', (e) => {
      const m = JSON.parse(e.data);
      if (m.id && this.pending.has(m.id)) {
        const { ok, bad } = this.pending.get(m.id); this.pending.delete(m.id);
        m.error ? bad(new Error(m.error.message)) : ok(m.result);
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((ok, bad) => {
      this.pending.set(id, { ok, bad });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); bad(new Error('timeout ' + method)); } }, 15000);
    });
  }
  async eval(expression) {
    const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return r.result?.value;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickSel(cdp, sel) {
  const box = await cdp.eval(`(() => { const el = document.querySelector(${JSON.stringify(sel)});
    if (!el) return null; const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return null; return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  if (!box) return false;
  for (const type of ['mousePressed', 'mouseReleased']) {
    await cdp.send('Input.dispatchMouseEvent', { type, x: Math.round(box.x), y: Math.round(box.y), button: 'left', clickCount: 1 });
    await sleep(12);
  }
  await sleep(110);
  return true;
}

const profile = mkdtempSync(join(tmpdir(), 'meal-trace-'));
const browser = spawn(BROWSERS.find((p) => existsSync(p)), [
  '--headless=new', '--disable-gpu', '--mute-audio', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`, '--window-size=1400,900', 'about:blank',
], { stdio: 'ignore' });

try {
  let target = null;
  for (let i = 0; i < 60 && !target; i += 1) {
    await sleep(250);
    try { target = (await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json())).find((t) => t.type === 'page'); } catch { /* */ }
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((ok) => ws.addEventListener('open', ok, { once: true }));
  const cdp = new Cdp(ws);
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable');
  cdp.ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params?.exceptionDetails;
      console.log('PAGE-ERROR', d?.text, d?.exception?.description?.split('\n')[0]);
    }
    if (m.method === 'Runtime.consoleAPICalled' && m.params?.type === 'error') {
      console.log('CONSOLE-ERROR', (m.params.args || []).map((a) => a.value ?? a.description).join(' ').slice(0, 200));
    }
  });
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp.send('Page.navigate', { url: baseUrl });
  await sleep(900);
  await clickSel(cdp, '.title-screen .btn-primary');
  await sleep(400);

  for (let i = 1; i <= maxSteps; i += 1) {
    const info = await cdp.eval(`(() => {
      const node = JSON.parse(localStorage.getItem('meal_save_v1') || '{}').nodeId;
      const line = (document.querySelector('.dialog .text, .chat-text')?.innerText || '').slice(0, 26);
      const ui = document.querySelector('.explore-card') ? 'explore'
        : document.querySelector('.nb-item') ? 'notebook'
        : document.querySelector('.food') ? 'plate'
        : document.querySelector('.quick') ? 'quick'
        : document.querySelector('.choice') ? 'choice'
        : document.querySelector('.ending-title') ? 'ending'
        : document.querySelector('.chapter-card') ? 'chapter'
        : document.querySelector('.phone') ? 'chat' : 'dialog';
      return { node, ui, line };
    })()`);
    console.log(`${String(i).padStart(4)} ${info.ui.padEnd(9)} ${String(info.node).padEnd(14)} ${info.line}`);

    if (info.ui === 'dialog' && info.node === 'a1-it') {
      const dump = await cdp.eval(`[...document.querySelectorAll('body *')].map((e) => e.tagName + '.' + (e.className || '')).slice(0, 40).join(' | ')`);
      console.log('STALL-DUMP', dump);
      break;
    }
    if (info.ui === 'ending') break;
    if (info.ui === 'explore') {
      const n = await cdp.eval(`document.querySelectorAll('.explore-card').length`);
      for (let k = 1; k <= n; k += 1) await clickSel(cdp, `.explore-card:nth-child(${k})`);
      await clickSel(cdp, '.board-foot .btn-primary');
    } else if (info.ui === 'notebook') {
      await clickSel(cdp, '.board-foot .btn-primary');
    } else if (info.ui === 'poster') {
      await clickSel(cdp, '.poster-copy .spot:nth-child(2)');
      await clickSel(cdp, '.poster-copy .spot:nth-child(3)');
      await clickSel(cdp, '.board-foot .btn-primary');
    } else if (info.ui === 'compare') {
      await clickSel(cdp, '.offer:nth-child(1) .btn');
      await clickSel(cdp, '.offer:nth-child(1)');
      await clickSel(cdp, '.board-foot .btn-primary');
    } else if (info.ui === 'review') {
      await clickSel(cdp, '.record:nth-child(3)');
      await clickSel(cdp, '.board-foot .btn-primary');
    } else if (info.ui === 'claims') {
      await clickSel(cdp, '.claim');
      await clickSel(cdp, '.board-foot .btn-primary');
    } else if (info.ui === 'plate') {
      await clickSel(cdp, '.food:nth-child(1)');
      await clickSel(cdp, '.board-foot .btn-primary');
    } else if (info.ui === 'quick') {
      await clickSel(cdp, '.quick');
    } else if (info.ui === 'choice') {
      await clickSel(cdp, '.choice');
    } else if (info.ui === 'chapter') {
      await clickSel(cdp, '.chapter-card');
    } else {
      await clickSel(cdp, '.dialog, .phone');
    }
  }
  try { await cdp.send('Browser.close'); } catch { /* */ }
} finally {
  browser.kill();
  await sleep(300);
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* */ }
}
