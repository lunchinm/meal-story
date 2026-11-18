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
  return t.length % 3 === 0 ? t.slice(0, t.length / 3) : t.slice(0, 18);
});
for (let i = 0; i < 5; i += 1) {
  console.log('click', i, JSON.stringify(await read()));
  await p.mouse.click(640, 400);
  await p.waitForTimeout(1800);
}
await b.close();