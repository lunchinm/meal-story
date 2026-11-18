import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8090/?t=' + Date.now());
await p.waitForTimeout(4000);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(7000);
for (let i = 0; i < 90; i += 1) {
  const st = await p.evaluate(() => ({
    chat: getComputedStyle(document.getElementById('paper-chat')).display,
    card: getComputedStyle(document.querySelector('#paper-ui .pu-card')).display,
    chip: !!document.querySelector('#paper-chat .pc-send'),
    line: (window.__paperLine || '').slice(0, 14),
  }));
  if (st.card !== 'none' && st.chat === 'none') { console.log('第', i, '步出现纸卡:', JSON.stringify(st)); break; }
  if (i % 10 === 0) console.log(i, JSON.stringify(st));
  if (st.chip) { await p.evaluate(() => { const c = document.querySelector('#paper-chat .pc-send'); if (c) c.click(); }); await p.waitForTimeout(300); }
  await p.mouse.click(800, 700);
  await p.waitForTimeout(420);
}
console.log('结束:', JSON.stringify(await p.evaluate(() => ({ chat: getComputedStyle(document.getElementById('paper-chat')).display, card: getComputedStyle(document.querySelector('#paper-ui .pu-card')).display, line: (window.__paperLine || '').slice(0, 16) }))));
await b.close();