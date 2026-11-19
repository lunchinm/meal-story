import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('ERR', e.message.slice(0, 120)));
await p.goto('http://127.0.0.1:8123/?t=' + Date.now());
await p.waitForTimeout(4500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(7000);
for (let i = 0; i < 40; i += 1) {
  if (await p.evaluate(() => !!document.querySelector('#paper-chat .pc-send'))) break;
  await p.mouse.click(800, 700);
  await p.waitForTimeout(600);
}
const before = await p.evaluate(() => ({ line: window.__paperLine || '', bubbles: document.querySelectorAll('#paper-chat .pc-row').length }));
const box = await p.evaluate(() => { const c = document.querySelector('#paper-chat .pc-send'); const r = c.getBoundingClientRect(); return { x: r.x + r.width/2, y: r.y + r.height/2 }; });
await p.mouse.click(box.x, box.y);
await p.waitForTimeout(2000);
const after = await p.evaluate(() => ({ line: window.__paperLine || '', strip: !!document.querySelector('#paper-chat .pc-send'), bubbles: document.querySelectorAll('#paper-chat .pc-row').length, me: document.querySelectorAll('#paper-chat .pc-row.me').length }));
console.log('before:', JSON.stringify(before).slice(0, 120));
console.log('after :', JSON.stringify(after).slice(0, 160));
await b.close();