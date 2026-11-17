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
let sceneShot = false, chooseShot = false;
for (let i = 0; i < 60; i += 1) {
  const st = await p.evaluate(() => {
    const t = document.querySelector('[class*="_text_"]');
    const choose = !!document.querySelector('[class*="Choose"]');
    return { txt: t ? t.textContent.replace(/\s+/g, '').slice(0, 16) : '', choose };
  });
  if (st.choose && !chooseShot) { await p.screenshot({ path: out + '/wg42-choose-' + Date.now() + '.png' }); chooseShot = true; console.log('选项:', i); }
  if (!sceneShot && st.txt.length >= 8 && !st.choose) { await p.screenshot({ path: out + '/wg42-scene-' + Date.now() + '.png' }); sceneShot = true; console.log('场景:', st.txt, '@', i); }
  if (sceneShot && chooseShot) break;
  await p.keyboard.press('Space');
  await p.waitForTimeout(700);
}
await b.close();