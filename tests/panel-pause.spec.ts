import { expect, test } from '@playwright/test';

/** 自动播放时打开面板要暂停，关掉再继续 */

test('道具面板打开期间不自动推进，收起后继续', async ({ page }) => {
  await page.goto('/?node=a1-08');
  // 先打开面板，再开自动，避免“还没点开就已经自动走了一句”
  await page.locator('.msg-pic').first().click();
  await expect(page.locator('.prop-panel, .card-panel').first()).toBeVisible();
  await page.keyboard.press('a');
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('meal_save_v1') || '{}').nodeId);
  await page.waitForTimeout(2200);
  const during = await page.evaluate(() => JSON.parse(localStorage.getItem('meal_save_v1') || '{}').nodeId);
  expect(during).toBe(before);

  await page.locator('.overlay .btn-ghost, .overlay .btn').first().click();
  await page.waitForTimeout(2200);
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('meal_save_v1') || '{}').nodeId);
  expect(after).not.toBe(before);
});

test('回想面板打开时不推进', async ({ page }) => {
  await page.goto('/?node=a1-45');
  await page.locator('.hud-log').click();
  await page.keyboard.press('a');
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('meal_save_v1') || '{}').nodeId);
  await page.waitForTimeout(2200);
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('meal_save_v1') || '{}').nodeId);
  expect(after).toBe(before);
});
