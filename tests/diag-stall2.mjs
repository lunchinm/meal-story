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
for (let i = 0; i < 120; i += 1) {
  const pick = await p.evaluate(() => {
    const el = document.querySelector('[class*="_Choose_item_outer"]');
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2, n: document.querySelectorAll('[class*="_Choose_item_outer"]').length };
  });
  if (pick) { await p.mouse.click(pick.x, pick.y); await p.waitForTimeout(500); prev = await line(); continue; }
  await p.keyboard.press('Space');
  await p.waitForTimeout(400);
  const now = await line();
  if (now === prev) {
    const has = await p.evaluate(() => document.querySelectorAll('[class*="hoose"]').length);
    console.log('卡住 @', i, '行:', JSON.stringify(prev.slice(0, 24)), '选面板元素:', has);
    break;
  }
  prev = now;
}
await b.close();