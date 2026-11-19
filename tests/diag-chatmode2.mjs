import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8123/?t=' + Date.now());
await p.waitForTimeout(4000);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
for (let i = 0; i < 8; i += 1) {
  const st = await p.evaluate(() => ({ t: (window.__paperLine || '').slice(0, 14), chat: document.body.classList.contains('paper-chat-mode') }));
  console.log(i, st.chat ? '群聊' : '文本框', '|', st.t);
  await p.mouse.click(400, 700);
  await p.waitForTimeout(800);
}
await b.close();