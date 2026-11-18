import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1.6 });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('页面错误:', e.message.slice(0, 80)));
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(3000);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(7000);
for (let i = 0; i < 8; i += 1) { await p.mouse.click(800, 340); await p.waitForTimeout(600); }
const st = await p.evaluate(() => ({
  bubbles: document.querySelectorAll('#paper-chat .pc-bubble').length,
  thumbs: document.querySelectorAll('#paper-chat .pc-thumb').length,
  chat: getComputedStyle(document.getElementById('paper-chat')).display,
}));
console.log('大屏/高 DPI 状态:', JSON.stringify(st));
await p.screenshot({ path: 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out/bigscreen-' + Date.now() + '.png' });
await b.close();