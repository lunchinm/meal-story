import { chromium } from '@playwright/test';
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
for (let i = 0; i < 24; i += 1) { await p.keyboard.press('Space'); await p.waitForTimeout(450); }
await p.waitForTimeout(1200);
const m = await p.evaluate(() => {
  const cont = document.querySelector('[class*="TextBox_Container"]');
  const card = cont.children[0];
  const span = cont.querySelector('[class*="_outer_"]');
  const stage = document.querySelector('[class*="stage"], #stage') || document.body;
  const cs = getComputedStyle(stage);
  const r = (el) => { const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; };
  return {
    win: [innerWidth, innerHeight],
    stage: [stage.tagName, stage.className.toString().slice(0, 40), ...r(stage), cs.transform],
    card: r(card),
    cont: r(cont),
    spanFont: span ? getComputedStyle(span).fontSize : null,
    spanRect: span ? r(span) : null,
  };
});
console.log(JSON.stringify(m, null, 1));
await b.close();