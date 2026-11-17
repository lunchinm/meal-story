import { expect, test } from '@playwright/test';

/** 剧情结构与交互关卡 */

test('群聊里图片直接贴出，点图放大', async ({ page }) => {
  await page.goto('/?node=a1-08');
  const pic = page.locator('.chat-pic').first();
  await expect(pic).toBeVisible();
  await pic.click();
  await expect(page.locator('.image-viewer img')).toBeVisible();
});

test('物件探索：看完两个才能继续', async ({ page }) => {
  await page.goto('/?node=a1-explore');
  const next = page.locator('.board-foot .btn-primary');
  await expect(next).toBeDisabled();
  await page.locator('.explore-card').nth(0).click();
  await page.locator('.explore-card').nth(1).click();
  await expect(next).toBeEnabled();
  await page.locator('.explore-card').nth(0).click();
  await expect(page.locator('.explore-summary')).toBeVisible();
  await next.click();
});

test('调查簿能展开条目', async ({ page }) => {
  await page.goto('/?node=a1-notebook');
  await page.locator('.nb-item').first().click();
  await expect(page.locator('.nb-detail').first()).toBeVisible();
});

test('配餐关：超预算给提示，合格后过关', async ({ page }) => {
  await page.goto('/?node=a2-plate');
  await page.locator('.food').nth(5).click();
  await page.locator('.food').nth(1).click();
  await page.locator('.food').nth(4).click();
  await page.locator('.board-foot .btn-primary').click();
  await expect(page.locator('.hint-line')).toContainText('超');
  await page.locator('.btn-ghost').click();
  await page.locator('.food').nth(0).click();
  await page.locator('.food').nth(3).click();
  await page.locator('.food').nth(2).click();
  await page.locator('.food').nth(6).click();
  await page.locator('.board-foot .btn-primary').click();
  await expect(page.locator('.dialog .text, .chat-text').first()).toBeVisible();
});

test('三个结局都能到达', async ({ page }) => {
  for (const [node, title] of [
    ['e_normal', '我会选了'],
    ['e_advanced', '换一家食堂，也会选'],
    ['e_hidden', '先问清楚，再给建议'],
  ]) {
    await page.goto(`/?node=${node}`);
    await expect(page.locator('.ending-title')).toHaveText(title);
    await expect(page.locator('.ending-card-item')).toHaveCount(4);
    await expect(page.locator('.ending-slot')).toHaveCount(3);
  }
});
