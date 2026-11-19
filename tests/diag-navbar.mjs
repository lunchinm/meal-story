import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('ERR', e.message.slice(0, 100)));
await p.goto('http://127.0.0.1:8123/?t=' + Date.now());
await p.waitForTimeout(4200);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6500);
for (let i = 0; i < 4; i += 1) { await p.mouse.click(800, 700); await p.waitForTimeout(500); }
console.log('原生栏按钮:', await p.evaluate(() => [...document.querySelectorAll('[class*="_singleButton"]')].map((x) => (x.getAttribute('data-paper-btn') || x.textContent.trim() || x.getAttribute('aria-label') || '?')).slice(0, 12).join(',')));
console.log('panel-nav 存在:', await p.evaluate(() => !!document.getElementById('paper-nav')));
await p.screenshot({ path: 'docs/shot-native-bar.png' });
await b.close();