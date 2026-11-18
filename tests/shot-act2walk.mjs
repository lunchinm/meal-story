import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
const stamp = Date.now();
for (let i = 0; i < 150; i += 1) {
  const pick = await p.evaluate(() => {
    const el = document.querySelector('[class*="_Choose_item_outer"]');
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  });
  if (pick) { await p.mouse.click(pick.x, pick.y); await p.waitForTimeout(500); continue; }
  if (i === 55 || i === 75 || i === 95) await p.screenshot({ path: out + '/act2-step' + i + '-' + stamp + '.png' });
  await p.mouse.click(640, 300);
  await p.waitForTimeout(280);
}
console.log('done');
await b.close();