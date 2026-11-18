import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8090/?t=' + Date.now());
await p.waitForTimeout(4000);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(7000);
for (let i = 0; i < 6; i += 1) {
  const st = await p.evaluate(() => ({ n: window.__paperName, t: (window.__paperLine || '') }));
  console.log(i, JSON.stringify(st).slice(0, 90));
  await p.mouse.click(800, 700);
  await p.waitForTimeout(700);
}
await b.close();