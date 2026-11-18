import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 80)));
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
for (let i = 0; i < 4; i += 1) { await p.mouse.click(640, 300); await p.waitForTimeout(700); }
// 打开设置
await p.evaluate(() => document.querySelector('#paper-ui .pu-tools button[data-label="选项"]').click());
await p.waitForTimeout(1500);
const s1 = await p.evaluate(() => ({
  ui: getComputedStyle(document.getElementById('paper-ui')).display,
  chat: getComputedStyle(document.getElementById('paper-chat')).display,
  title: getComputedStyle(document.getElementById('paper-title')).display,
}));
console.log('设置页时自绘层:', JSON.stringify(s1));
await p.screenshot({ path: out + '/menu-config-' + Date.now() + '.png' });
// 找设置里的返回标题
const hit = await p.evaluate(() => {
  const els = [...document.querySelectorAll('div,span,button')].filter((e) => e.children.length === 0 && /返回标题|回到标题/.test(e.textContent || ''));
  if (!els.length) return null;
  const r = els[0].getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2, label: els[0].textContent.trim() };
});
console.log('返回标题按钮:', JSON.stringify(hit));
if (hit) {
  await p.mouse.click(hit.x, hit.y);
  await p.waitForTimeout(2500);
  const s2 = await p.evaluate(() => ({
    title: getComputedStyle(document.getElementById('paper-title')).display,
    hasBox: !!document.querySelector('[class*="TextBox_Container"]'),
    menuBtns: document.querySelectorAll('#paper-title .pt-menu button').length,
  }));
  console.log('返回标题后:', JSON.stringify(s2));
  await p.screenshot({ path: out + '/back-title-' + Date.now() + '.png' });
  // 再次开始
  await p.evaluate(() => { const b = document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]'); if (b) b.click(); });
  await p.waitForTimeout(6000);
  const s3 = await p.evaluate(() => ({ line: (window.__paperLine || '').slice(0, 14), title: getComputedStyle(document.getElementById('paper-title')).display }));
  console.log('再次开始:', JSON.stringify(s3));
}
console.log('错误:', errs.length ? errs.slice(0, 2).join(' | ') : 'none');
await b.close();