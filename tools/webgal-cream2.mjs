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
await p.waitForTimeout(6000);
let best = '';
for (let i = 0; i < 40; i += 1) {
  await p.keyboard.press('Space');
  await p.waitForTimeout(700);
  const txt = await p.evaluate(() => {
    const c = document.querySelector('[class*="TextBox_Container"]');
    return c ? [...c.querySelectorAll('span')].map((s) => s.textContent).join('').replace(/\s+/g, '') : '';
  });
  if (txt.length > best.length) best = txt;
  if (txt.length >= 24) break;
}
await p.waitForTimeout(1200);
await p.screenshot({ path: out + '/wg45-cream2-' + Date.now() + '.png' });
console.log('len', best.length, best.slice(0, 30));
await b.close();