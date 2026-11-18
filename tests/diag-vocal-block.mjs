import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(5000);
const line = () => p.evaluate(() => window.__paperLine || '');
for (let i = 0; i < 4; i += 1) {
  await p.mouse.click(640, 300);
  const t0 = Date.now();
  let changed = '';
  for (let k = 0; k < 60; k += 1) {
    await p.waitForTimeout(100);
    const l = await line();
    if (l.includes('第') || l.includes('配音')) { changed = l; break; }
  }
  console.log(i, (Date.now() - t0) + 'ms', JSON.stringify((await line()).slice(0, 12)));
}
await b.close();