import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
const res = await p.evaluate(() => {
  const canvas = document.querySelector('canvas');
  if (!canvas) return 'no canvas';
  const before = window.__paperLine || '';
  ['pointerdown', 'pointerup', 'click'].forEach((t) => canvas.dispatchEvent(new MouseEvent(t, { bubbles: true, cancelable: true, clientX: 640, clientY: 300 })));
  return 'dispatched on canvas';
});
await p.waitForTimeout(1200);
const after = await p.evaluate(() => window.__paperLine || '');
console.log(res, '| before/after 变化:', after.slice(0, 12));
await b.close();