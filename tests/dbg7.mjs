import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
const raw = () => p.evaluate(() => {
  const c = document.querySelector('[class*="TextBox_Container"]');
  const t = c ? (c.innerText || '') : '';
  return { len: t.length, head: t.replace(/\s+/g, '').slice(0, 20) };
});
for (let i = 0; i < 6; i += 1) {
  console.log(i, JSON.stringify(await raw()));
  await p.mouse.click(640, 400);
  await p.waitForTimeout(1500);
}
await b.close();