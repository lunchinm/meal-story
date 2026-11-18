import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
const vocal = [];
p.on('request', (r) => { if (r.url().includes('/vocal/')) vocal.push(r.url().split('/').pop()); });
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
let choices = 0, clicks = 0;
for (let i = 0; i < 120; i += 1) {
  const r = await p.evaluate(() => {
    const el = document.querySelector('[class*="_Choose_item_outer"]');
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  });
  if (r) { choices += 1; await p.mouse.click(r.x, r.y); await p.waitForTimeout(1200); continue; }
  await p.mouse.click(640, 400);
  clicks += 1;
  await p.waitForTimeout(700);
}
const line = await p.evaluate(() => {
  const c = document.querySelector('[class*="TextBox_Container"]');
  const t = c ? (c.innerText || '').replace(/\s+/g, '') : '';
  return t.slice(0, Math.ceil(t.length / 3));
});
console.log('点击:', clicks, '选择:', choices, '配音:', vocal.length, vocal.slice(0,3).join(','));
console.log('行:', line.slice(0, 24));
await b.close();