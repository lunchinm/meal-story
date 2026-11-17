import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://127.0.0.1:4174/?node=a1-08');
await page.waitForTimeout(500);
await page.locator('.msg-pic').first().click();
const info = async (tag) => {
  const data = await page.evaluate(() => ({
    node: JSON.parse(localStorage.getItem('meal_save_v1') || '{}').nodeId,
    overlayOn: document.querySelector('.overlay')?.className ?? 'none',
    autoBtn: document.querySelector('.hud-auto')?.className ?? 'none',
  }));
  console.log(tag, JSON.stringify(data));
};
await info('opened');
await page.keyboard.press('a');
await info('after A');
for (let i = 0; i < 5; i += 1) {
  await page.waitForTimeout(800);
  await info(`t+${(i + 1) * 800}ms`);
}
await browser.close();
