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
for (let i = 0; i < 13; i += 1) { await p.keyboard.press('Space'); await p.waitForTimeout(600); }
await p.waitForTimeout(1500);
const info = await p.evaluate(() => {
  const cont = document.querySelector('[class*="TextBox_Container"]');
  const spans = [...cont.querySelectorAll('span')].filter((s) => s.textContent.trim() && s.getBoundingClientRect().width > 0);
  const s = spans[0];
  const card = cont.querySelector('div');
  return {
    n: spans.length,
    size: s ? getComputedStyle(s).fontSize : null,
    color: s ? getComputedStyle(s).color : null,
    text: spans.map((x) => x.textContent).join('').slice(0, 20),
    cardBg: card ? getComputedStyle(card).backgroundColor : null,
  };
});
console.log(JSON.stringify(info));
await p.screenshot({ path: out + '/wg44-cream-' + Date.now() + '.png' });
await b.close();