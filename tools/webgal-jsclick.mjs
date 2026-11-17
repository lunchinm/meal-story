import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/');
await p.waitForTimeout(3000);
await p.mouse.click(640, 360);
await p.waitForTimeout(1200);
const jsClick = (label) => p.evaluate((l) => {
  const el = [...document.querySelectorAll('button,div,span,a')]
    .filter((e) => e.textContent.trim() === l);
  const last = el[el.length - 1];
  if (!last) return 'miss:' + l;
  const target = last.closest('button') ?? last;
  target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  return 'ok:' + l;
}, label);
console.log(await jsClick('简体中文'));
await p.waitForTimeout(1800);
console.log(await jsClick('开始游戏'));
await p.waitForTimeout(3500);
await p.screenshot({ path: out + '/wg7.png' });
const t = (await p.locator('body').innerText()).replace(/\s+/g, ' ');
console.log('isTitle:', t.includes('退出游戏'), '| len:', t.length);
console.log('tail:', t.slice(-100));
await b.close();