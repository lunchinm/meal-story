import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
let last = '';
for (let i = 0; i < 120; i += 1) {
  const st = await p.evaluate(() => ({
    line: window.__paperLine || '',
    chips: document.querySelectorAll('#paper-chat .pc-choices button, #paper-ui .pu-choices button').length,
    engineItems: document.querySelectorAll('[class*="_chooseContainer"] div').length,
    chat: getComputedStyle(document.getElementById('paper-chat')).display,
  }));
  if (st.chips > 0) {
    await p.evaluate(() => {
      const btn = document.querySelector('#paper-chat .pc-choices button, #paper-ui .pu-choices button');
      if (btn) btn.click();
    });
    await p.waitForTimeout(600);
    continue;
  }
  await p.mouse.click(640, 300);
  await p.waitForTimeout(300);
  const after = await p.evaluate(() => window.__paperLine || '');
  if (after === st.line && st.line) {
    console.log('卡住 @', i, '| 行:', JSON.stringify(st.line.slice(0, 26)), '| chat:', st.chat, '| engineItems:', st.engineItems);
    break;
  }
  last = after;
}
console.log('最后一行:', last.slice(0, 24));
await b.close();