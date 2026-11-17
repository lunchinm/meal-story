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
for (let i = 0; i < 95; i += 1) {
  const vis = await p.evaluate(() => {
    const els = [...document.querySelectorAll('[class*="hoose"]')];
    return els.some((e) => { const r = e.getBoundingClientRect(); return r.height > 80; });
  });
  if (vis) {
    await p.waitForTimeout(2600);
    const info = await p.evaluate(() => {
      const c = [...document.querySelectorAll('[class*="hoose"]')].find((e) => e.getBoundingClientRect().height > 80);
      const r = c.getBoundingClientRect();
      return { rect: Math.round(r.x) + ',' + Math.round(r.y) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height), opacity: getComputedStyle(c).opacity, cls: c.className.toString() };
    });
    console.log('choice @', i, JSON.stringify(info));
    await p.screenshot({ path: out + '/wg49-choice-' + Date.now() + '.png' });
    break;
  }
  await p.keyboard.press('Space');
  await p.waitForTimeout(550);
}
await b.close();