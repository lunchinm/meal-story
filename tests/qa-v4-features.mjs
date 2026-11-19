// 新增行为回归：回复条发送 / 跳关 / 语音切换
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const BASE = process.argv[2] || 'http://127.0.0.1:8123/';
const OUT = process.argv[3] || 'qa-v4';
fs.mkdirSync(OUT, { recursive: true });

const rows = [];
const rec = (id, name, ok, detail = '') => {
  rows.push({ id, name, status: ok ? '通过' : '不通过', detail });
  console.log(`${ok ? '✔' : '✘'} ${id}\t${name}\t${detail}`);
};

const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
const p = await ctx.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));

const startAt = async (scene, label) => {
  await p.evaluate(([sc, lb]) => { window.__wgDebugStart = { scene: sc, label: lb }; }, [scene, label]);
  const bt = await p.evaluate(() => {
    const t = document.getElementById('paper-title');
    if (!t || getComputedStyle(t).display === 'none') return false;
    const btn = t.querySelector('.pt-menu button[data-label="开始游戏"]');
    if (btn) { btn.click(); return true; }
    return false;
  });
  if (!bt) {
    await p.evaluate(() => window.__wgBackToTitle && window.__wgBackToTitle());
    await p.waitForTimeout(1200);
    await p.evaluate(() => {
      const t = document.getElementById('paper-title');
      const btn = t && t.querySelector('.pt-menu button[data-label="开始游戏"]');
      if (btn) btn.click();
    });
  }
  await p.waitForTimeout(9000);
};

await p.goto(BASE + '?t=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 120000 });
await p.waitForTimeout(4500);

// ---------- 回复条 ----------
await startAt('act1.txt', 'seg1_3');

let chip = null;
for (let i = 0; i < 40 && !chip; i += 1) {
  chip = await p.evaluate(() => {
    const c = document.querySelector('#paper-chat .pc-send');
    if (!c) return null;
    const r = c.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, t: c.textContent.trim() };
  });
  if (!chip) { await p.mouse.click(800, 700); await p.waitForTimeout(600); }
}
rec('R-01', '群聊里玩家台词先以回复条出现', !!chip, chip ? chip.t.slice(0, 12) : '');

if (chip) {
  const before = await p.evaluate(() => window.__paperLine || '');
  // 慢网络下纸签可能被重建：重测坐标并最多点 3 次
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const cur = await p.evaluate(() => {
      const c = document.querySelector('#paper-chat .pc-send');
      if (!c) return null;
      const r = c.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    if (!cur) break;
    await p.mouse.click(cur.x, cur.y);
    await p.waitForTimeout(700);
    const gone = await p.evaluate(() => !document.querySelector('#paper-chat .pc-send'));
    if (gone) break;
  }
  await p.waitForTimeout(1200);
  const after = await p.evaluate(() => ({
    chip: !!document.querySelector('#paper-chat .pc-send'),
    me: [...document.querySelectorAll('#paper-chat .pc-row.me .pc-bubble')].map((x) => x.textContent.trim()),
    line: window.__paperLine || '',
    vocalPaused: (() => { const v = document.getElementById('currentVocal'); return v ? (v.paused || v.currentTime === 0) : true; })(),
  }));
  rec('R-02', '点回复条后回复条消失', !after.chip);
  rec('R-03', '点回复条后出现右侧绿色气泡', after.me.includes(chip.t), '气泡 ' + after.me.length + ' 条');
  rec('R-04', '点回复条后剧情自动推进', after.line !== before, `${before.slice(0, 8)} → ${after.line.slice(0, 10)}`);
  rec('V-01', '切到玩家台词时上一句配音已停', after.vocalPaused);
}

const dup = await p.evaluate(() => {
  const texts = [...document.querySelectorAll('#paper-chat .pc-row .pc-bubble')].map((x) => x.textContent.trim());
  return texts.length - new Set(texts).size;
});
rec('R-05', '同一句不会重复出现', dup === 0, '重复 ' + dup + ' 条');

// ---------- 跳关 ----------
const hasBtn = await p.evaluate(() => !!document.getElementById('paper-jump-btn'));
rec('J-01', '调试跳关按钮存在', hasBtn);

if (hasBtn) {
  await p.evaluate(() => document.getElementById('paper-jump-btn').click());
  await p.waitForTimeout(700);
  const clicked = await p.evaluate(() => {
    const btn = [...document.querySelectorAll('#paper-jump button')].find((x) => x.textContent.startsWith('seg3_6'));
    if (!btn) return false;
    btn.click();
    return true;
  });
  await p.waitForTimeout(17000);
  const line = await p.evaluate(() => window.__paperLine || '');
  rec('J-02', '跳关能直接到指定段落', clicked && line.includes('你在给它找角度'), line.slice(0, 20));
}

rec('G-01', '控制台无报错', errors.length === 0, errors.slice(0, 2).join(' | '));

fs.writeFileSync(OUT + '/report.json', JSON.stringify(rows, null, 1));
const pass = rows.filter((r) => r.status === '通过').length;
console.log(`\nSUMMARY ${JSON.stringify({ 通过: pass, 不通过: rows.length - pass, 总计: rows.length })}`);
await b.close();
process.exit(rows.some((r) => r.status === '不通过') ? 1 : 0);

