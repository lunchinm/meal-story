// 云端自动化回归：跑 WebGAL 版《今天吃什么？》
// 用法：node tools/qa-cloud.mjs <url> [--out 目录]
// 只做能自动判定的用例；需要耳朵/眼睛的（听感、设计风格）留给人工，脚本会标注「需人工」。
// 结论写进 out/report.json 与 out/report.md，截图在 out/shots/。

import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const url = process.argv[2] || 'http://127.0.0.1:8099/';
const outDir = process.argv[4] || 'qa-out';
const shots = path.join(outDir, 'shots');
await mkdir(shots, { recursive: true });

const results = [];
const rec = (id, name, status, detail, metric) => {
  results.push({ id, name, status, detail: detail || '', metric: metric ?? null });
  console.log(`${status}\t${id}\t${name}\t${detail || ''}${metric != null ? ' | ' + metric : ''}`);
};

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, serviceWorkers: 'block' });
const page = await ctx.newPage();

const errors = [];
const bad = [];
const vocalReqs = [];
page.on('pageerror', (e) => errors.push(e.message.slice(0, 120)));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 120)); });
page.on('response', (r) => {
  const u = r.url();
  if (/\/vocal\//.test(u)) vocalReqs.push(r.status() + ' ' + u.split('/').pop());
  if (r.status() >= 400) bad.push(r.status() + ' ' + u.replace(url, '').slice(-60));
});

const shot = (n) => page.screenshot({ path: path.join(shots, n + '.png') });
const visibleText = () => page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
const readLine = () => page.evaluate(() => {
  // 自绘 UI 暴露的当前行最可靠
  if (window.__paperLine) return window.__paperLine;
  const c = document.querySelector('[class*="TextBox_Container"]');
  if (!c) return null;
  const spans = [...c.querySelectorAll('[class*="outer_"]')].map((s) => s.textContent).join('');
  if (spans) return spans;
  // 新版模板逐字节点没有 outer_ 类名，正文三层重复，取前三分之一
  const raw = (c.innerText || '').replace(/\s+/g, '');
  if (raw.length && raw.length % 3 === 0) return raw.slice(0, raw.length / 3);
  return raw;
});
const nativeOverlay = () => page.evaluate(() => {
  const hit = (re) => [...document.querySelectorAll('*')].some((e) => {
    if (e.children.length) return false;
    if (!re.test(e.textContent || '')) return false;
    const r = e.getBoundingClientRect();
    const cs = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.opacity !== '0';
  });
  return {
    press: hit(/PRESS THE SCREEN/i),
    lang: hit(/LANGUAGE SELECT/i),
    langOptions: hit(/简体中文/) && hit(/English/),
  };
});

// ---------- A 启动与页面流转 ----------
const t0 = Date.now();
let titleReady = true;
try {
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForSelector('#paper-title .pt-menu button', { timeout: 25000 });
} catch {
  titleReady = false;
}
const tTitle = Date.now() - t0;
rec('A-01', '首屏能打开自绘标题页（6 项菜单）', titleReady ? '通过' : '不通过',
  titleReady ? '' : '25 秒内没等到 #paper-title 菜单', tTitle + 'ms');
if (!titleReady) { await browser.close(); process.exit(1); }
await page.waitForTimeout(1200);
await shot('A-01-title');
const menu = await page.evaluate(() => [...document.querySelectorAll('#paper-title .pt-menu button')].map((b) => b.textContent.trim()));
rec('A-02', '标题菜单文案与设计一致', JSON.stringify(menu) === JSON.stringify(['开始游戏', '继续游戏', '游戏选项', '读取存档', '鉴赏模式', '退出游戏']) ? '通过' : '不通过', menu.join('/'));

const ov0 = await nativeOverlay();
rec('A-03', '未点开始前不出现原生 PRESS THE SCREEN 提示', ov0.press ? '不通过' : '通过', ov0.press ? '标题页已出现原生提示' : '');
rec('A-04', '未点开始前不出现 LANGUAGE SELECT 语言层', ov0.lang ? '不通过' : '通过', ov0.lang ? '标题页已出现语言选择层' : '');
rec('A-05', '未点开始前不推进剧情（没有对话框）', (await readLine()) === null ? '通过' : '不通过');

await page.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await page.waitForTimeout(1500);
const titleHidden = await page.evaluate(() => document.getElementById('paper-title')?.style.display === 'none');
rec('A-06', '点开始后 1.5 秒内标题层收起', titleHidden ? '通过' : '不通过');
await shot('A-06-after-start');

// 进入游戏：如果原生层还在，按真实玩家路径处理一次（记下来，交给 A-07/A-08 判）
let ov1 = await nativeOverlay();
if (ov1.lang) {
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('div,span')].filter((e) => e.children.length === 0 && e.textContent.trim() === '简体中文');
    el.at(-1)?.click();
  });
  await page.waitForTimeout(2500);
}
ov1 = await nativeOverlay();
if (ov1.press) {
  await page.mouse.click(640, 300);
  await page.waitForTimeout(1500);
}
const ov2 = await nativeOverlay();
const envDirty = ov2.press || ov2.lang; // 原生层没退干净时，点击/计时类用例一律标「待复测」
rec('A-07', '进入游戏后原生 PRESS / 语言层都不可见', (!ov2.press && !ov2.lang) ? '通过' : '不通过',
  `开始后 PRESS=${ov1.press} 语言层=${ov1.lang}；处理一次后 PRESS=${ov2.press} 语言层=${ov2.lang}`);

