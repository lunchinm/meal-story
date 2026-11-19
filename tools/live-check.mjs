import { chromium } from 'playwright';
import fs from 'node:fs';
fs.mkdirSync('artifacts/live', { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
const p = await ctx.newPage();
const errors = [], failed = [];
p.on('pageerror', e => errors.push(e.message.slice(0, 120)));
p.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)); });
p.on('response', r => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url().split('/').pop()); });
await p.goto('https://lunchinm.github.io/meal-story/?t=' + Date.now(), { waitUntil: 'commit', timeout: 120000 });
let titleReady = false;
for (let i = 0; i < 60; i++) {
  titleReady = await p.evaluate(() => { const t = document.getElementById('paper-title'); return !!t && getComputedStyle(t).display !== 'none' && !!t.querySelector('.pt-menu button'); });
  if (titleReady) break;
  await p.waitForTimeout(500);
}
console.log('titleReady', titleReady);
await p.screenshot({ path: 'artifacts/live/1-title.png' });
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(8000);
const lines = [];
for (let i = 0; i < 12; i++) {
  lines.push(await p.evaluate(() => window.__paperLine || ''));
  await p.mouse.click(800, 700); await p.waitForTimeout(650);
}
const state = await p.evaluate(() => ({
  line: window.__paperLine || '',
  name: window.__paperName || '',
  bubbles: document.querySelectorAll('#paper-chat .pc-bubble').length,
  chat: getComputedStyle(document.getElementById('paper-chat')).display,
  ver: [...document.scripts].map(s => s.src).find(s => s.includes('theme-inject')) || '',
}));
await p.screenshot({ path: 'artifacts/live/2-game.png' });
console.log(JSON.stringify({ state, lines: lines.slice(0, 12), errors, failed: failed.slice(0, 5) }, null, 1));
await b.close();
