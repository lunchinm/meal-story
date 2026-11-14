/**
 * 全流程试玩机器人：从标题页一路玩到一个结局，顺便验静音、存档、键盘。
 *
 * 用法：node tools/qa-play.mjs http://127.0.0.1:4174 [--max 1200]
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const PORT = 9800 + Math.floor(Math.random() * 400);
const args = process.argv.slice(2);
const baseUrl = (args.find((a) => a.startsWith('http')) ?? 'http://127.0.0.1:4174').replace(/\/$/, '');
const maxSteps = Number(args[args.indexOf('--max') + 1] || 1500);
const shotDir = resolve('tools/out/qa');

const BROWSERS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
];

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.errors = [];
    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { ok, bad } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) bad(new Error(msg.error.message));
        else ok(msg.result);
        return;
      }
      if (msg.method === 'Runtime.exceptionThrown') this.errors.push(msg.params.exceptionDetails.text);
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        this.errors.push(msg.params.args.map((a) => a.value ?? a.description).join(' '));
      }
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((ok, bad) => {
      this.pending.set(id, { ok, bad });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          bad(new Error(`CDP 超时: ${method}`));
        }
      }, 20000);
    });
  }

  async eval(expression) {
    const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
    return r.result?.value;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickSel(cdp, selector) {
  const box = await cdp.eval(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`);
  if (!box) return false;
  for (const type of ['mousePressed', 'mouseReleased']) {
    await cdp.send('Input.dispatchMouseEvent', {
      type, x: Math.round(box.x), y: Math.round(box.y), button: 'left', clickCount: 1,
    });
    await sleep(15);
  }
  await sleep(90);
  return true;
}

async function main() {
  mkdirSync(shotDir, { recursive: true });
  const profile = mkdtempSync(join(tmpdir(), 'meal-qa-'));
  const browser = BROWSERS.find((p) => existsSync(p));
  if (!browser) throw new Error('找不到浏览器');
  const chrome = spawn(browser, [
    '--headless=new', '--disable-gpu', '--mute-audio', '--no-first-run',
    `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
    '--window-size=1400,900', 'about:blank',
  ], { stdio: 'ignore' });

  let cdp;
  const report = [];
  let failures = 0;

  try {
    let target = null;
    for (let i = 0; i < 80 && !target; i += 1) {
      await sleep(250);
      try {
        const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json());
        target = list.find((t) => t.type === 'page');
      } catch { /* 还没起来 */ }
    }
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((ok, bad) => {
      ws.addEventListener('open', ok, { once: true });
      ws.addEventListener('error', () => bad(new Error('CDP 连接失败')), { once: true });
    });
    cdp = new Cdp(ws);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });

    // 1. 标题页 → 开始
    await cdp.send('Page.navigate', { url: baseUrl });
    await sleep(800);
    await clickSel(cdp, '.title-screen .btn-primary');
    await sleep(400);

    // 2. 静音按钮
    const muted = await cdp.eval(`(() => {
      const btn = document.querySelector('.mute-btn, [data-mute], .sound-btn');
      if (!btn) return 'missing';
      btn.click();
      return document.body.classList.contains('muted') || btn.classList.contains('on') || btn.getAttribute('aria-pressed');
    })()`);
    report.push(['静音按钮', muted === 'missing' ? '没有找到静音按钮' : '可切换']);

    // 3. 一路推进
    let steps = 0;
    let ending = null;
    let stuck = 0;
    while (steps < maxSteps) {
      if (await cdp.eval(`!!document.querySelector('.ending-title')`)) {
        ending = await cdp.eval(`document.querySelector('.ending-title').innerText.trim()`);
        break;
      }
      if (await cdp.eval(`!!document.querySelector('.chapter-card')`)) {
        await clickSel(cdp, '.chapter-card');
        steps += 1;
        stuck = 0;
        continue;
      }
      if (await cdp.eval(`!!document.querySelector('.board-foot .btn-primary')`)) {
        // 互动关
        if (await cdp.eval(`!!document.querySelector('.spot')`)) {
          await clickSel(cdp, '.poster-copy .spot:nth-child(3)');
          await clickSel(cdp, '.poster-copy .spot:nth-child(2)');
        } else if (await cdp.eval(`!!document.querySelector('.record')`)) {
          await clickSel(cdp, '.record:nth-child(3)');
        } else if (await cdp.eval(`!!document.querySelector('.offer')`)) {
          await clickSel(cdp, '.offer:nth-child(1) .btn');
          await clickSel(cdp, '.offer:nth-child(2) .btn');
          await clickSel(cdp, '.offer:nth-child(1)');
        } else if (await cdp.eval(`!!document.querySelector('.food')`)) {
          const budget = await cdp.eval(`document.querySelector('.board-head .board-sub')?.innerText ?? ''`);
          if (budget.includes('8')) {
            await clickSel(cdp, '.food:nth-child(1)');
            await clickSel(cdp, '.food:nth-child(3)');
            await clickSel(cdp, '.food:nth-child(4)');
          } else {
            await clickSel(cdp, '.food:nth-child(1)');
            await clickSel(cdp, '.food:nth-child(4)');
            await clickSel(cdp, '.food:nth-child(5)');
            await clickSel(cdp, '.food:nth-child(7)');
          }
        } else if (await cdp.eval(`!!document.querySelector('.claim')`)) {
          const idx = await cdp.eval(
            `[...document.querySelectorAll('.claim-text')].findIndex(e => /七天|整瓶|随便喝|拉满/.test(e.textContent)) + 1`,
          );
          if (idx > 0) await clickSel(cdp, `.claim:nth-child(${idx})`);
        }
        await clickSel(cdp, '.board-foot .btn-primary');
        steps += 1;
        stuck = 0;
        continue;
      }
      if (await cdp.eval(`!!document.querySelector('.choice')`)) {
        const count = await cdp.eval(`document.querySelectorAll('.choice').length`);
        await clickSel(cdp, `.choice:nth-child(${1 + (steps % count)})`);
        steps += 1;
        stuck = 0;
        continue;
      }
      const advanced = await clickSel(cdp, '.phone, .dialog');
      steps += 1;
      if (!advanced) {
        stuck += 1;
        if (stuck > 12) break;
        await sleep(200);
      } else {
        stuck = 0;
      }
    }

    report.push(['推进步数', String(steps)]);
    report.push(['结局', ending ?? '未到达（可能卡住）']);
    if (!ending) failures += 1;

    // 4. 存档
    const save = await cdp.eval(`localStorage.getItem('meal_save_v1') ? 'ok' : 'empty'`);
    report.push(['存档', save === 'ok' ? '已写入' : '没有存档']);
    if (save !== 'ok') failures += 1;

    // 5. 键盘推进
    await cdp.send('Page.navigate', { url: baseUrl });
    await sleep(700);
    await clickSel(cdp, '.title-screen .btn-primary');
    await sleep(400);
    await clickSel(cdp, '.chapter-card');
    await sleep(500);
    await cdp.eval(`document.body.focus(); document.body.setAttribute('tabindex', '-1'); true`);
    const before = await cdp.eval(`document.body.innerText`);
    await cdp.send('Page.bringToFront');
    await cdp.send('Input.dispatchKeyEvent', {
      type: 'rawKeyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32,
    });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
    await sleep(400);
    const after = await cdp.eval(`document.body.innerText`);
    if (before === after) {
      await cdp.eval("document.querySelector('.dialog, .phone')?.click()");
      await sleep(350);
      const afterClick = await cdp.eval(`document.body.innerText`);
      report.push(['空格推进', afterClick !== before ? '键位没生效，点击有效' : '点击也无效']);
    } else {
      report.push(['空格推进', '有效']);
    }
    if (before === after) failures += 1;

    // 6. 截图
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(shotDir, 'playthrough-end.png'), Buffer.from(shot.data, 'base64'));

    if (cdp.errors.length) {
      failures += 1;
      report.push(['控制台报错', cdp.errors.slice(0, 3).join(' | ')]);
    } else {
      report.push(['控制台报错', '无']);
    report.push(['键盘现场文字', (await cdp.eval('document.body.innerText')).replace(/\s+/g, ' ').slice(0, 80)]);
    }
  } catch (error) {
    failures += 1;
    report.push(['异常', error.message]);
  } finally {
    if (cdp) {
      try { await cdp.send('Browser.close'); } catch { /* 忽略 */ }
    }
    chrome.kill();
    await sleep(300);
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* 忽略 */ }
  }

  console.log('=== 全流程试玩 ===');
  for (const [k, v] of report) console.log(`  ${k}: ${v}`);
  console.log(failures === 0 ? '\n试玩通过' : `\n问题 ${failures} 项`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
