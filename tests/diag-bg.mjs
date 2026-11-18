import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('https://lunchinm.github.io/meal-story/?t=' + Date.now(), { waitUntil: 'commit', timeout: 120000 });
for (let i = 0; i < 12; i += 1) {
  const st = await p.evaluate(() => ({
    body: document.body ? getComputedStyle(document.body).backgroundColor : 'no-body',
    html: document.documentElement ? getComputedStyle(document.documentElement).backgroundColor : '',
    ebg: document.getElementById('ebg') ? getComputedStyle(document.getElementById('ebg')).backgroundColor : '-',
    boot: !!document.getElementById('paper-boot'),
  }));
  console.log(i, JSON.stringify(st));
  await p.waitForTimeout(250);
}
await b.close();