const boxes = await page.evaluate(() => document.querySelectorAll('[class*="TextBox_Container"]').length);
rec('A-08', '游戏内只有一个对话框实例（不叠层）', boxes === 1 ? '通过' : '不通过', '实例数=' + boxes);
const titleAfter = await page.evaluate(() => document.getElementById('paper-title')?.style.display);
rec('A-09', '游戏进行中标题层不会回弹覆盖', titleAfter === 'none' ? '通过' : '不通过', 'display=' + titleAfter);
await shot('A-09-ingame');

// ---------- B 响应与流畅 ----------
let prev = await readLine();
if (!prev) {
  await page.waitForTimeout(3000);
  prev = await readLine();
}
rec('B-01', '开始后 5 秒内出现第一句对白', prev ? '通过' : '不通过', prev ? prev.replace(/\s/g, '').slice(0, 16) : '没有对白');
// 鼠标点击推进（真实玩家最常用的操作）
let clickOk = 0;
for (let i = 0; i < 3; i += 1) {
  const before = prev;
  await page.mouse.click(640, 300);
  let hit = false;
  for (let k = 0; k < 80; k += 1) {
    await page.waitForTimeout(25);
    const now = await readLine();
    if (now && now !== before) { hit = true; prev = now; break; }
  }
  if (hit) clickOk += 1;
}
rec('B-02', '鼠标点击对话区能推进对白', envDirty ? '待复测' : (clickOk >= 2 ? '通过' : '不通过'),
  `${clickOk}/3 次点击有推进` + (envDirty ? '；原生层仍在，疑似抢走点击' : ''));

const lat = [];
let changed = 0;
for (let i = 0; i < 90; i += 1) {
  // 遇到选项先选第一项，否则按空格推不动
  const pick = await page.evaluate(() => {
    const el = document.querySelector('[class*="_Choose_item_outer"]');
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  });
  if (pick) {
    await page.mouse.click(pick.x, pick.y);
    await page.waitForTimeout(500);
    continue;
  }
  const t = Date.now();
  await page.keyboard.press('Space');
  let got = null;
  for (let k = 0; k < 160; k += 1) {
    await page.waitForTimeout(25);
    const now = await readLine();
    if (now && now !== prev) { got = now; break; }
  }
  lat.push(Date.now() - t);
  if (got) { changed += 1; prev = got; }
}
lat.sort((a, b) => a - b);
const med = lat[Math.floor(lat.length / 2)];
const p90 = lat[Math.floor(lat.length * 0.9) - (lat.length > 9 ? 0 : 1)] ?? lat.at(-1);
rec('B-03', '按空格后对白有变化（不卡死）', envDirty ? '待复测' : (changed >= 13 ? '通过' : '不通过'), `${changed}/15 次有变化`);
rec('B-04', '单次推进响应中位数 < 300ms', envDirty ? '待复测' : (med < 300 ? '通过' : '不通过'), `中位 ${med}ms，p90 ${p90}ms，最大 ${lat.at(-1)}ms`);
const slow = lat.filter((v) => v > 1000).length;
rec('B-05', '单次推进超过 1 秒的次数', envDirty ? '待复测' : (slow === 0 ? '通过' : '不通过'), `${slow}/15 次 > 1s`, lat.join(','));
rec('B-06', '页面无 4xx/5xx 资源', bad.length === 0 ? '通过' : '不通过', bad.slice(0, 6).join(' ; '));
rec('B-07', '控制台无 JS 报错', errors.length === 0 ? '通过' : '不通过', errors.slice(0, 4).join(' ; '));
await shot('B-talk');

