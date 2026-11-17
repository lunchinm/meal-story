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
let shot = 0;
for (let i = 0; i < 40; i += 1) {
  const st = await p.evaluate(() => {
    const t = document.querySelector('[class*="_text_"]');
    const choose = document.querySelector('[class*="Choose"]');
    return { txt: t ? t.innerText.replace(/\s+/g, '').slice(0, 18) : '', choose: !!choose };
  });
  if (st.choose) { await p.screenshot({ path: out + '/wg41-choose-' + Date.now() + '.png' }); console.log('选项出现于第', i, '步'); break; }
  if (st.txt.length >= 8 && shot === 0) { await p.screenshot({ path: out + '/wg41-scene-' + Date.now() + '.png' }); shot = 1; console.log('场景截图:', st.txt); }
  await p.mouse.click(640, 650);
  await p.waitForTimeout(900);
}
await b.close();