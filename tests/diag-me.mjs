import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8090/?t=' + Date.now());
await p.waitForTimeout(4000);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(7000);
const info = await p.evaluate(() => ({ hasChatTexts: typeof CHAT_TEXTS !== 'undefined' ? Object.keys(CHAT_TEXTS).length : -1, hasMy: typeof MY_TEXTS !== 'undefined' ? Object.keys(MY_TEXTS).length : -1, sampleMy: typeof MY_TEXTS !== 'undefined' ? Object.keys(MY_TEXTS).slice(0, 3) : [] }));
console.log(JSON.stringify(info).slice(0, 300));
for (let i = 0; i < 20; i += 1) {
  const st = await p.evaluate(() => ({ name: window.__paperName, text: window.__paperLine || '', me: !!document.querySelector('#paper-chat .pc-row.me') }));
  if (st.me) { console.log('找到 me 行:', JSON.stringify(st).slice(0, 120)); break; }
  if (i === 19) console.log('20 步内没有 me，当前:', JSON.stringify(st).slice(0, 120));
  await p.mouse.click(800, 700);
  await p.waitForTimeout(600);
}
await b.close();