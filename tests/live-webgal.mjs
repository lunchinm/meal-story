import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', (e) => { if (!/Network Error/.test(e.message)) errs.push(e.message.slice(0, 60)); });
await p.goto('https://lunchinm.github.io/meal-story/?t=' + Date.now());
await p.waitForTimeout(4000);
await p.mouse.click(640, 360); await p.waitForTimeout(1500);
await p.evaluate(() => {
  const el = [...document.querySelectorAll('span,div')].filter((e) => e.children.length === 0 && e.textContent.trim() === '简体中文');
  if (el.length) el[el.length - 1].click();
});
await p.waitForTimeout(4000);
await p.screenshot({ path: out + '/live-title-' + Date.now() + '.png' });
const titleReady = await p.evaluate(() => !!document.querySelector('#paper-title .pt-menu button'));
if (titleReady) {
  await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
}
await p.waitForTimeout(7000);
for (let i = 0; i < 20; i += 1) { await p.mouse.click(640, 500); await p.waitForTimeout(400); }
await p.screenshot({ path: out + '/live-game-' + Date.now() + '.png' });
const state = await p.evaluate(() => {
  const c = document.querySelector('[class*="TextBox_Container"]');
  const txt = c ? [...c.querySelectorAll('[class*="outer_"]')].map((s) => s.textContent).join('') : '';
  return { hasBox: !!c, txt: txt.slice(0, 24), ui: !!document.getElementById('paper-ui') };
});
console.log('title菜单:', titleReady, '| 游戏:', JSON.stringify(state), '| 错误:', errs.length);
await b.close();