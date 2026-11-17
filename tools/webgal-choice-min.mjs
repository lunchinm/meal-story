import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
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
await p.waitForTimeout(4000);
await p.keyboard.press('Space'); await p.waitForTimeout(2000);
const st = await p.evaluate(() => {
  const els = [...document.querySelectorAll('[class*="hoose"]')];
  const info = els.map((e) => { const r = e.getBoundingClientRect(); return e.className.toString().slice(0,36) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' | ' + (e.textContent||'').trim().slice(0,20); });
  return info;
});
console.log(JSON.stringify(st, null, 1).slice(0, 700));
await p.screenshot({ path: out + '/wg52-choice-test-' + Date.now() + '.png' });
await b.close();