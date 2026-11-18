import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
const read = () => p.evaluate(() => window.__paperLine || '');
let stalls = 0;
for (let i = 0; i < 140; i += 1) {
  const chips = await p.evaluate(() => document.querySelectorAll('#paper-chat .pc-choices button, #paper-ui .pu-choices button').length);
  if (chips > 0) {
    await p.evaluate(() => { const btn = document.querySelector('#paper-chat .pc-choices button, #paper-ui .pu-choices button'); if (btn) btn.click(); });
    await p.waitForTimeout(700);
    continue;
  }
  const before = await read();
  await p.mouse.click(640, 300);
  let changed = false;
  for (let k = 0; k < 30; k += 1) {
    await p.waitForTimeout(100);
    if ((await read()) !== before) { changed = true; break; }
  }
  if (!changed) {
    stalls += 1;
    if (stalls <= 2) console.log('第', i, '步卡住，行:', JSON.stringify(before.slice(0, 26)));
    await p.keyboard.press('Space');
    await p.waitForTimeout(500);
  }
}
console.log('140 步里卡住次数:', stalls, '| 末行:', (await read()).slice(0, 22));
await b.close();