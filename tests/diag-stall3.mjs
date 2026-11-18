import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
for (let i = 0; i < 55; i += 1) {
  const pick = await p.evaluate(() => {
    const el = document.querySelector('[class*="_Choose_item_outer"]');
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  });
  if (pick) { await p.mouse.click(pick.x, pick.y); await p.waitForTimeout(400); continue; }
  await p.keyboard.press('Space');
  await p.waitForTimeout(300);
}
const info = await p.evaluate(() => {
  const els = [...document.querySelectorAll('[class*="hoose"]')];
  const dump = els.slice(0, 3).map((e) => {
    const r = e.getBoundingClientRect();
    return { cls: e.className.toString(), w: Math.round(r.width), h: Math.round(r.height), kids: [...e.children].slice(0, 4).map((k) => k.className.toString().slice(0, 40) + '|' + Math.round(k.getBoundingClientRect().height)) };
  });
  return { count: els.length, dump, line: (window.__paperLine || '').slice(0, 20) };
});
console.log(JSON.stringify(info, null, 1).slice(0, 900));
await p.screenshot({ path: 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out/stall2-' + Date.now() + '.png' });
await b.close();