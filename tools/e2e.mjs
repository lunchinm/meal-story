/**
 * 零依赖 UI 自动化测试：用 Chrome DevTools Protocol 点真实像素，不靠 jsdom。
 *
 * 用法：
 *   node tools/e2e.mjs http://127.0.0.1:4174 [--shots tools/out/e2e]
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const PORT = 9333;
const args = process.argv.slice(2);
const baseUrl = args.find((a) => a.startsWith('http')) ?? 'http://127.0.0.1:4174';
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

async function waitFor(cdp, expression, label, timeout = 8000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const value = await cdp.eval(expression);
    if (value) return value;
    await sleep(120);
  }
  throw new Error(`等不到「${label}」：${expression}`);
}

async function shoot(cdp, name) {
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
  const path = join(shotDir, `${name}.png`);
  writeFileSync(path, Buffer.from(data, 'base64'));
  return path;
}

/** 用真实鼠标事件点元素中心，顺便检查它没有被别的元素盖住 */
async function click(cdp, selector, label) {
  const info = await cdp.eval(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return null;
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const top = document.elementFromPoint(x, y);
    return { x, y, hit: !!top && (el === top || el.contains(top)) };
  })()`);
  if (!info) throw new Error(`点不到「${label}」：找不到 ${selector}`);
  if (!info.hit) {
    const covered = await cdp.eval(
      `(() => { const el = document.querySelector(${JSON.stringify(selector)}); const r = el.getBoundingClientRect();
        const top = document.elementFromPoint(r.left + r.width/2, r.top + r.height/2);
        return top ? top.className + '|' + top.tagName : 'null'; })()`,
    );
    throw new Error(`「${label}」被遮住了，上层是 ${covered}`);
  }
  for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
    await cdp.send('Input.dispatchMouseEvent', {
      type,
      x: Math.round(info.x),
      y: Math.round(info.y),
      button: 'left',
      buttons: type === 'mousePressed' ? 1 : 0,
      clickCount: 1,
    });
    await sleep(30);
  }
  await sleep(220);
}

async function text(cdp, selector) {
  return cdp.eval(
    `(() => { const el = document.querySelector(${JSON.stringify(selector)}); return el ? el.innerText.trim() : ''; })()`,
  );
}

async function advance(cdp, times = 1) {
  for (let i = 0; i < times; i += 1) await click(cdp, '.dialog', '对话框');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  mkdirSync(shotDir, { recursive: true });
  const profile = mkdtempSync(join(tmpdir(), 'meal-e2e-'));
  const chrome = spawn(
    findBrowser(),
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--mute-audio',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profile}`,
      '--window-size=1400,900',
      'about:blank',
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
      } catch {
        /* 还没起来 */
      }
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
      width: 1400,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    const steps = [];

    steps.push(['标题页', async () => {
      await cdp.send('Page.navigate', { url: baseUrl });
      await sleep(700);
      await waitFor(cdp, `!!document.querySelector('.title-screen')`, '标题页');
      const title = await text(cdp, '.title-name');
      assert(title.includes('今天吃什么'), `标题不对：${title}`);
      await shoot(cdp, '01-title');
    }]);

    steps.push(['第一幕对话与立绘', async () => {
      await click(cdp, '.title-screen .btn-primary', '开始调查');
      await waitFor(cdp, `!!document.querySelector('.dialog .text')`, '第一句对白');
      const first = await text(cdp, '.dialog .text');
      assert(first.includes('群'), `第一句不像开场：${first}`);
      await advance(cdp, 1);
      await waitFor(cdp, `!!document.querySelector('.actor')`, '米粒立绘');
      await shoot(cdp, '02-act1-actor');
    }]);

    steps.push(['推进到证据关', async () => {
      await advance(cdp, 3);
      await waitFor(cdp, `!!document.querySelector('.claim')`, '证据面板');
      const count = await cdp.eval(`document.querySelectorAll('.claim').length`);
      assert(count === 3, `证据卡数量不对：${count}`);
      await shoot(cdp, '03-evidence-idle');
    }]);

    steps.push(['证据关：先选错再改对', async () => {
      await click(cdp, '.claim:nth-child(1)', '说法一');
      await click(cdp, '.claim:nth-child(3)', '说法三');
      await click(cdp, '.board-foot .btn-primary', '确定');
      await sleep(300);
      const hint = await text(cdp, '.hint-line');
      assert(hint.length > 0, '选错了却没有提示');
      await shoot(cdp, '04-evidence-wrong');
      await click(cdp, '.claim:nth-child(3)', '说法三');
      await click(cdp, '.claim:nth-child(2)', '说法二');
      await click(cdp, '.board-foot .btn-primary', '确定');
      await waitFor(cdp, `document.querySelector('.dialog .text')?.textContent.includes('拉满')`, '证据过关后的对白');
      await shoot(cdp, '05-evidence-passed');
    }]);

    steps.push(['知识卡可以展开', async () => {
      await waitFor(cdp, `!!document.querySelector('.card-chip')`, '看依据按钮');
      await click(cdp, '.card-chip', '看依据');
      await waitFor(cdp, `!!document.querySelector('.card-panel')`, '知识卡面板');
      const body = await text(cdp, '.card-body');
      assert(body.length > 10, `知识卡没内容：${body}`);
      await shoot(cdp, '06-knowledge-card');
      await click(cdp, '.card-panel .btn', '收起');
      await waitFor(cdp, `!document.querySelector('.card-panel')`, '知识卡收起');
    }]);

    steps.push(['选项分支进入第二幕', async () => {
      await advance(cdp, 1);
      await waitFor(cdp, `!!document.querySelector('.choice')`, '选项');
      await shoot(cdp, '07-choice');
      await click(cdp, '.choice:nth-child(1)', '第一个选项');
      await waitFor(cdp, `document.querySelector('.dialog .text')?.textContent.includes('预算')`, '第二幕开场');
    }]);

    steps.push(['餐盘关：超预算提示', async () => {
      await advance(cdp, 1);
      await waitFor(cdp, `!!document.querySelector('.food')`, '餐盘面板');
      const foods = await cdp.eval(`document.querySelectorAll('.food').length`);
      assert(foods >= 8, `食物卡太少：${foods}`);
      await shoot(cdp, '08-plate-idle');
      await click(cdp, '.food:nth-child(3)', '肉菜');
      await click(cdp, '.food:nth-child(8)', '汤面');
      await click(cdp, '.food:nth-child(7)', '番茄炒蛋');
      await click(cdp, '.board-foot .btn-primary', '提交');
      await sleep(250);
      const hint = await text(cdp, '.hint-line');
      assert(hint.includes('超'), `超预算没提示：${hint}`);
      await shoot(cdp, '09-plate-over-budget');
    }]);

    steps.push(['餐盘关：缺蔬菜后调对', async () => {
      await click(cdp, '.btn-ghost', '清空');
      await click(cdp, '.food:nth-child(1)', '米饭');
      await click(cdp, '.food:nth-child(3)', '肉菜');
      await click(cdp, '.food:nth-child(5)', '家常豆腐');
      await click(cdp, '.board-foot .btn-primary', '提交');
      await sleep(250);
      const hint = await text(cdp, '.hint-line');
      assert(hint.includes('蔬菜'), `缺蔬菜没提示：${hint}`);
      await shoot(cdp, '10-plate-missing-veg');
      await click(cdp, '.food:nth-child(3)', '肉菜');
      await click(cdp, '.food:nth-child(4)', '清炒时蔬');
      await click(cdp, '.food:nth-child(7)', '番茄炒蛋');
      await click(cdp, '.board-foot .btn-primary', '提交');
      await waitFor(cdp, `!!document.querySelector('.dialog .text')`, '过关后回到对话');
      await shoot(cdp, '11-plate-passed');
    }]);

    steps.push(['记下预算，进入第三幕', async () => {
      await advance(cdp, 2);
      await waitFor(cdp, `!!document.querySelector('.choice')`, '记住预算的选项');
      await click(cdp, '.choice:nth-child(1)', '记下预算');
      await waitFor(cdp, `document.querySelector('.dialog .text')?.textContent.includes('标签')`, '第三幕开场');
      await shoot(cdp, '12-act3');
    }]);

    steps.push(['第三幕标签题', async () => {
      await advance(cdp, 1);
      await waitFor(cdp, `!!document.querySelector('.claim')`, '标签证据');
      const labels = await cdp.eval(
        `[...document.querySelectorAll('.claim-text')].map(e => e.textContent).join('|')`,
      );
      assert(labels.includes('500'), `第三幕证据不像标签题：${labels}`);
      await shoot(cdp, '13-act3-evidence');
      const index = await cdp.eval(
        `[...document.querySelectorAll('.claim-text')].findIndex(e => e.textContent.includes('整瓶')) + 1`,
      );
      await click(cdp, `.claim:nth-child(${index})`, '整瓶那一条');
      await click(cdp, '.board-foot .btn-primary', '确定');
      await waitFor(cdp, `!!document.querySelector('.dialog .text')`, '标签题过关');
    }]);

    steps.push(['隐藏结局：两个 flag 都记住', async () => {
      await advance(cdp, 2);
      await waitFor(cdp, `!!document.querySelector('.choice')`, '问课表的选项');
      await click(cdp, '.choice:nth-child(1)', '先问课表');
      await waitFor(cdp, `!!document.querySelector('.ending-title')`, '结局卡');
      const ending = await text(cdp, '.ending-title');
      assert(ending.includes('先问清楚'), `隐藏结局没触发，出的是：${ending}`);
      await shoot(cdp, '14-ending-hidden');
    }]);

    steps.push(['结局回到标题', async () => {
      await click(cdp, '.ending-card .btn', '再走一遍');
      await waitFor(cdp, `!!document.querySelector('.title-screen')`, '回到标题');
      await shoot(cdp, '15-back-to-title');
    }]);

    steps.push(['进阶结局能单独跑', async () => {
      await cdp.send('Page.navigate', { url: `${baseUrl}?node=e_advanced` });
      await sleep(700);
      await waitFor(cdp, `!!document.querySelector('.ending-title')`, '进阶结局');
      const ending = await text(cdp, '.ending-title');
      assert(ending.includes('换一家食堂'), `进阶结局标题不对：${ending}`);
      await shoot(cdp, '16-ending-advanced');
    }]);

    steps.push(['小视口不溢出', async () => {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: 1024,
        height: 720,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await cdp.send('Page.navigate', { url: `${baseUrl}?node=a2-02` });
      await sleep(700);
      await waitFor(cdp, `!!document.querySelector('.food')`, '小视口餐盘');
      const overflow = await cdp.eval(
        `(() => { const s = document.querySelector('.stage').getBoundingClientRect();
          return s.left < -1 || s.top < -1 || s.right > innerWidth + 1 || s.bottom > innerHeight + 1; })()`,
      );
      assert(!overflow, '1024×720 下舞台超出视口');
      await shoot(cdp, '17-small-viewport');
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: 1400,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false,
      });
    }]);

    for (const [label, step] of steps) {
      try {
        await step();
        console.log(`  ✓ ${label}`);
      } catch (error) {
        failures += 1;
        console.log(`  ✗ ${label}: ${error.message}`);
        try {
          const screen = await shoot(cdp, `fail-${label}`);
          console.log(`    截图：${screen}`);
          console.log(`    当前文字：${(await cdp.eval('document.body.innerText')).replace(/\s+/g, ' ').slice(0, 300)}`);
        } catch {
          /* 页面可能已经崩了 */
        }
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
      try {
        await cdp.send('Browser.close');
      } catch {
        /* 忽略 */
      }
    }
    chrome.kill();
    await sleep(400);
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {
      /* Windows 偶尔锁文件 */
    }
  }

  console.log(failures === 0 ? '\n全部通过' : `\n失败 ${failures} 项`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
