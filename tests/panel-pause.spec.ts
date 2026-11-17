import { expect, test } from '@playwright/test';

/** 打字机：点一下补全、再点推进 */
async function tap(page) {
  await page.locator('.dialog').click().catch(() => {});
  await page.waitForTimeout(70);
  await page.locator('.dialog').click().catch(() => {});
  await page.waitForTimeout(150);
}

test('图片查看器打开期间不自动推进，关掉后继续', async ({ page }) => {
  await page.goto('/?node=a1-08');
  await page.locator('.chat-pic').first().click();
  await expect(page.locator('.image-viewer img')).toBeVisible();
  await page.keyboard.press('a');
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('meal_save_v1') || '{}').nodeId);
  await page.waitForTimeout(2200);
  const during = await page.evaluate(() => JSON.parse(localStorage.getItem('meal_save_v1') || '{}').nodeId);
  expect(during).toBe(before);

  await page.locator('.image-viewer').click();
  await page.waitForTimeout(2600);
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('meal_save_v1') || '{}').nodeId);
  expect(after).not.toBe(before);
});

test('回想面板打开时不推进', async ({ page }) => {
  await page.goto('/?node=a1-45');
  await page.locator('.qm-log').click();
  await page.keyboard.press('a');
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('meal_save_v1') || '{}').nodeId);
  await page.waitForTimeout(2200);
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('meal_save_v1') || '{}').nodeId);
  expect(after).toBe(before);
});

test('回退能回到上一句', async ({ page }) => {
  await page.goto('/?node=a1-45');
  await expect(page.locator('.dialog')).toHaveClass(/typed/, { timeout: 5000 });
  const first = await page.locator('.dialog .text').innerText();
  await tap(page);
  await expect(page.locator('.dialog .text')).not.toHaveText(first, { timeout: 5000 });
  await page.locator('.qm-back').click();
  await page.waitForTimeout(500);
  const back = await page.locator('.dialog .text').innerText();
  expect(back.startsWith(first.slice(0, 6))).toBeTruthy();
});