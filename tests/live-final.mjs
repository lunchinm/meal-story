import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
const vocal = []; const bad = [];
p.on('request', (r) => { if (r.url().includes('/vocal/')) vocal.push(r.url().split('/').pop()); });
p.on('response', (r) => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url().split('/').pop()); });
await p.goto('https://lunchinm.github.io/meal-story/?t=' + Date.now());
await p.waitForTimeout(4000);
await p.mouse.click(640, 360); await p.waitForTimeout(1500);
await p.evaluate(() => {
  const el = [...document.querySelectorAll('span,div')].filter((e) => e.children.length === 0 && e.textContent.trim() === '简体中文');
  if (el.length) el[el.length - 1].click();
});
await p.waitForTimeout(4000);
const menuOk = await p.evaluate(() => !!document.querySelector('#paper-title .pt-menu button'));
if (menuOk) await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(7000);
for (let i = 0; i < 30; i += 1) { await p.mouse.click(640, 300); await p.waitForTimeout(260); }
await p.screenshot({ path: out + '/live-final-' + Date.now() + '.png' });
const st = await p.evaluate(() => ({
  line: (window.__paperLine || '').slice(0, 18),
  tools: document.querySelectorAll('#paper-ui .pu-tools button').length,
  bgm: [...document.querySelectorAll('audio')].map((a) => ({ s: (a.src || '').split('/').pop(), paused: a.paused })),
}));
console.log('标题菜单:', menuOk, '| 状态:', JSON.stringify(st));
console.log('配音请求:', vocal.length, vocal.slice(0, 3).join(','));
console.log('异常:', bad.length ? bad.slice(0, 2).join(' | ') : 'none');
await b.close();