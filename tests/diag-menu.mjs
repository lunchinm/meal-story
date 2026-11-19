import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8123/?t=' + Date.now());
await p.waitForTimeout(4000);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6500);
// 打开设置
await p.evaluate(() => { const btns=[...document.querySelectorAll('[class*="Button"]')]; });
await p.evaluate(() => window.__wgSetUIProbe && window.__wgSetUIProbe());
await p.keyboard.press('Escape');
await p.waitForTimeout(800);
const menuOpen = await p.evaluate(() => !!document.querySelector('[class*="_Options_main_"]'));
console.log('设置页是否打开:', menuOpen);
// 点自绘返回
const back = await p.evaluate(() => { const b=document.querySelector('#paper-esc button'); if(!b) return null; const r=b.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2,t:b.textContent}; });
console.log('返回按钮:', JSON.stringify(back));
if (back) { await p.mouse.click(back.x, back.y); }
await p.waitForTimeout(1200);
console.log('点返回后设置页还在:', await p.evaluate(() => !!document.querySelector('[class*="_Options_main_"]')));
await b.close();