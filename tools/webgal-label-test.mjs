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
await p.keyboard.press('Space'); await p.waitForTimeout(1200);
await p.evaluate(() => { const el = document.querySelector('[class*="_Choose_item_outer"]'); if (el) el.click(); });
await p.waitForTimeout(2000);
const txt = await p.evaluate(() => {
  const c = document.querySelector('[class*="TextBox_Container"]');
  return c ? [...c.querySelectorAll('[class*="outer_"]')].map((s) => s.textContent).join('') : '';
});
console.log('after choice:', txt.slice(0, 20));
await b.close();