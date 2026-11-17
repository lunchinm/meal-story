import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/');
await p.waitForTimeout(3000);
await p.mouse.click(640, 360);
await p.waitForTimeout(1500);
await p.getByText('简体中文').last().click({ force: true });
await p.waitForTimeout(1800);
await p.mouse.click(120, 178);   // 开始游戏 的坐标
await p.waitForTimeout(3500);
await p.screenshot({ path: out + '/wg5-scene.png' });
const txt = (await p.locator('body').innerText()).replace(/\s+/g, ' ');
console.log('isTitle:', txt.includes('退出游戏'), '| tail:', txt.slice(-80));
await b.close();