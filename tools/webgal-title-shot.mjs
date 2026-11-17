import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/');
await p.waitForTimeout(2500);
await p.mouse.click(640, 360); await p.waitForTimeout(900);
const jsClick = (l) => p.evaluate((label) => {
  const el = [...document.querySelectorAll('button,div,span')].filter((e) => e.textContent.trim() === label);
  const t = el[el.length - 1]; if (t) (t.closest('button') ?? t).dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, l);
await jsClick('简体中文'); await p.waitForTimeout(1800);
await p.screenshot({ path: out + '/wg53-title-' + Date.now() + '.png' });
const info = await p.evaluate(() => {
  const el = [...document.querySelectorAll('[class*="Title"]')].slice(0, 6).map((e) => { const r = e.getBoundingClientRect(); return e.className.toString().slice(0, 40) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height); });
  return el;
});
console.log(info.join('\n'));
await b.close();