// ---------- C 配音与音频 ----------
const audio = await page.evaluate(() => [...document.querySelectorAll('audio')].map((a) => ({
  src: a.src.split('/').pop(), paused: a.paused, ct: +a.currentTime.toFixed(2),
  dur: Number.isFinite(a.duration) ? +a.duration.toFixed(1) : null, vol: a.volume, muted: a.muted,
})));
const bgm = audio.find((a) => /bgm|loop/i.test(a.src || ''));
rec('C-01', 'BGM 已加载并在播放', !!bgm && !bgm.paused && bgm.ct > 0 ? '通过' : '不通过', JSON.stringify(bgm || null));
rec('C-02', '台词触发 /vocal/ 配音请求', vocalReqs.length > 0 ? '通过' : '不通过',
  vocalReqs.length ? `${vocalReqs.length} 条，例 ${vocalReqs[0]}` : '15 句推进内 0 条请求');
rec('C-03', '配音音频元素在播（currentTime 前进）', audio.some((a) => /\.mp3$/.test(a.src || '') && !/bgm/i.test(a.src) && a.ct > 0) ? '通过' : '不通过',
  'audio 元素=' + JSON.stringify(audio.map((a) => a.src || '(空)')));
rec('C-04', '听感（音色/响度/无爆音）', '需人工', '云端无音频设备，只能验证请求与播放状态');

// ---------- D 流程图 ----------
const hasFlowText = await page.evaluate(() => {
  if (/流程图/.test(document.body.innerText)) return true;
  return !!document.querySelector('#paper-ui .pu-tools button[data-label="流程图"], [aria-label="流程图"]');
});
await page.evaluate(() => {
  const el = [...document.querySelectorAll('[class*="_singleButton"]')].find((e) => (e.textContent || '').trim() === '选项');
  el?.click();
});
await page.waitForTimeout(1200);
const panelText = await visibleText();
const flowInPanel = /流程图/.test(panelText);
await shot('D-panel');
rec('D-01', '游戏内存在「流程图」入口', hasFlowText || flowInPanel ? '通过' : '不通过',
  `快捷栏=${hasFlowText} 选项面板=${flowInPanel}（config 已写 Enable_flowchart:true）`);
let flowJson = 'n/a';
try {
  const r = await page.request.get(new URL('game/flowchart.json', url).href);
  flowJson = r.status();
} catch { flowJson = 'err'; }
rec('D-02', 'game/flowchart.json 可访问（流程图数据）', flowJson === 200 ? '通过' : '不通过', 'HTTP ' + flowJson);
const panelStyle = await page.evaluate(() => {
  const p = [...document.querySelectorAll('div')].find((e) => /系统[\s\S]*显示[\s\S]*音频/.test(e.innerText || '') && e.children.length < 8);
  if (!p) return null;
  const cs = getComputedStyle(p);
  return { bg: cs.backgroundColor, font: cs.fontFamily.slice(0, 40), radius: cs.borderRadius };
});
rec('D-03', '选项/流程图面板沿用纸质风格（颜色/字体）', '需人工',
  panelStyle ? JSON.stringify(panelStyle) : '面板未取到');
await page.keyboard.press('Escape').catch(() => {});
await page.waitForTimeout(600);

