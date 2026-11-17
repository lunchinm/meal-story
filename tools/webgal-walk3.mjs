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
for (let i = 0; i < 14; i += 1) { await p.keyboard.press('Space'); await p.waitForTimeout(600); }
await p.screenshot({ path: out + '/wg43-scene-' + Date.now() + '.png' });
let shot = false;
for (let i = 0; i < 60 && !shot; i += 1) {
  const isChoose = await p.evaluate(() => !!document.querySelector('[class*="Choose"]'));
  if (isChoose) { await p.waitForTimeout(500); await p.screenshot({ path: out + '/wg43-choose-' + Date.now() + '.png' }); console.log('选项在', i); shot = true; break; }
  await p.keyboard.press('Space');
  await p.waitForTimeout(700);
}
await b.close();