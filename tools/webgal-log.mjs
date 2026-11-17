import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block' });
const p = await ctx.newPage();
p.on('console', (m) => console.log('[' + m.type() + ']', m.text().slice(0, 200)));
p.on('pageerror', (e) => console.log('[pageerror]', e.message.slice(0, 200)));
await p.goto('http://127.0.0.1:8081/index.html');
await p.waitForTimeout(5000);
await b.close();