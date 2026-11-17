import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
const jsClick = (l) => p.evaluate((label) => {
  const el = [...document.querySelectorAll('button,div,span')].filter((e) => e.textContent.trim() === label);
  const t = el[el.length - 1]; if (t) (t.closest('button') ?? t).dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, l);
await p.goto('http://127.0.0.1:8083/?v=' + Date.now());
await p.waitForTimeout(2000);
await p.mouse.click(640, 360); await p.waitForTimeout(700);
await jsClick('简体中文'); await p.waitForTimeout(700);
await jsClick('开始游戏'); await p.waitForTimeout(3000);
for (let i = 0; i < 5; i += 1) { await p.mouse.click(640, 650); await p.waitForTimeout(1000); }
const tree = await p.evaluate(() => {
  const c = document.querySelector('[class*="TextBox_Container"]');
  if (!c) return 'none';
  const box = c.getBoundingClientRect();
  const lines = ['container rect: ' + JSON.stringify({ x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height) })];
  const walk = (el, d) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    lines.push('  '.repeat(d) + el.tagName.toLowerCase() + '.' + el.className.toString() + ' | ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' @' + Math.round(r.x) + ',' + Math.round(r.y) + ' | bg=' + cs.backgroundColor + ' img=' + (cs.backgroundImage === 'none' ? '-' : 'yes'));
    if (d < 3) [...el.children].forEach((ch) => walk(ch, d + 1));
  };
  walk(c, 0);
  return lines.slice(0, 12).join('\n');
});
console.log(tree);
await b.close();