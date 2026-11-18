import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
for (let i = 0; i < 130; i += 1) {
  const r = await p.evaluate(() => {
    const el = document.querySelector('[class*="hoose"]');
    if (!el) return null;
    const rr = el.getBoundingClientRect();
    return { n: document.querySelectorAll('[class*="_Choose_item_outer"]').length, w: Math.round(rr.width), h: Math.round(rr.height), cls: el.className.toString() };
  });
  if (r && r.n > 0) { console.log('选项面板:', JSON.stringify(r)); await p.screenshot({ path: out + '/choose-deep-' + Date.now() + '.png' }); break; }
  await p.mouse.click(640, 300);
  await p.waitForTimeout(300);
}
const t = await p.evaluate(() => window.__paperLine || '');
console.log('当前行:', t.slice(0, 22));
await b.close();