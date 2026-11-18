import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(7000);
for (let i = 0; i < 40; i += 1) {
  const chips = await p.evaluate(() => document.querySelectorAll('#paper-chat .pc-choices button').length);
  if (chips > 0) {
    await p.waitForTimeout(600);
    await p.screenshot({ path: out + '/chat-choice-' + Date.now() + '.png' });
    console.log('聊天选项条数:', chips);
    break;
  }
  await p.mouse.click(640, 300);
  await p.waitForTimeout(350);
}
await b.close();