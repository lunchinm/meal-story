import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
for (let i = 0; i < 5; i += 1) { await p.mouse.click(640, 300); await p.waitForTimeout(700); }
const info = await p.evaluate(() => ({
  name: window.__paperName || '',
  line: (window.__paperLine || '').slice(0, 14),
  showname: document.querySelectorAll('[class*="showname"]').length,
  cands: [...document.querySelectorAll('div[class*="ame"], div[class*="how"]')].slice(0, 4).map((e) => e.className.toString().slice(0, 40)),
}));
console.log(JSON.stringify(info).slice(0, 400));
await b.close();