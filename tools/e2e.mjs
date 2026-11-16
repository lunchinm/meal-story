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

    steps.push(['聊天记录分段', async () => {
      // a1-50 是一段群聊的第一句，前面刚是当面场景
      await goto(cdp, 'a1-50');
      await waitFor(cdp, `!!document.querySelector('.phone')`, '群聊');
      const first = await cdp.eval(`document.querySelectorAll('.phone .msg').length`);
      assert(first <= 2, `新一段群聊不该带着旧消息，现在有 ${first} 条`);
      await click(cdp, '.phone', '推进一条');
      const next = await cdp.eval(`document.querySelectorAll('.phone .msg').length`);
      assert(next === first + 1, `同一段内应当累加：${first} → ${next}`);
      await shoot(cdp, '01c-chat-thread');
    }]);

    steps.push(['预览面板能跳关', async () => {
      await cdp.send('Page.navigate', { url: baseUrl });
      await sleep(700);
      await waitFor(cdp, `!!document.querySelector('.preview-entry')`, '预览按钮');
      await click(cdp, '.preview-entry', '打开预览');
      await waitFor(cdp, `!!document.querySelector('.preview-panel:not([hidden])')`, '预览面板');
      const items = await cdp.eval(`document.querySelectorAll('.preview-item').length`);
      assert(items >= 8, `预览条目太少：${items}`);
      await shoot(cdp, '01b-preview-panel');
      await click(cdp, '.preview-item', '跳到第一项');
      await waitFor(cdp, `!!document.querySelector('.chapter-card, .phone, .dialog')`, '跳转生效');
      const gone = await cdp.eval(`!document.querySelector('.preview-entry')`);
      assert(gone, '跳转后预览按钮还留着');
      await cdp.send('Page.navigate', { url: baseUrl });
      await sleep(800);
    }]);

    steps.push(['从标题页进入第一章', async () => {
      await click(cdp, '.title-screen .btn-primary', '开始调查');
      await waitFor(cdp, `!!document.querySelector('.chapter-card')`, '章节卡');
      assert((await text(cdp, '.chapter-title')).includes('第一章'), '第一章章节卡不对');
      await shoot(cdp, '02-chapter1');
      await click(cdp, '.chapter-card', '跳过章节卡');
      await waitFor(cdp, `!!document.querySelector('.dialog .text, .msg-text')`, '第一章对白');
      await shoot(cdp, '03-first-line');
    }]);

    steps.push(['群聊面板固定且自动落底', async () => {
      await goto(cdp, 'a1-00');
      await waitFor(cdp, `!!document.querySelector('.chapter-card')`, '章节卡');
      await click(cdp, '.chapter-card', '进第一章');
      await waitFor(cdp, `!!document.querySelector('.phone')`, '群聊面板');
      const h1 = await cdp.eval(`Math.round(document.querySelector('.phone').getBoundingClientRect().height)`);
      for (let i = 0; i < 8; i += 1) await click(cdp, '.phone', `第 ${i + 1} 条`);
      const h2 = await cdp.eval(`Math.round(document.querySelector('.phone').getBoundingClientRect().height)`);
      assert(h1 === h2, `面板高度变了：${h1} → ${h2}`);
      const gap = await cdp.eval(`(() => { const b = document.querySelector('.phone-body');
        return Math.round(b.scrollHeight - b.scrollTop - b.clientHeight); })()`);
      assert(gap <= 40, `没有落到最底：还差 ${gap}px`);
      await shoot(cdp, '13-chat-panel');
    }]);

    steps.push(['群聊里选项变成底部快捷回复', async () => {
      for (let i = 0; i < 14 && !(await cdp.eval(`!!document.querySelector('.quick')`)); i += 1) {
        await click(cdp, '.phone', '推进');
      }
      await waitFor(cdp, `!!document.querySelector('.quick')`, '快捷回复');
      const bar = await cdp.eval(`(() => { const p = document.querySelector('.phone');
        const q = document.querySelector('.phone-choices');
        return { inPhone: p.contains(q), count: q.querySelectorAll('.quick').length }; })()`);
      assert(bar.inPhone, '快捷回复不在聊天面板里');
      assert(bar.count >= 1, '没有选项');
      await shoot(cdp, '14-chat-choices');
      await click(cdp, '.quick', '第一个快捷回复');
      await sleep(400);
      const mine = await cdp.eval(`document.querySelectorAll('.msg.me').length`);
      assert(mine >= 1, '点完没有出现玩家气泡');
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
      await waitFor(cdp, `!!document.querySelector('.dialog .text, .msg-text')`, '过关对白');
    }]);

    steps.push(['第二章：配餐关', async () => {
      await goto(cdp, 'a2-plate');
      await waitFor(cdp, `!!document.querySelector('.food')`, '餐盘');
      const foods = await cdp.eval(`document.querySelectorAll('.food').length`);
      assert(foods >= 6, `食物卡太少：${foods}`);
      await shoot(cdp, '05-plate');
      // 先选到超预算：肉菜 6 + 汤面 5 + 番茄炒蛋 6 = 17 元
      await click(cdp, '.food:nth-child(6)', '肉菜');
      await click(cdp, '.food:nth-child(2)', '汤面');
      await click(cdp, '.food:nth-child(5)', '番茄炒蛋');
      await click(cdp, '.board-foot .btn-primary', '提交');
      await sleep(250);
      const hint = await text(cdp, '.hint-line');
      assert(hint.includes('超'), `超预算没提示：${hint}`);
      await click(cdp, '.btn-ghost', '清空');
      // 12 元以内：米饭 2 + 时蔬 3 + 土豆丝 3 + 豆腐 4
      await click(cdp, '.food:nth-child(1)', '米饭');
      await click(cdp, '.food:nth-child(4)', '清炒时蔬');
      await click(cdp, '.food:nth-child(3)', '土豆丝');
      await click(cdp, '.food:nth-child(7)', '家常豆腐');
      await click(cdp, '.board-foot .btn-primary', '提交');
      await waitFor(cdp, `!!document.querySelector('.dialog .text, .msg-text')`, '过关对白');
    }]);

    steps.push(['第三章：同类对比（可转瓶身）', async () => {
      await goto(cdp, 'a3-it');
      await waitFor(cdp, `!!document.querySelector('.bottle-canvas')`, '瓶子');
      const count = await cdp.eval(`document.querySelectorAll('.bottle-canvas').length`);
      assert(count === 2, `瓶子数量不对：${count}`);
      const box = await cdp.eval(`(() => {
        const c = document.querySelector('.bottle-canvas').getBoundingClientRect();
        return { x: c.left + c.width / 2, y: c.top + c.height / 2 };
      })()`);
      await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: Math.round(box.x), y: Math.round(box.y), button: 'left', clickCount: 1 });
      for (let i = 1; i <= 6; i += 1) {
        await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(box.x + i * 22), y: Math.round(box.y), button: 'left' });
        await sleep(30);
      }
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: Math.round(box.x + 132), y: Math.round(box.y), button: 'left' });
      await sleep(250);
      await shoot(cdp, '06-compare');
      await click(cdp, '.offer:nth-child(1) .btn', '转到背面');
      await sleep(250);
      await click(cdp, '.offer:nth-child(1)', '选柠檬茶');
      await click(cdp, '.board-foot .btn-primary', '选它');
      await waitFor(cdp, `!!document.querySelector('.dialog .text, .msg-text')`, '过关对白');
    }]);

    steps.push(['第四章：早餐关与结局', async () => {
      await goto(cdp, 'a4-it');
      await waitFor(cdp, `!!document.querySelector('.food')`, '早餐盘');
      await click(cdp, '.food:nth-child(1)', '米饭');
      await click(cdp, '.food:nth-child(3)', '鸡蛋');
      await click(cdp, '.food:nth-child(4)', '牛奶');
      await click(cdp, '.board-foot .btn-primary', '提交');
      await waitFor(cdp, `!!document.querySelector('.dialog .text, .msg-text')`, '过关对白');
    }]);

    steps.push(['第一章：物件点击探索', async () => {
      await goto(cdp, 'a1-explore');
      await waitFor(cdp, `!!document.querySelector('.explore-card')`, '探索界面');
      const cards = await cdp.eval(`document.querySelectorAll('.explore-card').length`);
      assert(cards === 3, `物件数量不对：${cards}`);
      await click(cdp, '.explore-card:nth-child(1)', '宣传图');
      await waitFor(cdp, `!!document.querySelector('.explore-line')`, '首次对白');
      await shoot(cdp, '16-explore');
      await click(cdp, '.explore-card:nth-child(3)', '便签');
      await sleep(200);
      const enabled = await cdp.eval(`!document.querySelector('.board-foot .btn-primary').disabled`);
      assert(enabled, '看完两个后“和大家聊聊”应当可用');
      // 重复点击只给摘要
      await click(cdp, '.explore-card:nth-child(1)', '再看一次宣传图');
      await sleep(200);
      const summary = await text(cdp, '.explore-summary');
      assert(summary.length > 0, '重复点击没有给摘要');
      await click(cdp, '.board-foot .btn-primary', '和大家聊聊');
      await waitFor(cdp, `!!document.querySelector('.dialog .text, .msg-text, .record-chip')`, '回到主线');
    }]);

    steps.push(['第一章：章末调查簿', async () => {
      await goto(cdp, 'a1-notebook');
      await waitFor(cdp, `!!document.querySelector('.nb-item')`, '调查簿');
      const items = await cdp.eval(`document.querySelectorAll('.nb-item').length`);
      assert(items >= 1, '调查簿没有条目');
      await click(cdp, '.nb-item', '翻开第一条');
      const detail = await text(cdp, '.nb-detail');
      assert(detail.includes('来源') || detail.length > 10, '条目展开后没有解释');
      await shoot(cdp, '17-notebook');
      await click(cdp, '.board-foot .btn-primary', '继续');
    }]);

    steps.push(['第三章：随机事件与偶遇记录', async () => {
      await goto(cdp, 'a3-ask');
      await waitFor(cdp, `!!document.querySelector('.choice')`, '采购前选择');
      await click(cdp, '.choice:nth-child(1)', '先问需求');
      let hit = false;
      for (let i = 0; i < 14; i += 1) {
        const body = await cdp.eval(`document.body.innerText`);
        if (/第二件半价|分三份|只拍到一半/.test(body)) { hit = true; break; }
        await click(cdp, '.dialog, .phone', '推进');
        await sleep(220);
      }
      assert(hit, '随机事件没触发');
      await shoot(cdp, '18-random-event');
    }]);

    steps.push(['第四章：试行链走到隐藏结局', async () => {
      await goto(cdp, 'a4-publish');
      await waitFor(cdp, `!!document.querySelector('.choice')`, '发布方式');
      await click(cdp, '.choice:nth-child(2)', '先试行');
      for (let i = 0; i < 6 && !(await cdp.eval(`!!document.querySelector('.choice')`)); i += 1) {
        await click(cdp, '.dialog', '推进到选择');
      }
      await waitFor(cdp, `!!document.querySelector('.choice')`, '选试行对象');
      await click(cdp, '.choice:nth-child(1)', '米粒');
      for (let i = 0; i < 8 && !(await cdp.eval(`!!document.querySelector('.choice')`)); i += 1) {
        await click(cdp, '.dialog', '推进到修订选择');
      }
      await waitFor(cdp, `!!document.querySelector('.choice')`, '是否按反馈修订');
      await click(cdp, '.choice:nth-child(1)', '改');
      for (let i = 0; i < 12; i += 1) {
        if (await cdp.eval(`!!document.querySelector('.ending-title')`)) break;
        await click(cdp, '.dialog, .phone', '推进到结局');
        await sleep(220);
      }
      await waitFor(cdp, `!!document.querySelector('.ending-title')`, '结局');
      const title = await text(cdp, '.ending-title');
      assert(title.includes('先问清楚'), `试行+修订应到隐藏结局，实际：${title}`);
      await shoot(cdp, '19-ending-hidden');
    }]);

    steps.push(['第四章：先发布通用版到普通结局', async () => {
      await goto(cdp, 'a4-publish');
      await waitFor(cdp, `!!document.querySelector('.choice')`, '发布方式');
      const labels = await cdp.eval(`[...document.querySelectorAll('.choice')].map((e) => e.innerText.trim()).join(' | ')`);
      assert(labels.includes('通用版'), `选项文案不对：${labels}`);
      await click(cdp, '.choice:nth-child(1)', '先发布通用版');
      for (let i = 0; i < 10; i += 1) {
        if (await cdp.eval(`!!document.querySelector('.ending-title')`)) break;
        await click(cdp, '.dialog, .phone', '推进到结局');
        await sleep(200);
      }
      await waitFor(cdp, `!!document.querySelector('.ending-title')`, '结局');
      const title = await text(cdp, '.ending-title');
      assert(title.includes('我会选了'), `先发布通用版应到普通结局，实际：${title}`);
      await shoot(cdp, '20-ending-normal');
    }]);

    steps.push(['结局页：片尾四张卡与相册', async () => {
      await goto(cdp, 'e_hidden');
      await waitFor(cdp, `!!document.querySelector('.ending-title')`, '结局页');
      const cards = await cdp.eval(`document.querySelectorAll('.ending-card-item').length`);
      assert(cards === 4, `片尾卡数量不对：${cards}`);
      const unlocks = await cdp.eval(`document.querySelectorAll('.ending-unlock').length`);
      assert(unlocks >= 3, `解锁项太少：${unlocks}`);
      const slots = await cdp.eval(`document.querySelectorAll('.ending-slot').length`);
      assert(slots === 3, `结局相册槽位不对：${slots}`);
      const gotCount = await cdp.eval(`document.querySelectorAll('.ending-slot.got').length`);
      assert(gotCount >= 1, '当前结局没进相册');
      await click(cdp, '.ending-card-item', '打开第一张');
      await waitFor(cdp, `!!document.querySelector('.card-panel')`, '知识卡');
      const title = await text(cdp, '.card-title');
      assert(title.length > 0, '知识卡没有标题');
      await click(cdp, '.card-panel .btn-ghost', '收起');
      await shoot(cdp, '21-ending-album');
    }]);

    steps.push(['标题页可以填调查员名字', async () => {
      await cdp.send('Page.navigate', { url: `${baseUrl}?fresh=1` });
      await waitFor(cdp, `!!document.querySelector('.title-name-input')`, '名字输入框');
      await cdp.eval(`(() => { const el = document.querySelector('.title-name-input');
        el.value = '林小满'; el.dispatchEvent(new Event('input', { bubbles: true })); })()`);
      await click(cdp, '.title-screen .btn-primary', '开始调查');
      await waitFor(cdp, `!!document.querySelector('.dialog .text, .msg-text')`, '进入正文');
      const saved = await cdp.eval(`localStorage.getItem('meal_player_name')`);
      assert(saved === '林小满', `名字没存下来：${saved}`);
    }]);

    steps.push(['分支对白连播', async () => {
      await goto(cdp, 'a4-44');
      await waitFor(cdp, `!!document.querySelector('.choice')`, '选项');
      await click(cdp, '.choice:nth-child(1)', '第一个选项');
      const seen = new Set();
      for (let i = 0; i < 6; i += 1) {
        const line = await text(cdp, '.dialog .text');
        if (line) seen.add(line);
        await click(cdp, '.dialog', '继续');
        await sleep(150);
      }
      assert(seen.size >= 3, `分支对白只看到 ${seen.size} 句，可能被截断`);
      await shoot(cdp, '13-branch-reply');
    }]);

    steps.push(['道具面板能开能收', async () => {
      await goto(cdp, 'a3-06');
      await waitFor(cdp, `!!document.querySelector('.card-chip')`, '道具按钮');
      await click(cdp, '.dialog .card-chip', '翻到背面');
      await waitFor(cdp, `!!document.querySelector('.prop-panel')`, '道具面板');
      const title = await text(cdp, '.prop-title');
      assert(title.length > 0, '道具面板没有标题');
      await shoot(cdp, '11-prop-panel');
      await click(cdp, '.prop-head .btn', '收起');
      await waitFor(cdp, `!document.querySelector('.prop-panel')`, '面板收起');
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

    steps.push(['手机竖屏不溢出', async () => {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: 390, height: 844, deviceScaleFactor: 2, mobile: true,
      });
      await goto(cdp, 'a2-plate');
      await waitFor(cdp, `!!document.querySelector('.food')`, '手机餐盘');
      const overflow = await cdp.eval(
        `(() => { const s = document.querySelector('.stage').getBoundingClientRect();
          return { over: s.right > innerWidth + 1 || s.left < -1, w: Math.round(s.width), vw: innerWidth }; })()`,
      );
      assert(!overflow.over, `手机竖屏溢出：${JSON.stringify(overflow)}`);
      await shoot(cdp, '12-mobile');
    }]);

    steps.push(['窄屏不溢出', async () => {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: 1024, height: 720, deviceScaleFactor: 1, mobile: false,
      });
      await goto(cdp, 'a2-plate');
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
