import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8123/?t=' + Date.now());
await p.waitForTimeout(4000);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
for (let i = 0; i < 4; i += 1) {
  const st = await p.evaluate(() => ({
    line: window.__paperLine || '',
    id: (window.__wgGetVar && window.__wgGetVar('line')) || 'none',
    chatMode: document.body.classList.contains('paper-chat-mode'),
    chatDisplay: document.getElementById('paper-chat') ? getComputedStyle(document.getElementById('paper-chat')).display : 'no-panel',
  }));
  console.log(i, JSON.stringify(st).slice(0, 150));
  await p.mouse.click(800, 700);
  await p.waitForTimeout(900);
}
await b.close();