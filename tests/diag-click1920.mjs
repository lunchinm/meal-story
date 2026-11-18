import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1920, height: 1080 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(3500);
const info = await p.evaluate(() => {
  const btns = [...document.querySelectorAll('#paper-title .pt-menu button')];
  const r = btns[0].getBoundingClientRect();
  const cover = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
  return { first: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, cover: cover ? cover.tagName + '.' + cover.className.toString().slice(0, 24) : 'null' };
});
console.log(JSON.stringify(info));
await p.mouse.click(info.first.x + 20, info.first.y + 10);
await p.waitForTimeout(5000);
console.log(JSON.stringify(await p.evaluate(() => ({ line: (window.__paperLine || '').slice(0, 12), title: getComputedStyle(document.getElementById('paper-title')).display }))));
await b.close();