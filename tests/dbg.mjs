import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('ERR', e.message.slice(0, 80)));
p.on('console', (m) => { const t = m.text(); if (/error|Error/.test(t)) console.log('C:', t.replace(/%c/g, '').slice(0, 100)); });
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
for (let i = 0; i < 6; i += 1) {
  const txt = await p.evaluate(() => (document.querySelector('[class*="_text_"]')?.textContent || '').replace(/\s+/g, '').slice(0, 18));
  console.log(i, JSON.stringify(txt));
  await p.keyboard.press('Space');
  await p.waitForTimeout(1500);
}
await p.screenshot({ path: out + '/dbg-' + Date.now() + '.png' });
await b.close();