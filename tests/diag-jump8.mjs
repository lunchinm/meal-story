import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8123/?t=' + Date.now());
await p.waitForTimeout(5000);
const idx = await p.evaluate(() => {
  const btns = [...document.querySelectorAll('#paper-jump button')];
  return btns.length;
});
await p.evaluate(() => document.getElementById('paper-jump-btn').click());
await p.waitForTimeout(600);
await p.evaluate(() => { const b = [...document.querySelectorAll('#paper-jump button')].find(x => x.textContent.startsWith('seg3_6')); if (b) b.click(); });
await p.waitForTimeout(3000);
console.log('标题是否出现:', await p.evaluate(() => { const t = document.getElementById('paper-title'); return t ? getComputedStyle(t).display : 'none'; }));
await p.waitForTimeout(10000);
console.log('跳转后:', (await p.evaluate(() => window.__paperLine || '')).slice(0, 24));
await b.close();