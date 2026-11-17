import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/');
await p.waitForTimeout(2500);
await p.mouse.click(640, 360); await p.waitForTimeout(800);
const jsClick = (l) => p.evaluate((label) => {
  const el = [...document.querySelectorAll('button,div,span')].filter((e) => e.textContent.trim() === label);
  const t = el[el.length - 1]; if (t) (t.closest('button') ?? t).dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, l);
await jsClick('简体中文'); await p.waitForTimeout(800);
await jsClick('开始游戏'); await p.waitForTimeout(7000);
const info = await p.evaluate(() => {
  const styleExists = !!document.getElementById('paper-ui-style');
  const btn = document.querySelector('[class*="_singleButton"]');
  const cs = btn ? getComputedStyle(btn) : null;
  const rules = [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules]; } catch (e) { return []; } })
    .filter((r) => (r.selectorText || '').includes('singleButton')).map((r) => r.cssText.slice(0, 80));
  return { styleExists, w: cs ? cs.width : null, flex: cs ? cs.flex : null, cls: btn ? btn.className.toString() : null, rules: rules.slice(0, 3) };
});
console.log(JSON.stringify(info, null, 1));
await b.close();