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
const hits = await p.evaluate(() => {
  const want = ['标题', '返回', '存档', '读档', '流程图'];
  const out = [];
  document.querySelectorAll('*').forEach((e) => {
    if (e.children.length) return;
    const t = (e.textContent || '').trim();
    if (want.indexOf(t) < 0) return;
    const r = e.getBoundingClientRect();
    if (r.width < 5) return;
    out.push({ t, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) });
  });
  return out;
});
console.log(JSON.stringify(hits).slice(0, 600));
await b.close();