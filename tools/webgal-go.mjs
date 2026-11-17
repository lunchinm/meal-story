import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8081/index.html');
await p.waitForTimeout(3500);
const clickText = async (t) => p.evaluate((label) => {
  const el = [...document.querySelectorAll('button,div,span')]
    .filter((e) => e.textContent.trim() === label && e.offsetParent !== null)
    .pop();
  if (el) { (el.closest('button') ?? el).click(); return true; } return false;
}, t);
console.log('splash', await clickText('PRESS THE SCREEN TO START'));
await p.waitForTimeout(2500);
console.log('start', await clickText('开始游戏'));
await p.waitForTimeout(3000);
await p.screenshot({ path: out + '/wg-scene.png' });
console.log('body:', (await p.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 120));
await b.close();