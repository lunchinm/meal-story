import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
await p.evaluate(() => document.querySelector('#paper-ui .pu-tools button[data-label="选项"]').click());
await p.waitForTimeout(1500);
const info = await p.evaluate(() => {
  const out = [];
  document.querySelectorAll('div').forEach((e) => {
    const cs = getComputedStyle(e);
    const r = e.getBoundingClientRect();
    if (r.width * r.height < window.innerWidth * window.innerHeight * 0.5) return;
    if (cs.backgroundImage === 'none' && (cs.backgroundColor === 'rgba(0, 0, 0, 0)' || cs.backgroundColor === 'transparent')) return;
    out.push({ cls: e.className.toString().slice(0, 40), z: cs.zIndex, bg: cs.backgroundColor, img: cs.backgroundImage.slice(0, 40) });
  });
  return out.slice(0, 6);
});
console.log(JSON.stringify(info, null, 1).slice(0, 700));
await b.close();