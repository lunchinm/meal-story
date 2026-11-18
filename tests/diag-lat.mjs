import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
const read = () => p.evaluate(() => window.__paperLine || '');
let prev = await read();
const out = [];
for (let i = 0; i < 10; i += 1) {
  const t0 = Date.now();
  await p.mouse.click(640, 300);
  let ok = -1;
  for (let k = 0; k < 60; k += 1) {
    await p.waitForTimeout(25);
    const now = await read();
    if (now !== prev) { ok = Date.now() - t0; prev = now; break; }
  }
  out.push(ok < 0 ? 'x' : ok);
  if (ok < 0) { await p.waitForTimeout(300); }
}
console.log('逐句延迟(ms):', out.join(','));
await b.close();