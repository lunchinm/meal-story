import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
for (let i = 0; i < 30; i += 1) {
  const isMili = await p.evaluate(() => (window.__paperName || '').includes('米粒'));
  if (isMili) break;
  await p.mouse.click(640, 300);
  await p.waitForTimeout(400);
}
await p.waitForTimeout(800);
await p.screenshot({ path: out + '/fig-new-' + Date.now() + '.png' });
console.log('名字:', await p.evaluate(() => window.__paperName || ''));
await b.close();