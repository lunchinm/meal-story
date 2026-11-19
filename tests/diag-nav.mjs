import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('ERR', e.message.slice(0, 110)));
await p.goto('http://127.0.0.1:8123/?t=' + Date.now());
await p.waitForTimeout(4200);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6500);
for (let i = 0; i < 6; i += 1) { await p.mouse.click(800, 700); await p.waitForTimeout(700); }
const navs = await p.evaluate(() => [...document.querySelectorAll('#paper-nav button')].map((b) => b.textContent));
console.log('导航按钮:', JSON.stringify(navs));
const before = await p.evaluate(() => window.__paperLine || '');
await p.evaluate(() => [...document.querySelectorAll('#paper-nav button')].find((b) => b.textContent === '上一句')?.click());
await p.waitForTimeout(1200);
const after = await p.evaluate(() => window.__paperLine || '');
console.log('回退:', before.slice(0, 10), '→', after.slice(0, 10), '| 变了:', before !== after);
// 回想 + 返回
await p.evaluate(() => [...document.querySelectorAll('#paper-nav button')].find((b) => b.textContent === '回想')?.click());
await p.waitForTimeout(900);
const opened = await p.evaluate(() => !!document.querySelector('[class*="_Backlog_main_"]'));
await p.evaluate(() => [...document.querySelectorAll('#paper-esc button')].find((b) => b.textContent === '返回')?.click());
await p.waitForTimeout(1000);
const still = await p.evaluate(() => !!document.querySelector('[class*="_Backlog_main_"]'));
const playing = await p.evaluate(() => [...document.querySelectorAll('audio')].filter((a) => !a.paused && a.currentTime > 0.05).length);
console.log('回想打开:', opened, '| 返回后仍在:', still, '| 正在播放的音轨数:', playing);
await b.close();