import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
for (let i = 0; i < 92; i += 1) {
  const pick = await p.evaluate(() => {
    const el = document.querySelector('[class*="_Choose_item_outer"]');
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  });
  if (pick) { await p.mouse.click(pick.x, pick.y); await p.waitForTimeout(450); continue; }
  await p.mouse.click(640, 300);
  await p.waitForTimeout(250);
}
const chain = await p.evaluate(() => {
  const items = [...document.querySelectorAll('div')].filter((e) => {
    const r = e.getBoundingClientRect();
    return r.width > 100 && r.width < 400 && r.height > 40 && /先看/.test(e.textContent || '') && (e.textContent || '').length < 20;
  });
  const el = items[0];
  if (!el) return 'no item';
  const out = [];
  let cur = el;
  for (let i = 0; i < 6 && cur; i += 1) {
    const r = cur.getBoundingClientRect();
    const cs = getComputedStyle(cur);
    out.push(cur.tagName.toLowerCase() + '.' + cur.className.toString().slice(0, 34) + ' | ' + Math.round(r.x) + ',' + Math.round(r.y) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' | tf=' + cs.transform.slice(0, 40) + ' | pos=' + cs.position);
    cur = cur.parentElement;
  }
  return out.join('\n');
});
console.log(chain);
await b.close();