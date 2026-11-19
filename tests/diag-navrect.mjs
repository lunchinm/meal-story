import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8123/?t=' + Date.now());
await p.waitForTimeout(4000);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
for (let i = 0; i < 3; i += 1) { await p.mouse.click(800, 700); await p.waitForTimeout(400); }
console.log(JSON.stringify(await p.evaluate(() => {
  const nav = document.getElementById('paper-nav');
  const proto = document.querySelector('[class*="_singleButton"]');
  const nr = nav && nav.getBoundingClientRect();
  const pr = proto && proto.getBoundingClientRect();
  return { nav: nr && { x: Math.round(nr.x), y: Math.round(nr.y), w: Math.round(nr.width), h: Math.round(nr.height), disp: getComputedStyle(nav).display, op: getComputedStyle(nav).opacity }, proto: pr && { x: Math.round(pr.x), y: Math.round(pr.y) } };
})));
await b.close();