import { chromium } from '@playwright/test';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const jsClick = (l) => p.evaluate((label) => {
  const el = [...document.querySelectorAll('button,div,span')].filter((e) => e.textContent.trim() === label);
  const t = el[el.length - 1]; if (t) (t.closest('button') ?? t).dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, l);
await p.goto('http://127.0.0.1:8083/');
await p.waitForTimeout(2200);
await p.mouse.click(640, 360); await p.waitForTimeout(700);
await jsClick('简体中文'); await p.waitForTimeout(700);
await jsClick('开始游戏'); await p.waitForTimeout(2500);
await p.keyboard.press('Space'); await p.waitForTimeout(1000);
await p.keyboard.press('Space'); await p.waitForTimeout(1500);
const cls = await p.evaluate(() => [...document.querySelectorAll('[class]')]
  .map((e) => e.className.toString())
  .filter((c) => /TextBox|text_|name|Name/.test(c))
  .slice(0, 20));
console.log(JSON.stringify(cls, null, 1));
await b.close();