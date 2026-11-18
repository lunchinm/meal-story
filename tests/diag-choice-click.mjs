import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8090/?t=' + Date.now());
await p.waitForTimeout(4000);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(7000);
let found = false;
for (let i = 0; i < 80; i += 1) {
  const n = await p.evaluate(() => document.querySelectorAll('#paper-ui .pu-choices button').length);
  if (n > 0) { found = true; console.log('选项数:', n); break; }
  await p.mouse.click(800, 700);
  await p.waitForTimeout(400);
}
if (found) {
  const box = await p.evaluate(() => {
    const btn = document.querySelector('#paper-ui .pu-choices button');
    const r = btn.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: Math.round(r.width), h: Math.round(r.height), label: btn.textContent.slice(0, 12) };
  });
  console.log('第一个选项:', JSON.stringify(box));
  await p.screenshot({ path: out + '/choice-live-' + Date.now() + '.png' });
  const before = await p.evaluate(() => window.__paperLine || '');
  await p.mouse.click(box.x, box.y);
  await p.waitForTimeout(1500);
  const after = await p.evaluate(() => window.__paperLine || '');
  console.log('点击后剧情推进:', before !== after, '|', before.slice(0, 10), '→', after.slice(0, 10));
}
await b.close();