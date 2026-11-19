import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('ERR', e.message.slice(0, 140)));
await p.goto('http://127.0.0.1:8123/?t=' + Date.now());
await p.waitForTimeout(4000);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(7000);
for (let i = 0; i < 40; i += 1) {
  if (await p.evaluate(() => !!document.querySelector('#paper-chat .pc-send'))) break;
  await p.mouse.click(800, 700);
  await p.waitForTimeout(600);
}
console.log('delegated:', await p.evaluate(() => document.getElementById('paper-chat').dataset.sendDelegated));
console.log('panels:', await p.evaluate(() => document.querySelectorAll('#paper-chat').length));
await p.evaluate(() => document.querySelector('#paper-chat .pc-send').click());
await p.waitForTimeout(1500);
console.log('after js click:', JSON.stringify(await p.evaluate(() => ({ strip: !!document.querySelector('#paper-chat .pc-send'), me: document.querySelectorAll('#paper-chat .pc-row.me').length, line: (window.__paperLine||'').slice(0,10) }))));
await b.close();