import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
const vocal = [], bad = [];
p.on('request', (r) => { if (r.url().includes('/vocal/')) vocal.push(r.url().split('/').pop()); });
p.on('response', (r) => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url().split('/').pop()); });
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(3000);
const t0 = await p.evaluate(() => ({
  press: document.body.innerText.includes('PRESS THE SCREEN'),
  lang: document.body.innerText.includes('LANGUAGE SELECT'),
}));
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
for (let i = 0; i < 45; i += 1) { await p.keyboard.press('Space'); await p.waitForTimeout(320); }
const t1 = await p.evaluate(() => ({
  press: document.body.innerText.includes('PRESS THE SCREEN'),
  lang: document.body.innerText.includes('LANGUAGE SELECT'),
  tools: document.querySelectorAll('#paper-ui .pu-tools button').length,
}));
console.log('标题:', JSON.stringify(t0), '| 游戏内:', JSON.stringify(t1));
console.log('配音请求:', vocal.length, vocal.slice(0, 4).join(','));
console.log('异常:', bad.length ? bad.slice(0, 3).join(' | ') : 'none');
await b.close();