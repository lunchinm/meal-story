import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8123/?t=' + Date.now());
await p.waitForTimeout(4000);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6500);
await p.getByRole('button', { name: '设置', exact: true }).click();
await p.waitForTimeout(1000);
console.log('设置页打开:', await p.evaluate(() => !!document.querySelector('[class*="_Options_main_"]')));
const back = await p.evaluate(() => {
  const btns = [...document.querySelectorAll('#paper-esc button')];
  const b = btns.find((x) => x.textContent.trim() === '返回');
  if (!b) return null;
  const r = b.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width };
});
console.log('纸面返回:', JSON.stringify(back));
if (back && back.w > 0) { await p.mouse.click(back.x, back.y); await p.waitForTimeout(1200); }
console.log('返回后设置页还在:', await p.evaluate(() => !!document.querySelector('[class*="_Options_main_"]')));
await b.close();