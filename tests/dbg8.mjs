import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
for (let i = 0; i < 12; i += 1) { await p.mouse.click(640, 400); await p.waitForTimeout(700); }
const info = await p.evaluate(() => {
  const c = document.querySelector('[class*="TextBox_Container"]');
  const html = c ? c.innerHTML.replace(/\s+/g, ' ').slice(0, 600) : '';
  const raw = c ? (c.innerText || '').replace(/\s+/g, ' ') : '';
  const choose = !!document.querySelector('[class*="_Choose_item_outer"]');
  return { raw: raw.slice(0, 120), choose, htmlLen: html.length, html: html.slice(0, 300) };
});
console.log(JSON.stringify(info, null, 1).slice(0, 800));
await b.close();