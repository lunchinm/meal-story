import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
const jsClick = (l) => p.evaluate((label) => {
  const el = [...document.querySelectorAll('button,div,span')].filter((e) => e.textContent.trim() === label);
  const t = el[el.length - 1]; if (t) (t.closest('button') ?? t).dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, l);
await p.goto('http://127.0.0.1:8082/');
await p.waitForTimeout(2000);
await p.mouse.click(640, 360); await p.waitForTimeout(700);
await jsClick('简体中文'); await p.waitForTimeout(700);
await jsClick('开始游戏');
await p.waitForTimeout(7000);
const dump = await p.evaluate(() => {
  const cont = document.querySelector('[class*="TextBox_Container"]');
  if (!cont) return 'no container';
  const rows = [];
  const walk = (el, d) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const txt = el.children.length === 0 ? (el.textContent || '').trim().slice(0, 4) : '';
    rows.push([d, el.tagName.toLowerCase(), el.className.toString().slice(0, 34), cs.fontSize, cs.color, cs.opacity, Math.round(r.x) + ',' + Math.round(r.y) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height), txt].join(' | '));
    if (d < 5) [...el.children].slice(0, 3).forEach((c) => walk(c, d + 1));
  };
  walk(cont, 0);
  return rows.slice(0, 14).join('\n');
});
console.log(dump);
await b.close();