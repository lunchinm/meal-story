import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/');
await p.waitForTimeout(3500);
await p.mouse.click(640, 360);                 // splash
await p.waitForTimeout(2000);
// 语言选择：点“简体中文”
await p.getByText('简体中文').last().click({ force: true });
await p.waitForTimeout(2500);
await p.screenshot({ path: out + '/wg3-title.png' });
// 开始游戏
const startBtn = p.getByText('开始游戏').last();
await startBtn.click({ force: true });
await p.waitForTimeout(3000);
await p.screenshot({ path: out + '/wg3-scene.png' });
const t1 = (await p.locator('body').innerText()).replace(/\s+/g, ' ');
console.log('scene text tail:', t1.slice(-120));
await p.mouse.click(640, 400);
await p.waitForTimeout(1200);
await p.screenshot({ path: out + '/wg3-scene2.png' });
await b.close();