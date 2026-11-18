import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1.6 });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 80)));
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
const st = await p.evaluate(() => ({
  bubbles: document.querySelectorAll('#paper-chat .pc-bubble').length,
  thumbs: document.querySelectorAll('#paper-chat .pc-thumb').length,
  first: (document.querySelector('#paper-chat .pc-bubble') || {}).textContent || '',
}));
console.log('线上:', JSON.stringify(st), '| 错误:', errs.length ? errs[0] : 'none');
await p.screenshot({ path: out + '/live-ok-' + Date.now() + '.png' });
const r = await p.evaluate(() => { const t = document.querySelector('#paper-chat .pc-thumb'); if (!t) return null; const b = t.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; });
if (r) {
  await p.mouse.click(r.x, r.y); await p.waitForTimeout(800);
  const open = await p.evaluate(() => document.getElementById('paper-viewer').classList.contains('open'));
  await p.mouse.click(60, 60); await p.waitForTimeout(500);
  const closed = await p.evaluate(() => !document.getElementById('paper-viewer').classList.contains('open'));
  console.log('大图:', open, '| 点空白关闭:', closed);
}
await b.close();