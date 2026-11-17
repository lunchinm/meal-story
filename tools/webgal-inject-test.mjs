import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
const jsClick = (l) => p.evaluate((label) => {
  const el = [...document.querySelectorAll('button,div,span')].filter((e) => e.textContent.trim() === label);
  const t = el[el.length - 1]; if (t) (t.closest('button') ?? t).dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, l);
await p.goto('http://127.0.0.1:8082/?n=' + Date.now());
await p.waitForTimeout(2000);
await p.mouse.click(640, 360); await p.waitForTimeout(700);
await jsClick('简体中文'); await p.waitForTimeout(700);
await jsClick('开始游戏');
await p.waitForTimeout(5000);
for (let i = 0; i < 6; i += 1) { await p.mouse.click(640, 650); await p.waitForTimeout(1400); }
await p.evaluate(() => {
  const st = document.createElement('style');
  st.id = 'inject-test';
  st.textContent = '[class*="TextBox_Container"] span { color: #2f3a2f !important; font-size: 30px !important; -webkit-text-stroke: 0 !important; text-shadow: none !important; }';
  document.head.appendChild(st);
});
await p.waitForTimeout(800);
await p.screenshot({ path: out + '/wg38-inject.png' });
const c = await p.evaluate(() => {
  const s = [...document.querySelectorAll('[class*="TextBox_Container"] span')][3];
  return s ? { size: getComputedStyle(s).fontSize, color: getComputedStyle(s).color } : 'none';
});
console.log(JSON.stringify(c));
await b.close();