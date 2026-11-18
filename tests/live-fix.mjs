import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1.6 });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(e.message.slice(0, 90)));
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
let thumbs = 0;
for (let i = 0; i < 16; i += 1) {
  thumbs = await p.evaluate(() => document.querySelectorAll('#paper-chat .pc-thumb').length);
  if (thumbs) break;
  await p.mouse.click(800, 340);
  await p.waitForTimeout(700);
}
const st = await p.evaluate(() => ({
  bubbles: document.querySelectorAll('#paper-chat .pc-bubble').length,
  thumbs: document.querySelectorAll('#paper-chat .pc-thumb').length,
  chat: getComputedStyle(document.getElementById('paper-chat')).display,
  ver: (document.querySelector('script[src*="theme-inject"]') || {}).src || '',
}));
console.log('线上状态:', JSON.stringify(st));
console.log('页面错误:', errs.length ? errs.slice(0, 2).join(' | ') : 'none');
await p.screenshot({ path: 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out/live-fix-' + Date.now() + '.png' });
await b.close();