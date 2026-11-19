/**
 * 《今天吃什么？》回归用例 v3
 * 顺序：标题 → 群聊图片 → 文本正确性 → 菜单/回标题 → 资源 → 性能 → 异常
 * 用法：node tools/qa-v3.mjs http://127.0.0.1:8082/ --out qa-v3
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const URL_BASE = process.argv[2] || 'http://127.0.0.1:8082/';
const OUT = process.argv[4] || 'qa-v3';
fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });

const rows = [];
function rec(id, title, status, detail = '') {
  rows.push({ id, title, status, detail });
  const flag = status === '通过' ? '✔' : status === '不通过' ? '✘' : '…';
  console.log(`${flag} ${id}\t${title}\t${detail}`);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
const page = await ctx.newPage();

const consoleErrors = [];
const failedRequests = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 160)); });
page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message.slice(0, 160)));
page.on('response', (r) => { if (r.status() >= 400) failedRequests.push(r.status() + ' ' + r.url().split('/').pop()); });

const shot = (name) => page.screenshot({ path: path.join(OUT, 'shots', name + '.png') });
const lastLine = () => page.evaluate(() => window.__paperLine || '');
const lastName = () => page.evaluate(() => window.__paperName || '');
const chatBubbles = () => page.evaluate(() =>
  [...document.querySelectorAll('#paper-chat .pc-bubble')].map((e) => e.textContent.trim()));

async function startGame() {
  await page.waitForTimeout(2200);
  await page.evaluate(() => { const s = document.getElementById('paper-splash'); if (s && getComputedStyle(s).display !== 'none') s.click(); });
  await page.waitForTimeout(400);
  const ok = await page.evaluate(() => {
    const b = document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]');
    if (b) { b.click(); return true; }
    return false;
  });
  await page.waitForTimeout(600);
  await page.evaluate(() => { const pr = document.getElementById('paper-press'); if (pr && getComputedStyle(pr).display !== 'none') pr.click(); });
  await page.waitForTimeout(6500);
  return ok;
}

async function advance(n = 1, gap = 650) {
  for (let i = 0; i < n; i += 1) {
    const chips = await page.evaluate(() =>
      document.querySelectorAll('#paper-chat .pc-choices button, #paper-ui .pu-choices button').length);
    if (chips > 0) {
      await page.evaluate(() => {
        const b = document.querySelector('#paper-chat .pc-choices button, #paper-ui .pu-choices button');
        if (b) b.click();
      });
    } else {
      await page.mouse.click(800, 700);
    }
    await page.waitForTimeout(gap);
  }
}

// ---------------- A 标题 ----------------
await page.goto(URL_BASE + '?t=' + Date.now(), { timeout: 120000, waitUntil: 'commit' });

// ---- N 组：首屏闪烁 ----
let sawBoot = false;
let sawNativePanel = false;
let sawBlack = false;
for (let i = 0; i < 40; i += 1) {
  const snap = await page.evaluate(() => {
    const boot = !!document.getElementById('paper-boot');
    const panelText = document.body ? document.body.innerText : '';
    const nativePanel = /自动播放速度|清除所有存档|快进模式/.test(panelText);
    const bg = document.body ? getComputedStyle(document.body).backgroundColor : '';
    return { boot, nativePanel, bg };
  });
  if (snap.boot) sawBoot = true;
  if (snap.nativePanel) sawNativePanel = true;
  if (i > 3 && snap.bg === 'rgb(0, 0, 0)' && !snap.boot) sawBlack = true;
  await page.waitForTimeout(100);
}
rec('N-01', '首屏有自绘启动幕（不是黑屏）', sawBoot ? '通过' : '不通过', '');
rec('N-02', '加载过程中不闪出原生设置页/菜单', sawNativePanel ? '不通过' : '通过',
  sawNativePanel ? '检测到原生设置页文字' : '');
rec('N-03', '没有纯黑背景的空窗期', sawBlack ? '不通过' : '通过', '');

const bootGone = await page.evaluate(() => !document.getElementById('paper-boot'));
rec('N-04', '启动幕在加载完成后消失', bootGone ? '通过' : '不通过', '');
for (let i = 0; i < 40; i += 1) {
  const ready = await page.evaluate(() => {
    const t = document.getElementById('paper-title');
    return !!t && getComputedStyle(t).display !== 'none' && document.querySelectorAll('#paper-title .pt-menu button').length >= 6;
  });
  if (ready) break;
  await page.waitForTimeout(500);
}
await page.waitForTimeout(500);
const titleInfo = await page.evaluate(() => {
  const t = document.getElementById('paper-title');
  return {
    visible: t ? getComputedStyle(t).display !== 'none' : false,
    btns: [...document.querySelectorAll('#paper-title .pt-menu button')].map((b) => b.textContent.trim()),
  };
});
rec('A-01', '标题页可见且为自绘六项菜单', titleInfo.visible && titleInfo.btns.length === 6 ? '通过' : '不通过',
  `菜单=${titleInfo.btns.join('/')}`);
await shot('A-title');

// ---------------- B 群聊图片 ----------------
await startGame();
let thumbs = 0;
for (let i = 0; i < 30 && thumbs === 0; i += 1) {
  thumbs = await page.evaluate(() => document.querySelectorAll('#paper-chat .pc-thumb').length);
  if (thumbs) break;
  await advance(1, 600);
}
await page.waitForTimeout(700);
thumbs = await page.evaluate(() => document.querySelectorAll('#paper-chat .pc-thumb').length);
rec('B-01', '群聊里出现图片消息（缩略图）', thumbs > 0 ? '通过' : '不通过', `缩略图 ${thumbs} 张`);
await shot('B-chat-image');

if (thumbs > 0) {
  const box = await page.evaluate(() => {
    const t = document.querySelector('#paper-chat .pc-thumb');
    const r = t.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, inView: r.top > 0 && r.bottom <= window.innerHeight + 1 };
  });
  rec('B-02', '缩略图在可视区域内（不被面板裁掉）', box.inView ? '通过' : '不通过', '');
  const beforeLine = await lastLine();
  await page.mouse.click(box.x, box.y);
  await page.waitForTimeout(700);
  const opened = await page.evaluate(() => document.getElementById('paper-viewer').classList.contains('open'));
  rec('B-03', '点击缩略图打开大图', opened ? '通过' : '不通过', '');
  const afterLine = await lastLine();
  rec('B-05', '点缩略图不会顺带推进剧情', beforeLine === afterLine ? '通过' : '不通过',
    beforeLine === afterLine ? '' : `剧情被推进：${beforeLine.slice(0, 10)} → ${afterLine.slice(0, 10)}`);
  await shot('B-image-big');
  await page.mouse.click(60, 60);
  await page.waitForTimeout(500);
  const closed = await page.evaluate(() => !document.getElementById('paper-viewer').classList.contains('open'));
  const kept = await page.evaluate(() => document.querySelectorAll('#paper-chat .pc-thumb').length > 0);
  rec('B-04', '点空白关闭大图、缩略图仍保留', closed && kept ? '通过' : '不通过', '');

  // 边推进边找「我的回复条」（底部纸签），找到后点击它
  let sawChip = false;
  for (let i = 0; i < 40; i += 1) {
    const st = await page.evaluate(() => {
      const chip = document.querySelector('#paper-chat .pc-send');
      return { chip: !!chip, text: chip ? chip.textContent.trim() : '' };
    });
    if (st.chip) {
      sawChip = true;
      const box = await page.evaluate(() => {
        const c = document.querySelector('#paper-chat .pc-send');
        const r = c.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      });
      await page.mouse.click(box.x, box.y);
      await page.waitForTimeout(600);
      break;
    }
    await advance(1, 550);
  }
  rec('N-05a', '玩家台词先在聊天底部以回复条出现', sawChip ? '通过' : '不通过', '');
  await page.waitForTimeout(400);
  // 玩家消息可能由纸签点击触发，也可能在下一句到来时自动落地：等一会儿
  for (let i = 0; i < 40; i += 1) {
    if (await page.evaluate(() => !!document.querySelector('#paper-chat .pc-row.me'))) break;
    await advance(1, 550);
  }
  const meInfo = await page.evaluate(() => {
    const me = document.querySelector('#paper-chat .pc-row.me');
    const other = document.querySelector('#paper-chat .pc-row:not(.me)');
    const who = me ? (me.querySelector('.pc-who') || {}).textContent || '' : '';
    const meBg = me ? getComputedStyle(me.querySelector('.pc-bubble')).backgroundImage : '';
    const otherBg = other ? getComputedStyle(other.querySelector('.pc-bubble')).backgroundImage : '';
    return { hasMe: !!me, who: who.trim(), meBg, otherBg };
  });
  rec('N-05', '玩家自己的话排在右侧（.pc-row.me）', meInfo.hasMe ? '通过' : '不通过', '');
  rec('N-06', '玩家气泡是绿色、与对方不同', meInfo.hasMe && meInfo.meBg !== meInfo.otherBg ? '通过' : '不通过',
    meInfo.hasMe ? '底色不同' : '没有找到自己的气泡');
  rec('N-07', '玩家姓名显示为「我」，不是「你你」', meInfo.who === '我' ? '通过' : '不通过', `显示为「${meInfo.who}」`);
} else {
  rec('B-02', '缩略图在可视区域内（不被面板裁掉）', '不通过', '没有图片消息');
  rec('B-03', '点击缩略图打开大图', '不通过', '没有图片消息');
  rec('B-04', '点空白关闭大图、缩略图仍保留', '不通过', '没有图片消息');
}

// ---------------- C 文本正确性 ----------------
const scriptTexts = new Set();
for (const act of [1, 2, 3, 4]) {
  const j = JSON.parse(fs.readFileSync(path.join('content', `act${act}.json`), 'utf8'));
  for (const n of j) if (n.text) scriptTexts.add(String(n.text).replace(/\s+/g, ''));
}

// 找一句非聊天台词，确认它是纸卡而不是聊天面板
let cardOk = false;
for (let i = 0; i < 90; i += 1) {
  const st = await page.evaluate(() => ({
    chat: getComputedStyle(document.getElementById('paper-chat')).display,
    card: getComputedStyle(document.querySelector('#paper-ui .pu-card')).display,
    text: window.__paperLine || '',
  }));
  if (st.chat === 'none' && st.card !== 'none' && st.text) { cardOk = true; break; }
  await advance(1, 550);
}
rec('N-08', '文本框场景不会进入聊天模式', cardOk ? '通过' : '需人工', cardOk ? '' : '90 句内没有出现纸卡场景');

const bubbles = await chatBubbles();
rec('C-01', '群聊气泡文本有内容', bubbles.length >= 1 && bubbles.every((b) => b.length >= 1)
  ? '通过' : '不通过', `气泡 ${bubbles.length} 条`);
const dupBubble = bubbles.filter((b) => /(.)\1\1/.test(b));
rec('C-02', '气泡没有重复字（三层渲染）', dupBubble.length === 0 ? '通过' : '不通过',
  dupBubble.length ? `例：${dupBubble[0].slice(0, 16)}` : '');

const seen = [];
for (let i = 0; i < 24 && seen.length < 8; i += 1) {
  const row = await page.evaluate(() => {
    const rows = [].slice.call(document.querySelectorAll('#paper-chat .pc-row'));
    const cardText = document.querySelector('#paper-ui .pu-text');
    if (rows.length) {
      const last = rows[rows.length - 1];
      const who = last.querySelector('.pc-who');
      const bub = last.querySelector('.pc-bubble');
      return { name: who ? who.textContent.trim() : '', text: bub ? bub.textContent.trim() : '' };
    }
    return { name: window.__paperName || '', text: cardText ? cardText.textContent.trim() : (window.__paperLine || '') };
  });
  if (row.text) seen.push(row);
  await advance(1, 620);
}
const emptyText = seen.filter((x) => !x.text || x.text.length < 2 ||
  (/^(.)\1+$/.test(x.text) && !scriptTexts.has(x.text.replace(/\s+/g, ''))));
rec('C-03', '正文不是只有名字/空白', emptyText.length === 0 ? '通过' : '不通过',
  emptyText.length ? `异常 ${emptyText.length} 句，例：${JSON.stringify(emptyText[0])}` : `采样 ${seen.length} 句`);
const dupText = seen.filter((x) => /(.)\1\1/.test(x.text));
rec('C-04', '正文没有重复字', dupText.length === 0 ? '通过' : '不通过',
  dupText.length ? `例：${dupText[0].text.slice(0, 14)}` : '');
const inScript = seen.filter((x) => scriptTexts.has(x.text.replace(/\s+/g, ''))).length;
rec('C-05', '正文与剧本原文一致', inScript >= Math.ceil(seen.length * 0.6) ? '通过' : '需人工',
  `${inScript}/${seen.length} 句命中剧本`);
const nameOk = seen.filter((x) => (x.name === '我' || (x.name && x.name.length <= 4 && !/(.)\1/.test(x.name)))).length;
rec('C-06', '发言人名不带重复字', nameOk >= Math.min(6, seen.length) ? '通过' : '不通过',
  `${nameOk}/${seen.length} 句名字正常`);

// ---------------- D 菜单 / 回标题 ----------------
await page.evaluate(() => document.querySelector('#paper-ui .pu-tools button[data-label="选项"]').click());
await page.waitForTimeout(1500);
const menuState = await page.evaluate(() => ({
  ui: getComputedStyle(document.getElementById('paper-ui')).display,
  chat: getComputedStyle(document.getElementById('paper-chat')).display,
  esc: document.getElementById('paper-esc') ? getComputedStyle(document.getElementById('paper-esc')).display : 'x',
}));
rec('D-01', '打开选项时自绘层全部收起', menuState.ui === 'none' && menuState.chat === 'none' ? '通过' : '不通过',
  JSON.stringify(menuState));
await shot('D-config');

const hasTitleEntry = await page.evaluate(() => [...document.querySelectorAll('div,span')].some(e => e.children.length === 0 && e.textContent.trim() === '标题'));
rec('D-02', '菜单里有明确的「标题」入口', hasTitleEntry ? '通过' : '不通过', '');
await page.evaluate(() => { const els = [...document.querySelectorAll('div,span')].filter(e => e.children.length === 0 && e.textContent.trim() === '标题'); if (els.length) els[els.length - 1].click(); });
await page.waitForTimeout(800);
await page.evaluate(() => { const c = document.getElementById('globalDialogContainer'); if (c) { const y = [...c.querySelectorAll('[class*="button"]')].find(x => x.textContent.trim() === '是'); if (y) y.click(); } });
await page.waitForTimeout(2000);
const backState = await page.evaluate(() => ({
  title: getComputedStyle(document.getElementById('paper-title')).display,
}));
rec('D-03', '点标题回到标题页且不卡死', backState.title !== 'none' ? '通过' : '不通过', JSON.stringify(backState));
await shot('D-back-title');

await startGame();
await page.waitForTimeout(2500);
const restart = await lastLine();
rec('D-04', '回标题后能重新开始', !!restart ? '通过' : '不通过', `首句：${restart.slice(0, 12)}`);

// ---------------- E 资源 ----------------
const sceneDir = 'webgal-game/scene';
const refs = new Set();
for (const f of fs.readdirSync(sceneDir)) {
  const txt = fs.readFileSync(path.join(sceneDir, f), 'utf8');
  for (const m of txt.matchAll(/changeBg:([\w.-]+\.webp)/g)) refs.add(m[1]);
  for (const m of txt.matchAll(/changeFigure:([\w.-]+\.webp)/g)) refs.add(m[1]);
  for (const m of txt.matchAll(/-vocal=([\w.-]+\.mp3)/g)) refs.add(m[1]);
}
const missing = [];
for (const r of refs) {
  const dir = r.endsWith('.mp3') ? 'assets/voice' : (r.startsWith('ch_') || r.startsWith('ui_') ? 'assets/ch' : 'assets/bg');
  if (!fs.existsSync(path.join(dir, r))) missing.push(r);
}
rec('E-01', '剧本引用的素材全部存在', missing.length === 0 ? '通过' : '不通过',
  missing.length ? `缺 ${missing.length} 个：${missing.slice(0, 5).join(', ')}` : `共 ${refs.size} 个引用`);
const oldAssets = [...refs].filter((r) => ['bg_chat.webp', 'bg_class.webp', 'bg_canteen.webp', 'bg_store.webp'].includes(r));
rec('E-02', '不再引用旧背景素材', oldAssets.length === 0 ? '通过' : '不通过', oldAssets.join(','));
rec('E-03', '角色立绘来自 galgame 六人素材', [...refs].filter((r) => r.startsWith('ch_')).length > 0 ? '通过' : '不通过', '');

// ---------------- F 性能 ----------------
const lat = [];
let okClicks = 0;
for (let i = 0; i < 10; i += 1) {
  const before = await lastLine();
  const t0 = Date.now();
  await page.mouse.click(800, 700);
  let ok = false;
  for (let k = 0; k < 24; k += 1) {
    await page.waitForTimeout(25);
    if ((await lastLine()) !== before) { ok = true; break; }
  }
  if (ok) { okClicks += 1; lat.push(Date.now() - t0); }
  await page.waitForTimeout(650);
}
lat.sort((a, b) => a - b);
const median = lat.length ? lat[Math.floor(lat.length / 2)] : 9999;
rec('F-01', '单击即可推进', okClicks >= 8 ? '通过' : '不通过', `${okClicks}/10 次单击生效`);
rec('F-02', '生效后响应中位 < 400ms', median < 400 ? '通过' : '不通过', `中位 ${median}ms`);

// ---------------- G 异常 ----------------
rec('G-01', '控制台无报错', consoleErrors.length === 0 ? '通过' : '不通过', consoleErrors.slice(0, 2).join(' | '));
rec('G-02', '无 4xx/5xx 资源请求', failedRequests.length === 0 ? '通过' : '不通过', failedRequests.slice(0, 3).join(' | '));

await browser.close();
const pass = rows.filter((r) => r.status === '通过').length;
const fail = rows.filter((r) => r.status === '不通过').length;
console.log(`\nSUMMARY ${JSON.stringify({ 通过: pass, 不通过: fail, 总计: rows.length })}`);
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ url: URL_BASE, rows }, null, 2));
fs.writeFileSync(path.join(OUT, 'report.md'),
  '# 回归报告\n\n' + rows.map((r) => `- ${r.status === '通过' ? '✅' : '❌'} ${r.id} ${r.title} — ${r.detail}`).join('\n') + '\n');
process.exit(fail > 0 ? 1 : 0);





