import { chromium } from '@playwright/test';
const b = await chromium.launch();
for (const vp of [{ w: 1280, h: 720, d: 1 }, { w: 1600, h: 900, d: 1.6 }]) {
  const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: vp.d });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
  await p.waitForTimeout(2500);
  await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
  await p.waitForTimeout(6000);
  const lines = [];
  for (let i = 0; i < 6; i += 1) {
    lines.push((await p.evaluate(() => window.__paperLine || '')).slice(0, 10));
    await p.mouse.click(Math.round(vp.w / 2), Math.round(vp.h * 0.4));
    await p.waitForTimeout(700);
  }
  console.log(vp.w + 'x' + vp.h, '→', lines.join(' | '));
  await ctx.close();
}
await b.close();