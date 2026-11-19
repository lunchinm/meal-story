import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8123/?t=' + Date.now());
await p.waitForTimeout(4500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(7000);
let info = null;
for (let i = 0; i < 40; i += 1) {
  info = await p.evaluate(() => {
    const c = document.querySelector('#paper-chat .pc-send');
    if (!c) return null;
    const r = c.getBoundingClientRect();
    const st = getComputedStyle(c), par = getComputedStyle(c.parentElement);
    const under = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return { pe: st.pointerEvents, parentPe: par.pointerEvents, box: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, under: under ? under.className.toString().slice(0, 30) : 'null', text: c.textContent.slice(0, 10) };
  });
  if (info) break;
  await p.mouse.click(800, 700);
  await p.waitForTimeout(600);
}
console.log('strip:', JSON.stringify(info));
console.log('at(800,700):', await p.evaluate(() => { const e = document.elementFromPoint(800, 700); return e ? e.tagName + '.' + e.className.toString().slice(0, 40) : 'null'; }));
await b.close();