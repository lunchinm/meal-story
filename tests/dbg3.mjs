import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
const info = await p.evaluate(() => {
  const c = document.querySelector('[class*="TextBox_Container"]');
  if (!c) return { none: true };
  const cls = new Set();
  c.querySelectorAll('*').forEach((e) => cls.add(e.className.toString()));
  return {
    html: c.innerHTML.slice(0, 300),
    classes: [...cls].slice(0, 10),
    canvases: c.querySelectorAll('canvas').length,
    bodyText: (c.innerText || '').replace(/\s+/g, '').slice(0, 30),
  };
});
console.log(JSON.stringify(info, null, 1).slice(0, 1200));
await b.close();