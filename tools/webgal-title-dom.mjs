import { chromium } from '@playwright/test';
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
await jsClick('简体中文'); await p.waitForTimeout(4000);
const info = await p.evaluate(() => {
  const el = [...document.querySelectorAll('*')].filter((e) => e.children.length === 0 && e.textContent.trim() === '开始游戏');
  return el.map((e) => { const r = e.getBoundingClientRect(); return e.tagName.toLowerCase() + '.' + e.className.toString() + ' @' + Math.round(r.x) + ',' + Math.round(r.y) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' parent=' + e.parentElement.className.toString().slice(0, 40); });
});
console.log(info.join('\n'));
await b.close();