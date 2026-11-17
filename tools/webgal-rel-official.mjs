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
await p.waitForTimeout(1200);
await jsClick('简体中文');
await p.waitForTimeout(1200);
await jsClick('开始游戏');
await p.waitForTimeout(4000);
const info = await p.evaluate(() => ({ textbox: !!document.querySelector('[class*=TextBox]'), text: (document.querySelector('[class*=TextBox]')?.innerText || '').slice(0, 30) }));
console.log('official figure in release:', JSON.stringify(info));
await b.close();