import { chromium } from '@playwright/test';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const jsClick = (l) => p.evaluate((label) => {
  const el = [...document.querySelectorAll('button,div,span')].filter((e) => e.textContent.trim() === label);
  const t = el[el.length - 1]; if (t) (t.closest('button') ?? t).dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, l);
await p.goto('http://127.0.0.1:8083/');
await p.waitForTimeout(2500);
await p.mouse.click(640, 360);
await p.waitForTimeout(1000);
await jsClick('简体中文');
await p.waitForTimeout(1000);
await jsClick('开始游戏');
await p.waitForTimeout(2500);
await p.mouse.click(640, 400);   // 跳过 intro
await p.waitForTimeout(2500);
const t = await p.evaluate(() => (document.querySelector('[class*=TextBox]')?.innerText || '').slice(0, 40));
console.log('after intro + figure:', JSON.stringify(t));
await p.screenshot({ path: 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out/wg15-intro-fig.png' });
await b.close();