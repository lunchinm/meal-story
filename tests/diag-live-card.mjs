import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('https://lunchinm.github.io/meal-story/?t=' + Date.now(), { timeout: 120000, waitUntil: 'domcontentloaded' });
for (let i = 0; i < 40; i += 1) {
  if (await p.evaluate(() => { const t = document.getElementById('paper-title'); return t && getComputedStyle(t).display !== 'none' && document.querySelectorAll('#paper-title .pt-menu button').length >= 6; })) break;
  await p.waitForTimeout(500);
}
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(7000);
for (let i = 0; i < 70; i += 1) {
  const chatOn = await p.evaluate(() => getComputedStyle(document.getElementById('paper-chat')).display !== 'none');
  const cardOn = await p.evaluate(() => { const c = document.querySelector('#paper-ui .pu-card'); return c && getComputedStyle(c).display !== 'none'; });
  if (cardOn && !chatOn) break;
  const chips = await p.evaluate(() => document.querySelectorAll('#paper-chat .pc-choices button, #paper-ui .pu-choices button').length);
  if (chips) { await p.evaluate(() => { const x = document.querySelector('#paper-chat .pc-choices button, #paper-ui .pu-choices button'); if (x) x.click(); }); }
  else { await p.mouse.click(640, 300); }
  await p.waitForTimeout(600);
}
const st = await p.evaluate(() => ({ name: window.__paperName, text: (window.__paperLine || '').slice(0, 20), card: getComputedStyle(document.querySelector('#paper-ui .pu-card')).display }));
console.log(JSON.stringify(st));
await p.screenshot({ path: 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out/live-card-' + Date.now() + '.png' });
await b.close();