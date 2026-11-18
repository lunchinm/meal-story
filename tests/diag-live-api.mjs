import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('https://lunchinm.github.io/meal-story/?t=' + Date.now(), { timeout: 90000, waitUntil: 'domcontentloaded' });
await p.waitForTimeout(6000);
const info = await p.evaluate(() => ({
  backToTitle: typeof window.__wgBackToTitle,
  closePanels: typeof window.__wgClosePanels,
  titleMenus: document.querySelectorAll('#paper-title .pt-menu').length,
  titles: document.querySelectorAll('#paper-title').length,
}));
console.log(JSON.stringify(info));
await b.close();