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
  const out = [];
  document.querySelectorAll('div,span,p').forEach((el) => {
    const t = el.textContent.trim();
    if (t === '陆燃' || (t.length <= 4 && t.includes('陆') && el.getBoundingClientRect().height > 10)) {
      const r = el.getBoundingClientRect();
      out.push([el.tagName.toLowerCase(), el.className.toString().slice(0, 60), Math.round(r.x) + ',' + Math.round(r.y) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height), t].join(' | '));
    }
  });
  return out.slice(0, 6);
});
console.log(info.join('\n'));
await b.close();