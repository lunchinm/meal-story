import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
const api = await p.evaluate(() => typeof window.__wgBackToTitle);
console.log('__wgBackToTitle:', api);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
await p.evaluate(() => document.querySelector('#paper-ui .pu-tools button[data-label="选项"]').click());
await p.waitForTimeout(1500);
const r = await p.evaluate(() => { const e = document.querySelector('#paper-esc button:nth-child(2)'); const b = e.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2, found: !!e }; });
console.log('esccbar 标题:', JSON.stringify(r));
if (r.found) { await p.mouse.click(r.x, r.y); await p.waitForTimeout(2500); }
const st = await p.evaluate(() => ({ title: getComputedStyle(document.getElementById('paper-title')).display, bars: document.querySelectorAll('[class*="_singleButton"]').length, esc: document.getElementById('paper-esc') ? getComputedStyle(document.getElementById('paper-esc')).display : 'x' }));
console.log('结果:', JSON.stringify(st));
await b.close();