import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
const read = () => p.evaluate(() => {
  const c = document.querySelector('[class*="TextBox_Container"]');
  const t = c ? (c.innerText || '').replace(/\s+/g, '') : '';
  return (t.length % 3 === 0 ? t.slice(0, t.length / 3) : t).slice(0, 16);
});
for (let i = 0; i < 8; i += 1) {
  const t0 = Date.now();
  await p.mouse.click(640, 600);
  await p.waitForTimeout(700);
  console.log(i, (Date.now() - t0) + 'ms', JSON.stringify(await read()));
}
await b.close();