import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
let parses = 0;
p.on('console', (m) => { if (/解析场景/.test(m.text())) parses += 1; });
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
const read = () => p.evaluate(() => {
  const c = document.querySelector('[class*="TextBox_Container"]');
  const ov = document.querySelector('#paper-ui .pu-text');
  return {
    engine: c ? (c.innerText || '').replace(/\s+/g, '').slice(0, 12) : null,
    overlay: ov ? ov.textContent.slice(0, 12) : null,
    engineLen: c ? (c.innerText || '').length : 0,
  };
});
for (let i = 0; i < 5; i += 1) {
  console.log(i, JSON.stringify(await read()), 'parses=' + parses);
  await p.keyboard.press('Space');
  await p.waitForTimeout(1500);
}
await b.close();