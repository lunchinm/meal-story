import { chromium } from '@playwright/test';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const jsClick = (l) => p.evaluate((label) => {
  const el = [...document.querySelectorAll('button,div,span')].filter((e) => e.textContent.trim() === label);
  const t = el[el.length - 1]; if (t) (t.closest('button') ?? t).dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, l);
await p.goto('http://127.0.0.1:8083/');
await p.waitForTimeout(2200);
await p.mouse.click(640, 360);
await p.waitForTimeout(700);
await jsClick('简体中文');
await p.waitForTimeout(700);
await jsClick('开始游戏');
await p.waitForTimeout(2500);
await p.keyboard.press('Space'); await p.waitForTimeout(1200);
await p.keyboard.press('Space'); await p.waitForTimeout(1200);
const dump = await p.evaluate(() => {
  const box = document.querySelector('[class*=TextBox]');
  if (!box) return 'no textbox';
  const walk = (el, depth = 0) => {
    let out = ' '.repeat(depth) + el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ').slice(0, 3).join('.') + '\n';
    if (depth < 3) [...el.children].slice(0, 6).forEach((c) => { out += walk(c, depth + 1); });
    return out;
  };
  return walk(box);
});
console.log(dump);
await b.close();