import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
const anim = [];
p.on('response', (r) => { if (r.url().includes('/animation/')) anim.push(r.status() + ' ' + r.url().split('/').pop()); });
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
for (let i = 0; i < 8; i += 1) {
  const before = await p.evaluate(() => (document.querySelector('[class*="_text_"]')?.textContent || '').slice(0, 8));
  const t0 = Date.now();
  await p.keyboard.press('Space');
  let changed = 0;
  for (let k = 0; k < 60; k += 1) {
    await p.waitForTimeout(100);
    const now = await p.evaluate(() => (document.querySelector('[class*="_text_"]')?.textContent || '').slice(0, 8));
    if (now !== before) { changed = Date.now() - t0; break; }
  }
  console.log(i, changed ? changed + 'ms' : '>6000ms', '|', JSON.stringify(before));
}
console.log('animation 请求:', anim.slice(0, 6).join(' | ') || 'none');
await b.close();