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
await p.waitForTimeout(5000);
for (let i = 0; i < 6; i += 1) { await p.mouse.click(640, 650); await p.waitForTimeout(1500); }
const st = await p.evaluate(() => {
  const hasStyle = !!document.getElementById('paper-theme');
  const spans = [...document.querySelectorAll('[class*="TextBox_Container"] span')];
  const s = spans[3];
  return { hasStyle, count: spans.length, size: s ? getComputedStyle(s).fontSize : null, color: s ? getComputedStyle(s).color : null };
});
console.log(JSON.stringify(st));
await p.screenshot({ path: out + '/wg39-final-' + Date.now() + '.png' });
await b.close();