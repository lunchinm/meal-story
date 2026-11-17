import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/');
await p.waitForTimeout(2500);
await p.mouse.click(640, 360); await p.waitForTimeout(800);
const jsClick = (l) => p.evaluate((label) => {
  const el = [...document.querySelectorAll('button,div,span')].filter((e) => e.textContent.trim() === label);
  const t = el[el.length - 1]; if (t) (t.closest('button') ?? t).dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, l);
await jsClick('简体中文'); await p.waitForTimeout(800);
await jsClick('开始游戏'); await p.waitForTimeout(7000);
const bar = await p.evaluate(() => {
  const b = document.querySelector('[class*="_main_rdjpk"]');
  if (!b) return 'none';
  const r = b.getBoundingClientRect();
  const btns = [...b.querySelectorAll('[class*="_singleButton"]')].map((x) => { const rr = x.getBoundingClientRect(); return Math.round(rr.width) + 'x' + Math.round(rr.height) + '@' + Math.round(rr.x) + ',' + Math.round(rr.y); });
  return { bar: Math.round(r.x) + ',' + Math.round(r.y) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height), count: btns.length, first: btns.slice(0, 3) };
});
console.log(JSON.stringify(bar));
await p.screenshot({ path: out + '/wg50-bar-' + Date.now() + '.png', clip: { x: 820, y: 600, width: 460, height: 120 } });
await b.close();