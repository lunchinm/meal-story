import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1.6 });
const p = await ctx.newPage();
p.on('response', (r) => { if (r.url().includes('chat_poster')) console.log('海报请求:', r.status()); });
await p.goto('https://lunchinm.github.io/meal-story/?t=' + Date.now(), { timeout: 120000, waitUntil: 'domcontentloaded' });
await p.waitForTimeout(7000);
await p.mouse.click(800, 420); await p.waitForTimeout(2500);
await p.evaluate(() => {
  const el = [...document.querySelectorAll('span,div')].filter((e) => e.children.length === 0 && e.textContent.trim() === '简体中文');
  if (el.length) el[el.length - 1].click();
});
await p.waitForTimeout(5000);
if (await p.evaluate(() => !!document.querySelector('#paper-title .pt-menu button'))) {
  await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
}
await p.waitForTimeout(8000);
for (let i = 0; i < 14; i += 1) {
  if (await p.evaluate(() => document.querySelectorAll('#paper-chat .pc-thumb').length)) break;
  await p.mouse.click(800, 340);
  await p.waitForTimeout(700);
}
await p.waitForTimeout(1500);
const info = await p.evaluate(() => {
  const im = document.querySelector('#paper-chat .pc-thumb img');
  if (!im) return 'no img';
  const r = im.getBoundingClientRect();
  const cs = getComputedStyle(im);
  return { src: im.getAttribute('src'), complete: im.complete, nw: im.naturalWidth, nh: im.naturalHeight, w: Math.round(r.width), h: Math.round(r.height), ar: cs.aspectRatio, obj: cs.objectFit };
});
console.log(JSON.stringify(info).slice(0, 300));
await p.screenshot({ path: out + '/live-thumb-' + Date.now() + '.png' });
await b.close();