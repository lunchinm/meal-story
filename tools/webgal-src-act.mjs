import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
p.on('console', (m) => { const t = m.text().replace(/%c/g,''); if (/编辑器同步|重置|解析场景|Error/.test(t)) console.log('C:', t.slice(0, 120)); });
const jsClick = (l) => p.evaluate((label) => {
  const el = [...document.querySelectorAll('button,div,span')].filter((e) => e.textContent.trim() === label);
  const t = el[el.length - 1]; if (t) (t.closest('button') ?? t).dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, l);
await p.goto('http://127.0.0.1:8082/?n=' + Date.now());
await p.waitForTimeout(2000);
await p.mouse.click(640, 360); await p.waitForTimeout(700);
await jsClick('简体中文'); await p.waitForTimeout(700);
await jsClick('开始游戏');
await p.waitForTimeout(8000);
console.log('state:', JSON.stringify(await p.evaluate(() => ({ box: !!document.querySelector('[class*="TextBox"]'), loading: !!document.querySelector('[class*="Loading"]') }))));
await p.screenshot({ path: 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out/wg36-src.png' });
await b.close();