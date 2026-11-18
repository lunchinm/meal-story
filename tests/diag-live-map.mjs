import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1.6 });
const p = await ctx.newPage();
await p.goto('https://lunchinm.github.io/meal-story/?t=' + Date.now(), { timeout: 120000, waitUntil: 'domcontentloaded' });
await p.waitForTimeout(7000);
await p.mouse.click(800, 420); await p.waitForTimeout(2500);
await p.evaluate(() => {
  const el = [...document.querySelectorAll('span,div')].filter((e) => e.children.length === 0 && e.textContent.trim() === '简体中文');
  if (el.length) el[el.length - 1].click();
});
await p.waitForTimeout(5000);
if (await p.evaluate(() => !!document.querySelector('#paper-title .pt-menu button'))) {
  await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
}
await p.waitForTimeout(8000);
const seen = [];
for (let i = 0; i < 14; i += 1) {
  const line = await p.evaluate(() => window.__paperLine || '');
  const hit = await p.evaluate((t) => (window.__chatImages && window.__chatImages[t]) || '', line);
  seen.push(i + ':' + (hit ? 'HIT ' + hit : line.slice(0, 12)));
  if (hit) break;
  await p.mouse.click(800, 340);
  await p.waitForTimeout(750);
}
console.log(seen.join(' | '));
const keys = await p.evaluate(() => window.__chatImages ? Object.keys(window.__chatImages).length : -1);
console.log('映射数:', keys);
await b.close();