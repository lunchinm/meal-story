import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
const jsClick = (l) => p.evaluate((label) => {
  const el = [...document.querySelectorAll('button,div,span')].filter((e) => e.textContent.trim() === label);
  const t = el[el.length - 1]; if (t) (t.closest('button') ?? t).dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, l);
await p.goto('http://127.0.0.1:8082/');
await p.waitForTimeout(2000);
await p.mouse.click(640, 360); await p.waitForTimeout(700);
await jsClick('简体中文'); await p.waitForTimeout(700);
await jsClick('开始游戏');
await p.waitForTimeout(6000);
for (let i = 0; i < 24; i += 1) { await p.keyboard.press('Space'); await p.waitForTimeout(450); }
await p.waitForTimeout(1200);
const info = await p.evaluate(() => {
  const cont = document.querySelector('[class*="TextBox_Container"]');
  const textEl = cont.querySelector('[class*="_text_"]');
  const firstSpans = [...textEl.querySelectorAll('span')].slice(0, 6).map((s) => ({
    cls: s.className.toString().slice(0, 40),
    text: s.textContent.slice(0, 4),
    kids: [...s.children].map((k) => k.className.toString().slice(0, 30) + ':' + k.textContent.slice(0, 2)),
  }));
  return { textElText: textEl.textContent.slice(0, 30), firstSpans };
});
console.log(JSON.stringify(info, null, 1).slice(0, 1400));
await b.close();