import { expect, test } from '@playwright/test';

test.setTimeout(90_000);

async function tap(page) {
  await page.locator('.dialog').click().catch(() => {});
  await page.waitForTimeout(60);
  await page.locator('.dialog').click().catch(() => {});
  await page.waitForTimeout(90);
}

async function tapUntil(page, selector, max = 12) {
  for (let i = 0; i < max; i += 1) {
    if (await page.locator(selector).count()) return true;
    await tap(page);
  }
  return (await page.locator(selector).count()) > 0;
}

test('隐藏结局链：试行 + 便签 + 修订', async ({ page }) => {
  await page.goto('/?node=a4-publish');
  await page.locator('.choice').nth(1).click();
  expect(await tapUntil(page, '.choice')).toBeTruthy();
  await page.locator('.choice').nth(0).click();
  expect(await tapUntil(page, '.choice')).toBeTruthy();
  await page.locator('.choice').nth(0).click();
  expect(await tapUntil(page, '.ending-title')).toBeTruthy();
  await expect(page.locator('.ending-title')).toHaveText('先问清楚，再给建议');
});