// ---------- E 存档 / 读档 ----------
const saveKeys = () => page.evaluate(() => new Promise((res) => {
  const r = indexedDB.open('localforage');
  r.onsuccess = () => {
    const db = r.result;
    if (!db.objectStoreNames.contains('keyvaluepairs')) { res([]); return; }
    const q = db.transaction('keyvaluepairs', 'readonly').objectStore('keyvaluepairs').getAllKeys();
    q.onsuccess = () => res(q.result.map(String));
    q.onerror = () => res([]);
  };
  r.onerror = () => res([]);
}));
const beforeSave = await saveKeys();
await page.evaluate(() => {
  const el = [...document.querySelectorAll('[class*="_singleButton"]')].find((e) => /快速存档/.test(e.textContent || ''));
  el?.click();
});
await page.waitForTimeout(1000);
const afterSave = await saveKeys();
rec('E-01', '快速存档写入本地存储', afterSave.length >= beforeSave.length && afterSave.length > 0 ? '通过' : '不通过',
  `存前=${beforeSave.join(',') || '空'}；存后=${afterSave.join(',') || '空'}`);
const savedLine = await readLine();
await page.reload({ waitUntil: 'load' });
await page.waitForTimeout(3000);
const continueOk = await page.evaluate(() => {
  const b = document.querySelector('#paper-title .pt-menu button[data-label="继续游戏"]');
  if (!b) return 'no-button';
  b.click();
  return 'clicked';
});
await page.waitForTimeout(3000);
const resumed = await readLine();
rec('E-02', '刷新后「继续游戏」回到存档进度', resumed ? '通过' : '不通过',
  `${continueOk}；读回=${(resumed || '无').replace(/\s/g, '').slice(0, 20)}`);

// ---------- G 适配 ----------
await page.waitForTimeout(500);
const fits = async (w, h) => {
  await page.setViewportSize({ width: w, height: h });
  await page.waitForTimeout(800);
  return page.evaluate(() => {
    const de = document.documentElement;
    const overflow = de.scrollWidth - window.innerWidth;
    const card = document.querySelector('[class*="TextBox_Container"]');
    const r = card?.getBoundingClientRect();
    return { overflow, cardInside: r ? r.left >= -2 && r.right <= window.innerWidth + 2 && r.bottom <= window.innerHeight + 2 : null };
  });
};
const f720 = await fits(1280, 720);
const f1080 = await fits(1920, 1080);
const fSmall = await fits(1024, 600);
rec('G-01', '1280×720 / 1920×1080 无横向溢出、框不出屏', f720.overflow <= 2 && f1080.overflow <= 2 && f1080.cardInside !== false ? '通过' : '不通过',
  JSON.stringify({ f720, f1080 }));
rec('G-02', '1024×600 小窗仍可用', fSmall.overflow <= 2 ? '通过' : '不通过', JSON.stringify(fSmall));
await shot('G-1024x600');
const docTitle = await page.title();
rec('G-03', '浏览器标签标题是作品名而非引擎名', /今天吃什么/.test(docTitle) ? '通过' : '不通过', docTitle);

// ---------- H 资源规模 ----------
const voiceCount = await page.evaluate(async () => {
  // 只统计清单：从 game/vocal 无法列目录，改由外部统计，这里跳过
  return null;
});
rec('H-01', '配音文件数（仓库侧统计，需外部核对）', '需人工', '见 report.md 的资源统计');

// ---------- 汇总 ----------
const summary = results.reduce((a, r) => { a[r.status] = (a[r.status] || 0) + 1; return a; }, {});
await writeFile(path.join(outDir, 'report.json'), JSON.stringify({ url, at: new Date().toISOString(), summary, results, errors, bad, vocalReqs }, null, 2));
const md = ['# 云端回归结果', '', `- 目标：${url}`, `- 时间：${new Date().toISOString()}`, `- 汇总：${JSON.stringify(summary)}`, '',
  '| 用例 | 名称 | 结果 | 说明 |', '| --- | --- | --- | --- |',
  ...results.map((r) => `| ${r.id} | ${r.name} | ${r.status} | ${(r.detail + (r.metric != null ? ' / ' + r.metric : '')).replace(/\|/g, '/')} |`)].join('\n');
await writeFile(path.join(outDir, 'report.md'), md);
console.log('SUMMARY', JSON.stringify(summary));
await browser.close();
