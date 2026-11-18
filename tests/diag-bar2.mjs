import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
const rows = await p.evaluate(() => [...document.querySelectorAll('[class*="_singleButton"]')].map((e, i) => ({
  i,
  cls: e.className.toString().replace('_singleButton_rdjpk_42', '').trim(),
  kids: [...e.children].map((c) => c.tagName + ':' + (c.getAttribute('data-icon') || c.className.toString().slice(0, 14))).join(','),
  title: e.getAttribute('title') || '',
})));
console.log(JSON.stringify(rows).slice(0, 900));
await b.close();