import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block' });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8081/index.html');
await p.waitForTimeout(3000);
console.log('A:', (await p.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 120));
await p.mouse.click(640, 360);
await p.waitForTimeout(2000);
console.log('B:', (await p.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 160));
await p.screenshot({ path: 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out/wg-step1.png' });
const btn = p.getByText('开始游戏').first();
if (await btn.count()) { await btn.click({ force: true }); }
await p.waitForTimeout(2500);
console.log('C:', (await p.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 160));
await p.screenshot({ path: 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out/wg-step2.png' });
await b.close();