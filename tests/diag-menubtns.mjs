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
for (let i = 0; i < 3; i += 1) { await p.mouse.click(640, 300); await p.waitForTimeout(700); }
await p.evaluate(() => document.querySelector('#paper-ui .pu-tools button[data-label="选项"]').click());
await p.waitForTimeout(1500);
const btns = await p.evaluate(() => [...document.querySelectorAll('div,span,button')].filter((e) => e.children.length === 0 && e.textContent.trim() && e.textContent.trim().length <= 6).map((e) => { const r = e.getBoundingClientRect(); return { t: e.textContent.trim(), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) }; }).filter((o) => o.w > 10).slice(0, 30));
console.log(JSON.stringify(btns).slice(0, 700));
await b.close();