import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/');
await p.waitForTimeout(3200);
await p.mouse.click(640, 360);
await p.waitForTimeout(1800);
await p.getByText('简体中文').last().click({ force: true });
await p.waitForTimeout(2000);
await p.getByText('开始游戏').last().click({ force: true });
await p.waitForTimeout(2500);
await p.screenshot({ path: out + '/wg4-line1.png' });
// 连点推进
for (let i = 0; i < 5; i += 1) { await p.mouse.click(640, 420); await p.waitForTimeout(700); }
await p.screenshot({ path: out + '/wg4-line2.png' });
console.log('tail:', (await p.locator('body').innerText()).replace(/\s+/g, ' ').slice(-100));
await b.close();