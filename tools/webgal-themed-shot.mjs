import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const jsClick = (l) => p.evaluate((label) => {
  const el = [...document.querySelectorAll('button,div,span')].filter((e) => e.textContent.trim() === label);
  const t = el[el.length - 1]; if (t) (t.closest('button') ?? t).dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, l);
await p.goto('http://127.0.0.1:8083/');
await p.waitForTimeout(2000);
await p.mouse.click(640, 360); await p.waitForTimeout(700);
await jsClick('简体中文'); await p.waitForTimeout(700);
await jsClick('开始游戏');
// 等到文本框出现（加载可能十几秒）
await p.waitForSelector('[class*="TextBox_Container"]', { timeout: 60000 });
await p.waitForTimeout(1500);
for (let i = 0; i < 3; i += 1) { await p.keyboard.press('Space'); await p.waitForTimeout(1200); }
await p.screenshot({ path: out + '/wg22-themed.png' });
const t = await p.evaluate(() => (document.querySelector('[class*="TextBox_Container"]')?.innerText || '').replace(/\s+/g, '').slice(0, 24));
console.log('line:', t);
await b.close();