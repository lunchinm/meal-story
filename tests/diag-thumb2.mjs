import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('页面错误:', e.message.slice(0, 120)));
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
for (let i = 0; i < 20; i += 1) {
  const line = await p.evaluate(() => window.__paperLine || '');
  const isKey = await p.evaluate((t) => !!(window.__chatImages && window.__chatImages[t]), line);
  if (isKey) {
    await p.waitForTimeout(700);
    const dump = await p.evaluate(() => ({
      thumbs: document.querySelectorAll('.pc-thumb').length,
      chatDisplay: getComputedStyle(document.getElementById('paper-chat')).display,
      tail: document.querySelector('#paper-chat .pc-body') ? document.querySelector('#paper-chat .pc-body').innerHTML.slice(-260) : 'no body',
    }));
    console.log(JSON.stringify(dump).slice(0, 420));
    break;
  }
  await p.mouse.click(640, 300);
  await p.waitForTimeout(650);
}
await b.close();