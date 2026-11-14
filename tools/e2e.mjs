/**
 * 零依赖 UI 自动化测试：用 Chrome DevTools Protocol 点真实像素，不靠 jsdom。
 *
 * 剧本内容调整后，主线对白很长，所以测试改成「按节点直达 + 逐关验收」：
 * 每类关卡、每个结局、窄屏布局都单独跑一遍，另加一段从标题页真的走进去的冒烟。
 *
 * 用法：
 *   node tools/e2e.mjs http://127.0.0.1:4174 [--shots tools/out/e2e]
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const PORT = 9300 + Math.floor(Math.random() * 500);
const args = process.argv.slice(2);
const baseUrl = (args.find((a) => a.startsWith('http')) ?? 'http://127.0.0.1:4174').replace(/\/$/, '');
const shotsArg = args.indexOf('--shots');
const shotDir = resolve(shotsArg >= 0 ? args[shotsArg + 1] : 'tools/out/e2e');

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
];

function findBrowser() {
  const found = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!found) throw new Error('没找到 Chrome/Edge');
  return found;
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.consoleErrors = [];
    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve: ok, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(`${msg.error.message} (${msg.error.code})`));
        else ok(msg.result);
        return;
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        const d = msg.params.exceptionDetails;
        this.consoleErrors.push(d.exception?.description ?? d.text);
      }
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        this.consoleErrors.push(msg.params.args.map((a) => a.value ?? a.description).join(' '));
      }
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((ok, reject) => {
      this.pending.set(id, { resolve: ok, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`CDP 超时: ${method}`));
        }
      }, 20000);
    });
  }

  async eval(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
      timeout: 15000,
    });
    if (result.exceptionDetails) throw new Error(`页面脚本报错: ${result.exceptionDetails.text}`);
    return result.result?.value;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(cdp, expression, label, timeout = 9000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await cdp.eval(expression)) return;
    await sleep(120);
  }
  throw new Error(`等不到「${label}」：${expression}`);
}

async function shoot(cdp, name) {
  await sleep(400);
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(shotDir, `${name}.png`), Buffer.from(data, 'base64'));
}

async function click(cdp, selector, label) {
  const info = await cdp.eval(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return null;
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const top = document.elementFromPoint(x, y);
    return { x, y, hit: !!top && (el === top || el.contains(top)) };
  })()`);
  if (!info) throw new Error(`点不到「${label}」：${selector}`);
  if (!info.hit) throw new Error(`「${label}」被别的元素盖住了`);
  for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
    await cdp.send('Input.dispatchMouseEvent', {
      type, x: Math.round(info.x), y: Math.round(info.y),
      button: 'left', buttons: type === 'mousePressed' ? 1 : 0, clickCount: 1,
    });
    await sleep(25);
  }
  await sleep(160);
}

async function text(cdp, selector) {
  return cdp.eval(
    `(() => { const el = document.querySelector(${JSON.stringify(selector)}); return el ? el.innerText.trim() : ''; })()`,
  );
}

async function goto(cdp, node) {
  await cdp.send('Page.navigate', { url: `${baseUrl}/?node=${node}` });
  await sleep(600);
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  mkdirSync(shotDir, { recursive: true });
  const profile = mkdtempSync(join(tmpdir(), 'meal-e2e-'));
  const chrome = spawn(
    findBrowser(),
    [
      '--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio',
      '--no-first-run', '--no-default-browser-check',
      `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
      '--window-size=1400,900', 'about:blank',
    ],
    { stdio: 'ignore' },
  );

  let cdp;
  let failures = 0;
  try {
    let target = null;
    for (let i = 0; i < 60 && !target; i += 1) {
      await sleep(250);
      try {
        const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json());
        target = list.find((t) => t.type === 'page');
      } catch { /* 还没起来 */ }
    }
    if (!target) throw new Error('Chrome 没起来');

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((ok, bad) => {
      ws.addEventListener('open', ok, { once: true });
      ws.addEventListener('error', () => bad(new Error('CDP 连接失败')), { once: true });
    });
    cdp = new Cdp(ws);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1400, height: 900, deviceScaleFactor: 1, mobile: false,
    });

    const steps = [];

    steps.push(['标题页', async () => {
      await cdp.send('Page.navigate', { url: baseUrl });
      await sleep(700);
      await waitFor(cdp, `!!document.querySelector('.title-screen')`, '标题页');
      assert((await text(cdp, '.title-name')).includes('今天吃什么'), '标题不对');
      await shoot(cdp, '01-title');
    }]);

    steps.push(['从标题页进入第一章', async () => {
      await click(cdp, '.title-screen .btn-primary', '开始调查');
      await waitFor(cdp, `!!document.querySelector('.chapter-card')`, '章节卡');
      assert((await text(cdp, '.chapter-title')).includes('第一章'), '第一章章节卡不对');
      await shoot(cdp, '02-chapter1');
      await click(cdp, '.chapter-card', '跳过章节卡');
      await waitFor(cdp, `!!document.querySelector('.dialog .text')`, '第一章对白');
      await shoot(cdp, '03-first-line');
    }]);

    steps.push(['第一章：图上圈选', async () => {
      await goto(cdp, 'a1-it');
      await waitFor(cdp, `!!document.querySelector('.poster-line.spot')`, '圈选');
      const spots = await cdp.eval(`document.querySelectorAll('.poster-line.spot').length`);
      assert(spots >= 3, `圈选区域太少：${spots}`);
      await shoot(cdp, '04-poster');
      await click(cdp, '.poster-copy .spot:nth-child(2)', '价格那句');
      await click(cdp, '.board-foot .btn-primary', '确定');
      await sleep(250);
      assert((await text(cdp, '.hint-line')).length > 0, '圈错没有提示');
      await click(cdp, '.poster-copy .spot:nth-child(2)', '取消价格');
      await click(cdp, '.poster-copy .spot:nth-child(3)', '免疫力拉满');
      await click(cdp, '.board-foot .btn-primary', '确定');
      await waitFor(cdp, `!!document.querySelector('.dialog .text')`, '过关对白');
    }]);

    steps.push(['第二章：配餐关', async () => {
      await goto(cdp, 'a2-it');
      await waitFor(cdp, `!!document.querySelector('.food')`, '餐盘');
      const foods = await cdp.eval(`document.querySelectorAll('.food').length`);
      assert(foods >= 6, `食物卡太少：${foods}`);
      await shoot(cdp, '05-plate');
      await click(cdp, '.food:nth-child(3)', '肉菜');
      await click(cdp, '.food:nth-child(8)', '汤面');
      await click(cdp, '.food:nth-child(7)', '番茄炒蛋');
      await click(cdp, '.board-foot .btn-primary', '提交');
      await sleep(250);
      assert((await text(cdp, '.hint-line')).includes('超'), '超预算没提示');
      await click(cdp, '.btn-ghost', '清空');
      await click(cdp, '.food:nth-child(1)', '米饭');
      await click(cdp, '.food:nth-child(4)', '时蔬');
      await click(cdp, '.food:nth-child(5)', '豆腐');
      await click(cdp, '.food:nth-child(7)', '番茄炒蛋');
      await click(cdp, '.board-foot .btn-primary', '提交');
      await waitFor(cdp, `!!document.querySelector('.dialog .text')`, '过关对白');
    }]);

    steps.push(['第三章：同类对比', async () => {
      await goto(cdp, 'a3-it');
      await waitFor(cdp, `!!document.querySelector('.offer')`, '对比关');
      await click(cdp, '.offer:nth-child(1) .btn', '翻面');
      await click(cdp, '.offer:nth-child(2) .btn', '翻面');
      await shoot(cdp, '06-compare');
      const back = await text(cdp, '.offer-back');
      assert(back.includes('100'), `背面没有单位信息：${back.slice(0, 40)}`);
      await click(cdp, '.offer:nth-child(1)', '选柠檬茶');
      await click(cdp, '.board-foot .btn-primary', '选它');
      await waitFor(cdp, `!!document.querySelector('.dialog .text')`, '过关对白');
    }]);

    steps.push(['第四章：早餐关与结局', async () => {
      await goto(cdp, 'a4-it');
      await waitFor(cdp, `!!document.querySelector('.food')`, '早餐盘');
      await click(cdp, '.food:nth-child(1)', '米饭');
      await click(cdp, '.food:nth-child(3)', '鸡蛋');
      await click(cdp, '.food:nth-child(4)', '牛奶');
      await click(cdp, '.board-foot .btn-primary', '提交');
      await waitFor(cdp, `!!document.querySelector('.dialog .text')`, '过关对白');
    }]);

    steps.push(['三个结局都能跑', async () => {
      for (const [node, keyword, name] of [
        ['e_hidden', '先问清楚', '07-ending-hidden'],
        ['e_advanced', '换一家食堂', '08-ending-advanced'],
        ['e_normal', '我会选了', '09-ending-normal'],
      ]) {
        await goto(cdp, node);
        await waitFor(cdp, `!!document.querySelector('.ending-title')`, '结局卡');
        assert((await text(cdp, '.ending-title')).includes(keyword), `${node} 标题不对`);
        await shoot(cdp, name);
      }
    }]);

    steps.push(['窄屏不溢出', async () => {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: 1024, height: 720, deviceScaleFactor: 1, mobile: false,
      });
      await goto(cdp, 'a2-it');
      await waitFor(cdp, `!!document.querySelector('.food')`, '窄屏餐盘');
      const overflow = await cdp.eval(
        `(() => { const s = document.querySelector('.stage').getBoundingClientRect();
          return s.left < -1 || s.top < -1 || s.right > innerWidth + 1 || s.bottom > innerHeight + 1; })()`,
      );
      assert(!overflow, '1024×720 下舞台超出视口');
      await shoot(cdp, '10-small-viewport');
    }]);

    for (const [label, step] of steps) {
      try {
        await step();
        console.log(`  ✓ ${label}`);
      } catch (error) {
        failures += 1;
        console.log(`  ✗ ${label}: ${error.message}`);
        try {
          await shoot(cdp, `fail-${label}`);
          console.log(`    当前文字：${(await cdp.eval('document.body.innerText')).replace(/\s+/g, ' ').slice(0, 260)}`);
        } catch { /* 页面可能崩了 */ }
        break;
      }
    }

    if (cdp.consoleErrors.length > 0) {
      failures += 1;
      console.log('  ✗ 控制台有报错：');
      cdp.consoleErrors.slice(0, 5).forEach((e) => console.log(`    ${String(e).split('\n')[0]}`));
    }
  } catch (error) {
    failures += 1;
    console.log(`  ✗ 启动失败：${error.message}`);
  } finally {
    if (cdp) {
      try { await cdp.send('Browser.close'); } catch { /* 忽略 */ }
    }
    chrome.kill();
    await sleep(400);
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* Windows 偶尔锁文件 */ }
  }

  console.log(failures === 0 ? '\n全部通过' : `\n失败 ${failures} 项`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
