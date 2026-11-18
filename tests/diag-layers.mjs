import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
for (let i = 0; i < 6; i += 1) { await p.mouse.click(640, 320); await p.waitForTimeout(600); }
const info = await p.evaluate(() => {
  const c = document.querySelector('[class*="TextBox_Container"]');
  const rows = [];
  c.querySelectorAll('*').forEach((el) => {
    if (el.children.length) return;
    const t = (el.textContent || '').trim();
    if (!t || t.length > 2) return;
    const cs = getComputedStyle(el);
    rows.push({
      cls: el.className.toString().slice(0, 24),
      t,
      color: cs.color,
      fill: cs.webkitTextFillColor,
      op: cs.opacity,
      bg: cs.backgroundImage === 'none' ? '-' : 'img',
    });
  });
  return rows.slice(0, 8);
});
console.log(JSON.stringify(info, null, 1).slice(0, 1100));
await b.close();