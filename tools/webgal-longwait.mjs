import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const jsClick = (l) => p.evaluate((label) => {
  const el = [...document.querySelectorAll('button,div,span')].filter((e) => e.textContent.trim() === label);
  const t = el[el.length - 1]; if (t) (t.closest('button') ?? t).dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, l);
await p.goto('http://127.0.0.1:8083/');
await p.waitForTimeout(2200);
await p.mouse.click(640, 360); await p.waitForTimeout(900);
await jsClick('简体中文'); await p.waitForTimeout(900);
await jsClick('开始游戏');
for (let i = 0; i < 12; i += 1) {
  await p.waitForTimeout(5000);
  const st = await p.evaluate(() => ({ box: !!document.querySelector('[class*="TextBox"]'), loading: !!document.querySelector('[class*="Loading"]') }));
  console.log(i * 5 + 's', JSON.stringify(st));
  if (st.box) break;
}
await p.screenshot({ path: out + '/wg27-final-check.png' });
await b.close();