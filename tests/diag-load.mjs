import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8090/?t=' + Date.now());
await p.waitForTimeout(5000);
console.log(JSON.stringify(await p.evaluate(() => ({ title: !!document.getElementById('paper-title'), boot: !!document.getElementById('paper-boot'), wg: typeof window.__wgBackToTitle, script: [...document.scripts].map(s => (s.src || '').split('/').pop()).filter(Boolean) }))));
await b.close();