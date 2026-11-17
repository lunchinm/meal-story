import { chromium } from '@playwright/test';
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
const info = await p.evaluate(() => {
  const bar = document.querySelector('[class*="rdjpk"]');
  if (!bar) return 'no bar';
  const r = bar.getBoundingClientRect();
  const kids = [...bar.children].slice(0, 4).map((k) => {
    const kr = k.getBoundingClientRect();
    return k.tagName.toLowerCase() + '.' + k.className.toString().slice(0, 30) + ' ' + Math.round(kr.width) + 'x' + Math.round(kr.height) + ' kids=' + [...k.children].map((c) => c.tagName.toLowerCase() + '.' + c.className.toString().slice(0, 22)).join(',');
  });
  return { bar: Math.round(r.x) + ',' + Math.round(r.y) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height), kids };
});
console.log(JSON.stringify(info, null, 1));
await b.close();