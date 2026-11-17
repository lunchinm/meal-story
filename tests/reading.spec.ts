import { expect, test } from '@playwright/test';

/** 阅读体验：自动播放、快进、回想、设置、右键隐藏 */

test('自动播放会自己往下走', async ({ page }) => {
  await page.goto('/?node=a1-45');
  await page.locator('.hud-auto').click();
  await expect(page.locator('.hud-auto')).toHaveClass(/on/);
  const first = await page.locator('.dialog .text').innerText();
  await expect(page.locator('.dialog .text')).not.toHaveText(first, { timeout: 8000 });
  await page.locator('.hud-auto').click();
  await expect(page.locator('.hud-auto')).not.toHaveClass(/on/);
});

test('自动播放遇到选项会停下', async ({ page }) => {
  await page.goto('/?node=a1-15');
  await page.locator('.hud-auto').click();
  await page.waitForTimeout(4000);
  const choices = await page.locator('.choice, .quick').count();
  expect(choices).toBeGreaterThan(0);
  const on = await page.locator('.hud-auto').evaluate((el) => el.classList.contains('on'));
  expect(on).toBe(false);
});

test('快进只跳已读，遇到没读过的停下', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('meal_save_v1', JSON.stringify({ nodeId: 'a1-45', flags: [], readNodes: ['a1-45'] }));
  });
  await page.goto('/?node=a1-45');
  const first = await page.locator('.dialog .text').innerText();
  await page.locator('.hud-skip').click();
  await expect(page.locator('.dialog .text')).not.toHaveText(first, { timeout: 5000 });
  // 下一句没读过，快进应当自动关掉
  await expect(page.locator('.hud-skip')).not.toHaveClass(/on/, { timeout: 5000 });
});

test('回想面板能列出刚看过的对白', async ({ page }) => {
  await page.goto('/?node=a1-45');
  const text = await page.locator('.dialog .text').innerText();
  await page.locator('.hud-log').click();
  await expect(page.locator('.backlog-panel')).toBeVisible();
  await expect(page.locator('.backlog-text').first()).toContainText(text.slice(0, 8));
  await page.locator('.backlog-panel .btn-ghost').click();
  await expect(page.locator('.backlog-panel')).toHaveCount(0);
});

test('设置面板能调音量并记住', async ({ page }) => {
  await page.goto('/?node=a1-45');
  await page.locator('.hud-config').click();
  const voice = page.locator('.settings-range[data-channel="voice"]');
  await voice.fill('40');
  await page.waitForTimeout(200);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('meal_settings_v1') || '{}').voice);
  expect(stored).toBeCloseTo(0.4, 2);
  await page.reload();
  await page.locator('.hud-config').click();
  await expect(page.locator('.settings-range[data-channel="voice"]')).toHaveValue('40');
});

test('自动播放停顿设置能持久化', async ({ page }) => {
  await page.goto('/?node=a1-45');
  await page.locator('.hud-config').click();
  await page.locator('.settings-range[data-channel="auto"]').fill('2600');
  await page.waitForTimeout(200);
  const delay = await page.evaluate(() => JSON.parse(localStorage.getItem('meal_settings_v1') || '{}').autoDelay);
  expect(delay).toBe(2600);
});

test('右键隐藏界面，再右键恢复', async ({ page }) => {
  await page.goto('/?node=a1-45');
  await page.locator('.stage').click({ button: 'right' });
  await expect(page.locator('.stage')).toHaveClass(/ui-hidden/);
  await page.locator('.stage').click({ button: 'right' });
  await expect(page.locator('.stage')).not.toHaveClass(/ui-hidden/);
});

test('快捷键 A 与 L 生效', async ({ page }) => {
  await page.goto('/?node=a1-45');
  await page.keyboard.press('a');
  await expect(page.locator('.hud-auto')).toHaveClass(/on/);
  await page.keyboard.press('a');
  await page.keyboard.press('l');
  await expect(page.locator('.backlog-panel')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.backlog-panel')).toHaveCount(0);
});
