import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
const vocal = [];
const bad = [];
p.on('request', (r) => { if (r.url().includes('/vocal/')) vocal.push(r.url().split('/').pop()); });
p.on('response', (r) => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url().split('/').pop()); });
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(3000);
const titleState = await p.evaluate(() => ({
  press: document.body.innerText.includes('PRESS THE SCREEN'),
  lang: document.body.innerText.includes('LANGUAGE SELECT'),
  menu: !!document.querySelector('#paper-title .pt-menu button'),
}));
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(7000);
const gameState = await p.evaluate(() => ({
  press: document.body.innerText.includes('PRESS THE SCREEN'),
  lang: document.body.innerText.includes('LANGUAGE SELECT'),
  box: !!document.querySelector('[class*="TextBox_Container"]'),
  tools: document.querySelectorAll('#paper-ui .pu-tools button').length,
}));
for (let i = 0; i < 12; i += 1) { await p.keyboard.press('Space'); await p.waitForTimeout(600); }
console.log('标题页:', JSON.stringify(titleState));
console.log('进游戏:', JSON.stringify(gameState));
console.log('配音请求:', vocal.length, vocal.slice(0, 3).join(','));
console.log('资源异常:', bad.length ? bad.slice(0, 3) : 'none');
await b.close();