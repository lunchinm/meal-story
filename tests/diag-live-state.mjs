import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 90)));
await p.goto('https://lunchinm.github.io/meal-story/?t=' + Date.now(), { timeout: 120000, waitUntil: 'domcontentloaded' });
await p.waitForTimeout(7000);
await p.mouse.click(640, 360); await p.waitForTimeout(2500);
await p.evaluate(() => {
  const el = [...document.querySelectorAll('span,div')].filter((e) => e.children.length === 0 && e.textContent.trim() === '简体中文');
  if (el.length) el[el.length - 1].click();
});
await p.waitForTimeout(5000);
if (await p.evaluate(() => !!document.querySelector('#paper-title .pt-menu button'))) {
  await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
}
await p.waitForTimeout(8000);
const st1 = await p.evaluate(() => ({
  line: (window.__paperLine || '').slice(0, 20),
  chat: getComputedStyle(document.getElementById('paper-chat')).display,
  bubbles: document.querySelectorAll('#paper-chat .pc-bubble').length,
  card: getComputedStyle(document.querySelector('#paper-ui .pu-card')).display,
  title: getComputedStyle(document.getElementById('paper-title')).display,
}));
console.log('起始:', JSON.stringify(st1));
await p.mouse.click(640, 300); await p.waitForTimeout(900);
await p.keyboard.press('Space'); await p.waitForTimeout(900);
const st2 = await p.evaluate(() => ({ line: (window.__paperLine || '').slice(0, 20), bubbles: document.querySelectorAll('#paper-chat .pc-bubble').length }));
console.log('推进后:', JSON.stringify(st2));
console.log('错误:', errs.length ? errs.slice(0, 2).join(' | ') : 'none');
await p.screenshot({ path: out + '/live-state-' + Date.now() + '.png' });
await b.close();