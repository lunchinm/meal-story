import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
const jsClick = (l) => p.evaluate((label) => {
  const el = [...document.querySelectorAll('button,div,span')].filter((e) => e.textContent.trim() === label);
  const t = el[el.length - 1]; if (t) (t.closest('button') ?? t).dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, l);
const t0 = Date.now();
await p.goto('http://127.0.0.1:8085/');
await p.waitForTimeout(2000);
await p.mouse.click(640, 360); await p.waitForTimeout(700);
await jsClick('简体中文'); await p.waitForTimeout(700);
await jsClick('开始游戏');
try {
  await p.waitForSelector('[class*="TextBox"]', { timeout: 45000 });
  console.log('进游戏耗时(ms):', Date.now() - t0);
} catch (e) { console.log('超时未进游戏'); }
await p.screenshot({ path: out + '/wg35-act1-1.png' });
for (let i = 0; i < 3; i += 1) { await p.mouse.click(640, 650); await p.waitForTimeout(2200); }
await p.screenshot({ path: out + '/wg35-act1-2.png' });
console.log('OK');
await b.close();