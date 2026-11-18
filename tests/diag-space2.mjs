import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
const line = () => p.evaluate(() => window.__paperLine || '');
let prev = await line();
for (let i = 0; i < 12; i += 1) {
  await p.keyboard.press('Space');
  await p.waitForTimeout(450);
  const now = await line();
  console.log(i, now === prev ? '无变化' : '推进', JSON.stringify(now.slice(0, 14)));
  prev = now;
}
await b.close();