import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
const jsClick = (l) => p.evaluate((label) => {
  const el = [...document.querySelectorAll('button,div,span')].filter((e) => e.textContent.trim() === label);
  const t = el[el.length - 1]; if (t) (t.closest('button') ?? t).dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, l);
await p.goto('http://127.0.0.1:8082/?n=' + Date.now());
await p.waitForTimeout(2000);
await p.mouse.click(640, 360); await p.waitForTimeout(700);
await jsClick('简体中文'); await p.waitForTimeout(700);
await jsClick('开始游戏');
await p.waitForTimeout(5000);
for (let i = 0; i < 6; i += 1) { await p.mouse.click(640, 650); await p.waitForTimeout(1500); }
const info = await p.evaluate(() => {
  const spans = [...document.querySelectorAll('span')].filter((s) => s.textContent.trim() === '食');
  const out = spans.slice(0, 4).map((s) => {
    const cs = getComputedStyle(s);
    return { cls: s.className.toString().slice(0, 40), size: cs.fontSize, color: cs.color, inline: s.getAttribute('style')?.slice(0, 80) };
  });
  const nameEl = [...document.querySelectorAll('*')].filter((e) => e.textContent.trim() === '周简' && e.children.length === 0).map((e) => ({ cls: e.className.toString().slice(0, 40), size: getComputedStyle(e).fontSize }));
  return { spans: out, nameEl };
});
console.log(JSON.stringify(info, null, 1).slice(0, 900));
await b.close();