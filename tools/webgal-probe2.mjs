import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
const jsClick = (l) => p.evaluate((label) => {
  const el = [...document.querySelectorAll('button,div,span')].filter((e) => e.textContent.trim() === label);
  const t = el[el.length - 1]; if (t) (t.closest('button') ?? t).dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, l);
await p.goto('http://127.0.0.1:8082/?n=' + Date.now());
await p.waitForTimeout(2000);
await p.mouse.click(640, 360); await p.waitForTimeout(700);
await jsClick('简体中文'); await p.waitForTimeout(700);
await jsClick('开始游戏');
await p.waitForTimeout(5000);
for (let i = 0; i < 6; i += 1) { await p.mouse.click(640, 650); await p.waitForTimeout(1500); }
const info = await p.evaluate(() => {
  const cont = document.querySelector('[class*="TextBox_Container"]');
  const rows = [];
  const walk = (el, d) => {
    const cs = getComputedStyle(el);
    const txt = el.children.length === 0 ? el.textContent.trim().slice(0, 6) : '';
    rows.push({ d, tag: el.tagName.toLowerCase(), cls: el.className.toString().slice(0, 46), size: cs.fontSize, txt });
    if (d < 4) [...el.children].slice(0, 4).forEach((c) => walk(c, d + 1));
  };
  if (cont) walk(cont, 0);
  return rows.slice(0, 16);
});
console.log(JSON.stringify(info, null, 0).slice(0, 1600));
await b.close();