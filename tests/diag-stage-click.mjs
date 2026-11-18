import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
const before = await p.evaluate(() => window.__paperLine || '');
const r = await p.evaluate(() => {
  const el = document.elementFromPoint(640, 300);
  if (!el) return 'no el';
  el.click();
  return el.tagName + '.' + el.className.toString().slice(0, 30);
});
await p.waitForTimeout(1200);
const after = await p.evaluate(() => window.__paperLine || '');
console.log('点击元素:', r, '| 推进:', before !== after, '|', before.slice(0, 8), '→', after.slice(0, 8));
await b.close();