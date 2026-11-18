import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
for (let i = 0; i < 4; i += 1) { await p.mouse.click(640, 300); await p.waitForTimeout(800); }
const tree = await p.evaluate(() => {
  const box = document.querySelector('#textBoxMain');
  const rows = [];
  box.querySelectorAll('*').forEach((e) => {
    if (e.children.length) return;
    const t = (e.textContent || '').trim();
    if (!t) return;
    const r = e.getBoundingClientRect();
    rows.push([e.className.toString(), t, Math.round(r.top), Math.round(r.left)]);
  });
  return rows.slice(0, 20);
});
console.log(JSON.stringify(tree, null, 0).slice(0, 1200));
await b.close();