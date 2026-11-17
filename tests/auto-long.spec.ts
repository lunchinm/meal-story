import { expect, test } from '@playwright/test';

/** 自动播放能不能真的把人送过一段 */

test('自动播放连续推进多句不停', async ({ page }) => {
  await page.goto('/?node=a1-10');
  await page.locator('.hud-auto').click();
  const seen = new Set<string>();
  for (let i = 0; i < 12; i += 1) {
    const text = await page.locator('.dialog .text, .msg-text').last().innerText().catch(() => '');
    if (text) seen.add(text);
    if (seen.size >= 4) break;
    await page.waitForTimeout(900);
  }
  expect(seen.size).toBeGreaterThanOrEqual(4);
  await page.locator('.hud-auto').click();
});

test('快进能把已读的一段一次跳完', async ({ page }) => {
  await page.goto('/?node=a1-45');
  // 先把附近几句标成已读
  const ids = await page.evaluate(() => {
    const raw = localStorage.getItem('meal_save_v1');
    const data = raw ? JSON.parse(raw) : {};
    data.flags = data.flags ?? [];
    data.readNodes = (data.readNodes ?? []).concat(['a1-45', 'a1-46']);
    localStorage.setItem('meal_save_v1', JSON.stringify(data));
    return data.readNodes;
  });
  expect(ids.length).toBeGreaterThan(0);
  await page.reload();
  await page.locator('.hud-skip').click();
  await page.waitForTimeout(2500);
  const node = await page.evaluate(() => JSON.parse(localStorage.getItem('meal_save_v1') || '{}').nodeId);
  expect(node).not.toBe('a1-45');
});
