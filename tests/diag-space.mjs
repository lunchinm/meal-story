import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
const line = () => p.evaluate(() => window.__paperLine || '');
console.log('起始:', (await line()).slice(0, 12));
for (let i = 0; i < 3; i += 1) {
  await p.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', keyCode: 32, which: 32, bubbles: true }));
  });
  await p.waitForTimeout(900);
  console.log('合成空格后:', (await line()).slice(0, 14));
}
for (let i = 0; i < 2; i += 1) {
  await p.keyboard.press('Space');
  await p.waitForTimeout(900);
  console.log('真实空格后:', (await line()).slice(0, 14));
}
await b.close();