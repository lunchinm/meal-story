import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8090/?t=' + Date.now());
await p.waitForTimeout(4000);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
await p.mouse.click(800, 700);
await p.waitForTimeout(1500);
const n = await p.evaluate(() => document.querySelectorAll('#paper-ui .pu-choices button').length);
console.log('选项条数:', n);
if (n) {
  const box = await p.evaluate(() => { const b = document.querySelector('#paper-ui .pu-choices button'); const r = b.getBoundingClientRect(); return { x: r.x + r.width/2, y: r.y + r.height/2, t: b.textContent }; });
  console.log('第一项:', box.t, JSON.stringify({x: Math.round(box.x), y: Math.round(box.y)}));
  await p.mouse.click(box.x, box.y);
  await p.waitForTimeout(1500);
  console.log('点击后:', (await p.evaluate(() => window.__paperLine || '')).slice(0, 12));
}
await b.close();