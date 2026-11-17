/**
 * 用 Playwright 抓控制台报错：node tools/debug-console.mjs http://127.0.0.1:4174
 */
import { chromium } from '@playwright/test';

const url = process.argv[2] ?? 'http://127.0.0.1:4174';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1360, height: 860 } });
page.on('console', (msg) => {
  if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text().slice(0, 300));
});
page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message.slice(0, 300)));

await page.goto(url);
await page.waitForTimeout(800);
await page.locator('.title-screen .btn-primary').click().catch(() => {});
await page.waitForTimeout(600);
for (let i = 0; i < 12; i += 1) {
  await page.locator('.dialog, .phone').first().click().catch(() => {});
  await page.waitForTimeout(200);
}
console.log('done');
await browser.close();
