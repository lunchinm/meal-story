import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8090/?t=' + Date.now());
await p.waitForTimeout(4000);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(7000);
let found = 0;
for (let i = 0; i < 220; i += 1) {
  const n = await p.evaluate(() => document.querySelectorAll('#paper-ui .pu-choices button').length);
  if (n) { found = n; console.log('第', i, '步出现选项，条数', n); break; }
  await p.mouse.click(800, 700);
  await p.waitForTimeout(380);
}
if (found) {
  const box = await p.evaluate(() => { const b = document.querySelector('#paper-ui .pu-choices button'); const r = b.getBoundingClientRect(); return { x: r.x + r.width/2, y: r.y + r.height/2, t: b.textContent.slice(0,10) }; });
  await p.screenshot({ path: out + '/choice-real-' + Date.now() + '.png' });
  const before = await p.evaluate(() => window.__paperLine || '');
  await p.mouse.click(box.x, box.y);
  await p.waitForTimeout(1600);
  const after = await p.evaluate(() => window.__paperLine || '');
  console.log('选项「' + box.t + '」点击后推进:', before !== after, '|', before.slice(0,10), '→', after.slice(0,10));
}
await b.close();