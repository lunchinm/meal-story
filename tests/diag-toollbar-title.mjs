import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
for (let i = 0; i < 2; i += 1) { await p.mouse.click(640, 300); await p.waitForTimeout(700); }
const before = await p.evaluate(() => ({ title: getComputedStyle(document.getElementById('paper-title')).display, line: (window.__paperLine || '').slice(0, 10) }));
console.log('点之前:', JSON.stringify(before));
await p.evaluate(() => document.querySelector('#paper-ui .pu-tools button[data-label="标题"]').click());
await p.waitForTimeout(3000);
const after = await p.evaluate(() => ({ title: getComputedStyle(document.getElementById('paper-title')).display, nativeTitle: [...document.querySelectorAll('div,span')].filter(e=>!e.children.length && ['开始游戏','继续游戏'].includes(e.textContent.trim())).length }));
console.log('点工具栏标题后:', JSON.stringify(after));
await p.screenshot({ path: 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out/toolbar-title-' + Date.now() + '.png' });
await b.close();