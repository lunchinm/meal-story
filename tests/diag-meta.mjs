import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('ERR', e.message.slice(0, 100)));
await p.goto('http://127.0.0.1:8090/?t=' + Date.now());
await p.waitForTimeout(4000);
console.log('meta keys:', await p.evaluate(() => window.__LINE_META ? Object.keys(window.__LINE_META).length : -1));
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(7000);
for (let i = 0; i < 5; i += 1) {
  const st = await p.evaluate(() => {
    const n = window.__paperName || '', t = window.__paperLine || '';
    const m = window.__LINE_META ? window.__LINE_META[n + '|' + t] : null;
    return { n, t: t.slice(0, 14), meta: m, chat: getComputedStyle(document.getElementById('paper-chat')).display };
  });
  console.log(JSON.stringify(st).slice(0, 150));
  await p.mouse.click(800, 700);
  await p.waitForTimeout(700);
}
await b.close();