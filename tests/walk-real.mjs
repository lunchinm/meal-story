import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
const vocal = [];
p.on('request', (r) => { if (r.url().includes('/vocal/')) vocal.push(r.url().split('/').pop()); });
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
let choices = 0;
for (let i = 0; i < 130; i += 1) {
  const r = await p.evaluate(() => {
    const el = document.querySelector('[class*="_Choose_item_outer"]');
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2, n: document.querySelectorAll('[class*="_Choose_item_outer"]').length };
  });
  if (r) { choices += 1; await p.mouse.click(r.x, r.y); await p.waitForTimeout(900); continue; }
  await p.mouse.click(640, 400);
  await p.waitForTimeout(260);
}
const audio = await p.evaluate(() => [...document.querySelectorAll('audio')].map((a) => ({ src: (a.src || '').split('/').pop(), paused: a.paused, t: Math.round(a.currentTime) })));
const line = await p.evaluate(() => {
  const c = document.querySelector('[class*="TextBox_Container"]');
  const t = c ? (c.innerText || '').replace(/\s+/g, '') : '';
  return t.slice(0, Math.ceil(t.length / 3));
});
console.log('选择次数:', choices, '| 配音请求:', vocal.length, vocal.slice(0, 3).join(','));
console.log('音频:', JSON.stringify(audio));
console.log('当前行:', line.slice(0, 20));
await b.close();