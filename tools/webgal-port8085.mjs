import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
const jsClick = (l) => p.evaluate((label) => {
  const el = [...document.querySelectorAll('button,div,span')].filter((e) => e.textContent.trim() === label);
  const t = el[el.length - 1]; if (t) (t.closest('button') ?? t).dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, l);
await p.goto('http://127.0.0.1:8085/');
await p.waitForTimeout(2200);
await p.mouse.click(640, 360); await p.waitForTimeout(800);
await jsClick('简体中文'); await p.waitForTimeout(800);
await jsClick('开始游戏'); await p.waitForTimeout(3000);
for (let i = 0; i < 5; i += 1) { await p.mouse.click(640, 650); await p.waitForTimeout(1200); }
const m = await p.evaluate(() => {
  const el = document.querySelector('.outer') || document.querySelector('[class*="outer"]');
  const cs = el ? getComputedStyle(el) : null;
  return cs ? { size: cs.fontSize, color: cs.color, family: cs.fontFamily.slice(0, 20) } : 'no .outer';
});
console.log(JSON.stringify(m));
await p.screenshot({ path: out + '/wg33.png' });
await b.close();