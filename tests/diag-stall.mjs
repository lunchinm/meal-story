import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
const line = () => p.evaluate(() => window.__paperLine || '');
for (let i = 0; i < 12; i += 1) {
  await p.mouse.click(640, 300);
  await p.waitForTimeout(700);
  console.log(i, JSON.stringify((await line()).slice(0, 18)));
}
await b.close();