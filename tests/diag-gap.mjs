import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
const line = () => p.evaluate(() => window.__paperLine || '');
for (const gap of [300, 700, 1200]) {
  let ok = 0, prev = await line();
  for (let i = 0; i < 6; i += 1) {
    await p.keyboard.press('Space');
    await p.waitForTimeout(gap);
    const now = await line();
    if (now !== prev) ok += 1;
    prev = now;
  }
  console.log('间隔', gap + 'ms →', ok + '/6 推进');
}
await b.close();