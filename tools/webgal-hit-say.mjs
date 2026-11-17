import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
const jsClick = (l) => p.evaluate((label) => {
  const el = [...document.querySelectorAll('button,div,span')].filter((e) => e.textContent.trim() === label);
  const t = el[el.length - 1]; if (t) (t.closest('button') ?? t).dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, l);
const cur = () => p.evaluate(() => {
  const t = document.querySelector('[class*="_text_"]');
  return t ? t.innerText.replace(/\s+/g, '').slice(0, 24) : '';
});
await p.goto('http://127.0.0.1:8082/');
await p.waitForTimeout(2000);
await p.mouse.click(640, 360); await p.waitForTimeout(700);
await jsClick('简体中文'); await p.waitForTimeout(700);
await jsClick('开始游戏');
await p.waitForTimeout(4500);
for (let i = 0; i < 25; i += 1) {
  const t = await cur();
  if (t.length >= 4) { console.log('命中第', i, '次:', t); break; }
  await p.mouse.click(640, 650);
  await p.waitForTimeout(1100);
}
await p.screenshot({ path: out + '/wg40-' + Date.now() + '.png' });
await b.close();