import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(7000);
for (let i = 0; i < 8; i += 1) { await p.mouse.click(640, 300); await p.waitForTimeout(500); }
await p.waitForTimeout(600);
const st = await p.evaluate(() => ({
  chatShown: getComputedStyle(document.getElementById('paper-chat')).display,
  bubbles: document.querySelectorAll('#paper-chat .pc-bubble').length,
  cardShown: getComputedStyle(document.querySelector('#paper-ui .pu-card')).display,
}));
console.log(JSON.stringify(st));
await p.screenshot({ path: out + '/chat-' + Date.now() + '.png' });
await b.close();