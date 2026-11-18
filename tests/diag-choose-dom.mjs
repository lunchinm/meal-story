import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8090/?t=' + Date.now());
await p.waitForTimeout(4000);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
await p.mouse.click(800, 700);
await p.waitForTimeout(1800);
const info = await p.evaluate(() => {
  const cont = document.querySelector('[class*="_chooseContainer"]');
  const all = cont ? [...cont.querySelectorAll('div')].map((d) => { const r = d.getBoundingClientRect(); return { cls: d.className.toString().slice(0, 24), t: (d.innerText || '').replace(/\s+/g, '').slice(0, 12), w: Math.round(r.width), h: Math.round(r.height) }; }) : [];
  return { has: !!cont, count: all.length, items: all.slice(0, 6), chips: document.querySelectorAll('#paper-ui .pu-choices button').length, opacity: cont ? getComputedStyle(cont).opacity : '' };
});
console.log(JSON.stringify(info).slice(0, 700));
await b.close();