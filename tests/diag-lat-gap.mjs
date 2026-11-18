import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(3000);
await p.mouse.click(640, 360); await p.waitForTimeout(1200);
await p.evaluate(() => {
  const el = [...document.querySelectorAll('span,div')].filter((e) => e.children.length === 0 && e.textContent.trim() === '开始游戏');
  if (el.length) el[el.length - 1].click();
});
await p.waitForTimeout(6000);
const read = () => p.evaluate(() => {
  const c = document.querySelector('[class*="TextBox_Container"]');
  const t = c ? (c.innerText || '').replace(/\s+/g, '') : '';
  return t.length % 3 === 0 ? t.slice(0, t.length / 3) : t;
});
for (const gap of [600, 900, 1400]) {
  let ok = 0;
  let prev = await read();
  for (let i = 0; i < 8; i += 1) {
    await p.waitForTimeout(gap);
    await p.mouse.click(640, 300);
    await p.waitForTimeout(400);
    const now = await read();
    if (now !== prev) ok += 1;
    prev = now;
  }
  console.log('原生 间隔', gap + 'ms →', ok + '/8');
}
await b.close();