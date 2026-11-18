import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
p.on('console', (m) => { const t = m.text().replace(/%c/g, ''); if (/WARN|error|Error|重置|场景/.test(t)) console.log('C:', t.slice(0, 120)); });
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
const read = () => p.evaluate(() => {
  const c = document.querySelector('[class*="TextBox_Container"]');
  return c ? [...c.querySelectorAll('[class*="outer_"]')].map((s) => s.textContent).join('').slice(0, 16) : null;
});
for (let i = 0; i < 6; i += 1) {
  console.log(i, JSON.stringify(await read()));
  await p.keyboard.press('Space');
  await p.waitForTimeout(1200);
}
await p.screenshot({ path: out + '/dbg2-' + Date.now() + '.png' });
await b.close();