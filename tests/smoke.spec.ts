import { expect, test } from '@playwright/test';

/** 标题页与基本操作 */

test.describe('标题页', () => {
  test('能打开并显示标题、开始按钮与名字输入', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.title-name')).toHaveText('今天吃什么？');
    await expect(page.locator('.title-screen .btn-primary')).toBeVisible();
    await expect(page.locator('.title-name-input')).toBeVisible();
  });

  test('填名字后开始，名字写进 localStorage', async ({ page }) => {
    await page.goto('/');
    await page.locator('.title-name-input').fill('林小满');
    await page.locator('.title-screen .btn-primary').click();
    await expect(page.locator('.dialog .text, .chat-text').first()).toBeVisible();
    const name = await page.evaluate(() => localStorage.getItem('meal_player_name'));
    expect(name).toBe('林小满');
  });

  test('开始后右上工具条与静音按钮都在', async ({ page }) => {
    await page.goto('/');
    await page.locator('.title-screen .btn-primary').click();
    await expect(page.locator('.qm-btn')).toHaveCount(5);
    await expect(page.locator('.mute-btn')).toBeVisible();
  });
});

test.describe('对话推进', () => {
  test('点击对话能推进到下一句', async ({ page }) => {
    await page.goto('/?node=a1-45');
    const first = await page.locator('.dialog .text').innerText();
    await page.locator('.dialog').click();
    await page.waitForTimeout(90);
    await page.locator('.dialog').click().catch(() => {});
    await expect(page.locator('.dialog .text')).not.toHaveText(first);
  });

  test('空格可以推进', async ({ page }) => {
    await page.goto('/?node=a1-45');
    const first = await page.locator('.dialog .text').innerText();
    await page.keyboard.press('Space');
    await expect(page.locator('.dialog .text')).not.toHaveText(first);
  });
});

test.describe('存档', () => {
  test('推进后会写存档节点', async ({ page }) => {
    await page.goto('/?node=a1-45');
    await page.locator('.dialog').click();
    await page.waitForTimeout(90);
    await page.locator('.dialog').click().catch(() => {});
    await page.waitForTimeout(300);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('meal_save_v1') || '{}').nodeId);
    expect(saved).toBeTruthy();
    expect(saved).not.toBe('a1-45');
  });
});
