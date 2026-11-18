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
  return (t.length % 3 === 0 ? t.slice(0, t.length / 3) : t).slice(0, 14);
});
for (const [x, y] of [[640, 600], [640, 600], [640, 300], [640, 300]]) {
  const before = await read();
  await p.mouse.click(x, y);
  await p.waitForTimeout(800);
  console.log(`原生UI click ${x},${y}:`, before === (await read()) ? '无变化' : '推进了');
}
await b.close();