import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
for (let i = 0; i < 92; i += 1) {
  const pick = await p.evaluate(() => {
    const el = document.querySelector('[class*="_Choose_item_outer"]');
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  });
  if (pick) { await p.mouse.click(pick.x, pick.y); await p.waitForTimeout(450); continue; }
  await p.mouse.click(640, 300);
  await p.waitForTimeout(260);
}
const info = await p.evaluate(() => {
  const hits = [];
  document.querySelectorAll('div,span,li,button').forEach((e) => {
    const t = (e.textContent || '').trim();
    if (t.length < 3 || t.length > 30) return;
    if (!/先看|记录|账本/.test(t)) return;
    const r = e.getBoundingClientRect();
    if (r.width < 40) return;
    hits.push(e.tagName.toLowerCase() + '.' + e.className.toString().slice(0, 46) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
  });
  return hits.slice(0, 8);
});
console.log(info.join('\n') || '没找到选项文案');
await p.screenshot({ path: 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out/choose-dump-' + Date.now() + '.png' });
await b.close();