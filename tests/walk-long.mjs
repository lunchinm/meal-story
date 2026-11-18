import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
const vocal = [];
p.on('request', (r) => { if (r.url().includes('/vocal/')) vocal.push(r.url().split('/').pop()); });
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
const stamp = Date.now();
let lines = 0, choices = 0;
const seen = [];
for (let i = 0; i < 240; i += 1) {
  const r = await p.evaluate(() => {
    const el = document.querySelector('[class*="_Choose_item_outer"]');
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  });
  if (r) {
    choices += 1;
    if (choices <= 12) await p.screenshot({ path: out + '/walk-choice' + choices + '-' + stamp + '.png' });
    await p.mouse.click(r.x, r.y);
    await p.waitForTimeout(900);
    continue;
  }
  await p.mouse.click(640, 300);
  await p.waitForTimeout(220);
  await p.mouse.click(640, 300);
  await p.waitForTimeout(420);
  lines += 1;
  if (lines % 40 === 0) {
    const t = await p.evaluate(() => window.__paperLine || '');
    seen.push(lines + ':' + t.slice(0, 14));
    await p.screenshot({ path: out + '/walk-' + lines + '-' + stamp + '.png' });
  }
}
const last = await p.evaluate(() => window.__paperLine || '');
console.log('推进行数:', lines, '选项次数:', choices, '配音请求:', vocal.length);
console.log('里程:', seen.join(' | '));
console.log('当前:', last.slice(0, 20));
await b.close();