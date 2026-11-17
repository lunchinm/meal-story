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
await p.mouse.click(640, 360); await p.waitForTimeout(800);
await jsClick('简体中文'); await p.waitForTimeout(800);
await jsClick('开始游戏');
await p.waitForSelector('[class*="TextBox_Container"]', { timeout: 90000 });
await p.waitForTimeout(1200);
for (let i = 0; i < 3; i += 1) { await p.keyboard.press('Space'); await p.waitForTimeout(1200); }
await p.screenshot({ path: out + '/wg23-themed.png' });
console.log('ok');
await b.close();