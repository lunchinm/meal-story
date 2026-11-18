import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('https://lunchinm.github.io/meal-story/?t=' + Date.now());
await p.waitForTimeout(4000);
await p.mouse.click(640, 360); await p.waitForTimeout(1200);
await p.evaluate(() => {
  const el = [...document.querySelectorAll('span,div')].filter((e) => e.children.length === 0 && e.textContent.trim() === '简体中文');
  if (el.length) el[el.length - 1].click();
});
await p.waitForTimeout(4000);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(7000);
for (let i = 0; i < 26; i += 1) { await p.mouse.click(640, 300); await p.waitForTimeout(260); }
const info = await p.evaluate(() => {
  const cont = document.querySelector('[class*="TextBox_Container"]');
  const card = document.querySelector('#paper-ui .pu-card');
  const cardTop = card ? Math.round(card.getBoundingClientRect().top) : -1;
  const rows = [];
  cont.querySelectorAll('*').forEach((el) => {
    if (el.children.length) return;
    const t = (el.textContent || '').trim();
    if (!t || t.length > 2) return;
    const cs = getComputedStyle(el);
    const isFill = cs.backgroundImage && cs.backgroundImage !== 'none';
    if (!isFill) return;
    const r = el.getBoundingClientRect();
    rows.push({ t, top: Math.round(r.top), cls: el.className.toString().slice(0, 20), parentCls: el.parentElement.className.toString().slice(0, 24) });
  });
  return { cardTop, first: rows.slice(0, 6) };
});
console.log(JSON.stringify(info, null, 1).slice(0, 700));
await b.close();