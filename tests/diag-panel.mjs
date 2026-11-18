import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
const r = await p.evaluate(() => {
  const btn = document.querySelector('#paper-ui .pu-tools button[data-label="选项"]');
  const b = btn.getBoundingClientRect();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
});
await p.mouse.click(r.x, r.y);
await p.waitForTimeout(1500);
const info = await p.evaluate(() => {
  const nodes = [...document.querySelectorAll('div')].filter((e) => {
    const t = e.textContent || '';
    return t.includes('自动播放速度') && t.length < 400;
  }).slice(0, 3).map((e) => {
    const rr = e.getBoundingClientRect();
    return { cls: e.className.toString().slice(0, 50), w: Math.round(rr.width), h: Math.round(rr.height), bg: getComputedStyle(e).backgroundColor };
  });
  return nodes;
});
console.log(JSON.stringify(info, null, 1).slice(0, 700));
await p.screenshot({ path: 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out/panel-' + Date.now() + '.png' });
await b.close();