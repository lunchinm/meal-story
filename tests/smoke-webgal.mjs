import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const log = [];
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
p.on('pageerror', (e) => log.push('PAGEERROR ' + e.message.slice(0, 100)));
p.on('response', (r) => { if (r.status() >= 400 && !/live2d/.test(r.url())) log.push('HTTP ' + r.status() + ' ' + r.url().slice(-50)); });

await p.goto('http://127.0.0.1:8082/');
await p.waitForTimeout(2500);
await p.mouse.click(640, 360); await p.waitForTimeout(900);
const clickText = (l) => p.evaluate((label) => {
  const el = [...document.querySelectorAll('button,span,div')].filter((e) => e.children.length === 0 && e.textContent.trim() === label);
  if (el.length) { el[el.length - 1].click(); return true; }
  return false;
}, l);
await clickText('简体中文'); await p.waitForTimeout(3500);
// 自绘菜单点开始
const started = await p.evaluate(() => {
  const btn = document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]');
  if (!btn) return false; btn.click(); return true;
});
log.push('title start: ' + started);
await p.waitForTimeout(6000);

// 推进直到遇到选项
let sawChoice = false, lines = 0;
for (let i = 0; i < 90; i += 1) {
  const has = await p.evaluate(() => !!document.querySelector('[class*="_Choose_item_outer"]'));
  if (has) { sawChoice = true; break; }
  await p.keyboard.press('Space');
  lines += 1;
  await p.waitForTimeout(420);
}
log.push('lines advanced: ' + lines + ' / choice: ' + sawChoice);

if (sawChoice) {
  await p.waitForTimeout(800);
  await p.screenshot({ path: out + '/smoke-choice-' + Date.now() + '.png' });
  const r = await p.evaluate(() => {
    const el = document.querySelector('[class*="_Choose_item_outer"]');
    const b = el.getBoundingClientRect();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  });
  await p.mouse.click(r.x, r.y);
  await p.waitForTimeout(2500);
  const after = await p.evaluate(() => {
    const c = document.querySelector('[class*="TextBox_Container"]');
    return c ? [...c.querySelectorAll('[class*="outer_"]')].map((s) => s.textContent).join('') : '';
  });
  log.push('after choice: ' + after.slice(0, 20));
}

await p.screenshot({ path: out + '/smoke-game-' + Date.now() + '.png' });
console.log(log.join('\n'));
await b.close();