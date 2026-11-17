import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', (e) => console.log('ERR', e.message.slice(0, 200)));
await p.goto('http://127.0.0.1:8080/index.html');
await p.waitForTimeout(3000);
await p.mouse.click(720, 450);          // PRESS THE SCREEN TO START
await p.waitForTimeout(2500);
await p.screenshot({ path: out + '/webgal-title.png' });
console.log('title ok');
const items = await p.locator('text=开始游戏').count();
console.log('开始游戏 count', items);
if (items) {
  await p.locator('text=开始游戏').first().click({ force: true });
} else {
  await p.mouse.click(720, 620);
}
await p.waitForTimeout(3500);
await p.screenshot({ path: out + '/webgal-dialog.png' });
console.log('dialog ok');
await p.mouse.click(720, 700);
await p.waitForTimeout(1200);
await p.screenshot({ path: out + '/webgal-dialog2.png' });
await b.close();