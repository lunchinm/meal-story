import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
for (let i = 0; i < 8; i += 1) { await p.mouse.click(640, 300); await p.waitForTimeout(400); }
const info = await p.evaluate(() => {
  const cont = document.querySelector('[class*="TextBox_Container"]');
  const card = document.querySelector('#paper-ui .pu-card');
  const cardTop = Math.round(card.getBoundingClientRect().top);
  const out = [];
  cont.querySelectorAll('*').forEach((el) => {
    if (el.children.length) return;
    const t = (el.textContent || '').trim();
    if (!t || t.length > 2) return;
    const cs = getComputedStyle(el);
    if (!(cs.backgroundImage && cs.backgroundImage !== 'none')) return;
    const r = el.getBoundingClientRect();
    out.push({ t, top: Math.round(r.top), delta: Math.round(r.top - cardTop), pcls: el.parentElement.className.toString().slice(0, 26) });
  });
  return { cardTop, rows: out.slice(0, 6) };
});
console.log(JSON.stringify(info, null, 1).slice(0, 800));
await b.close();