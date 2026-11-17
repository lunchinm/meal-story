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
await jsClick('开始游戏'); await p.waitForTimeout(4000);
await p.keyboard.press('Space'); await p.waitForTimeout(1500);
// 点第二个选项
const r = await p.evaluate(() => {
  const items = [...document.querySelectorAll('[class*="_Choose_item_outer"]')];
  const el = items[1];
  if (!el) return null;
  const b = el.getBoundingClientRect();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2, n: items.length };
});
console.log('items:', r && r.n);
if (r) { await p.mouse.click(r.x, r.y); await p.waitForTimeout(2500); }
const txt = await p.evaluate(() => {
  const cont = document.querySelector('[class*="TextBox_Container"]');
  return [...cont.querySelectorAll('[class*="outer_"]')].map((s) => s.textContent).join('');
});
console.log('branch text:', txt);
await b.close();