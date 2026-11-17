import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
p.on('console', (m) => { const t = m.text().replace(/%c/g,''); if (/场景|scene|错误|Error|WARN|失败/.test(t)) console.log('C:', t.slice(0, 170)); });
p.on('response', (r) => { if (r.status() >= 400) console.log('HTTP', r.status(), r.url().slice(-55)); });
const jsClick = (l) => p.evaluate((label) => {
  const el = [...document.querySelectorAll('button,div,span')].filter((e) => e.textContent.trim() === label);
  const t = el[el.length - 1]; if (t) (t.closest('button') ?? t).dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, l);
await p.goto('http://127.0.0.1:8085/');
await p.waitForTimeout(2000);
await p.mouse.click(640, 360); await p.waitForTimeout(700);
await jsClick('简体中文'); await p.waitForTimeout(700);
await jsClick('开始游戏');
await p.waitForTimeout(12000);
console.log('state:', JSON.stringify(await p.evaluate(() => ({ box: !!document.querySelector('[class*="TextBox"]'), loading: !!document.querySelector('[class*="Loading"]') }))));
await b.close();