import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
const line = () => p.evaluate(() => window.__paperLine || '');
let prev = await line(), slow = 0;
for (let i = 0; i < 70; i += 1) {
  const t0 = Date.now();
  await p.mouse.click(640, 300);
  let got = false;
  for (let k = 0; k < 40; k += 1) {
    await p.waitForTimeout(100);
    const now = await line();
    if (now !== prev) { prev = now; got = true; break; }
  }
  const dt = Date.now() - t0;
  if (dt > 1000) slow += 1;
  if (!got) { console.log('无变化 @', i); break; }
}
console.log('去掉配音后，>1s 的次数:', slow, '/70');
await b.close();