import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('ERR', e.message.slice(0, 160)));
await p.goto('http://127.0.0.1:8082/');
await p.waitForTimeout(3500);
const clickText = async (label) => p.evaluate((l) => {
  const els = [...document.querySelectorAll('button,div,span')]
    .filter((e) => e.textContent.trim() === l && e.offsetParent !== null);
  const el = els[els.length - 1];
  if (el) { (el.closest('button') ?? el).click(); return true; } return false;
}, label);
console.log('splash', await clickText('PRESS THE SCREEN TO START'));
await p.waitForTimeout(2500);
await p.screenshot({ path: out + '/wg2-title.png' });
console.log('start', await clickText('开始游戏'));
await p.waitForTimeout(2500);
await p.screenshot({ path: out + '/wg2-dialog.png' });
console.log('text:', (await p.locator('body').innerText()).replace(/\s+/g, ' ').slice(-90));
// 推进几句
for (let i = 0; i < 6; i += 1) { await p.mouse.click(640, 400); await p.waitForTimeout(600); }
await p.screenshot({ path: out + '/wg2-dialog2.png' });
console.log('text2:', (await p.locator('body').innerText()).replace(/\s+/g, ' ').slice(-90));
await b.close();