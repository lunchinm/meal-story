import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
for (let i = 0; i < 20; i += 1) { await p.mouse.click(640, 400); await p.waitForTimeout(800); }
const info = await p.evaluate(() => {
  const c = document.querySelector('[class*="TextBox_Container"]');
  const raw = c ? (c.innerText || '').replace(/\s+/g, '') : '';
  const ov = document.querySelector('#paper-ui .pu-text')?.textContent || '';
  return { raw, len: raw.length, overlay: ov.slice(0, 40), choose: document.querySelectorAll('[class*="_Choose_item_outer"]').length };
});
console.log(JSON.stringify(info, null, 1).slice(0, 600));
await p.screenshot({ path: 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out/stall-' + Date.now() + '.png' });
await b.close();