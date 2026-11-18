import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
const fails = [];
p.on('requestfailed', (r) => fails.push(r.url().slice(-60) + ' ' + (r.failure()?.errorText || '')));
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => {
  window.__long = [];
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long.push(Math.round(e.duration)); }).observe({ entryTypes: ['longtask'] });
  } catch (e) {}
});
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
const t0 = Date.now();
const before = await p.evaluate(() => document.querySelector('[class*="_text_"]')?.textContent.slice(0, 10));
await p.keyboard.press('Space');
await p.waitForTimeout(6000);
const after = await p.evaluate(() => document.querySelector('[class*="_text_"]')?.textContent.slice(0, 10));
const longs = await p.evaluate(() => (window.__long || []).slice(-12));
console.log('推进前后:', JSON.stringify(before), '→', JSON.stringify(after));
console.log('长任务(ms):', longs.join(','));
console.log('失败请求:', fails.slice(0, 3).join(' | ') || 'none');
await b.close();