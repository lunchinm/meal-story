import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
for (let i = 0; i < 120; i += 1) {
  const n = await p.evaluate(() => document.querySelectorAll('[class*="hoose"]').length);
  const h = await p.evaluate(() => { const e = document.querySelector('[class*="hoose"]'); return e ? Math.round(e.getBoundingClientRect().height) : 0; });
  if (n > 0 && h > 60) {
    const info = await p.evaluate(() => {
      const c = document.querySelector('[class*="hoose"]');
      const r = c.getBoundingClientRect();
      const kids = [...c.querySelectorAll('*')].slice(0, 8).map((k) => k.className.toString().slice(0, 44) + '|' + Math.round(k.getBoundingClientRect().height));
      return { cls: c.className.toString(), rect: Math.round(r.x) + ',' + Math.round(r.y) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height), kids };
    });
    console.log(JSON.stringify(info, null, 1).slice(0, 800));
    break;
  }
  await p.mouse.click(640, 300);
  await p.waitForTimeout(280);
}
await b.close();