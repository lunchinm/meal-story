import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/');
await p.waitForTimeout(2500);
await p.mouse.click(640, 360); await p.waitForTimeout(900);
const clickText = (l) => p.evaluate((label) => {
  const el = [...document.querySelectorAll('button,span,div')].filter((e) => e.children.length === 0 && e.textContent.trim() === label);
  if (el.length) { el[el.length - 1].click(); return true; } return false;
}, l);
await clickText('简体中文'); await p.waitForTimeout(3000);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);

let choices = 0, steps = 0;
const seen = new Set();
for (let i = 0; i < 260; i += 1) {
  const r = await p.evaluate(() => {
    const el = [...document.querySelectorAll('[class*="_Choose_item_outer"]')][0];
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2, txt: (el.textContent || '').trim().slice(0, 10) };
  });
  if (r) {
    choices += 1;
    seen.add(r.txt);
    await p.waitForTimeout(500);
    await p.mouse.click(r.x, r.y);
    await p.waitForTimeout(1400);
    continue;
  }
  await p.mouse.click(640, 500);
  steps += 1;
  await p.waitForTimeout(280);
}
const last = await p.evaluate(() => {
  const c = document.querySelector('[class*="TextBox_Container"]');
  return c ? [...c.querySelectorAll('[class*="outer_"]')].map((s) => s.textContent).join('') : '';
});
console.log('steps:', steps, 'choices:', choices, 'unique choice texts:', seen.size, 'last:', last.slice(0, 24));
await b.close();