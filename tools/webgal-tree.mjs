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
await p.keyboard.press('Space'); await p.waitForTimeout(1800);
const dump = await p.evaluate(() => {
  const box = document.querySelector('[class*="TextBox_Container"]');
  const out = [];
  const walk = (el, d) => {
    out.push('  '.repeat(d) + el.tagName.toLowerCase() + ' .' + el.className.toString().split(' ').join('.') + ' | "' + (el.children.length === 0 ? el.textContent.slice(0, 10) : '') + '"');
    if (d < 4) [...el.children].forEach((c) => walk(c, d + 1));
  };
  if (box) walk(box, 0);
  return out.slice(0, 26).join('\n');
});
console.log(dump);
await b.close();