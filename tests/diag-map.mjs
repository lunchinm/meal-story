import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('页面错误:', e.message.slice(0, 100)));
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
const meta = await p.evaluate(() => ({ has: typeof CHAT_IMAGES, n: typeof CHAT_IMAGES === 'object' ? Object.keys(CHAT_IMAGES).length : -1 }));
console.log('映射:', JSON.stringify(meta));
for (let i = 0; i < 20; i += 1) {
  const line = await p.evaluate(() => window.__paperLine || '');
  const hit = await p.evaluate((t) => (typeof CHAT_IMAGES === 'object' && CHAT_IMAGES[t]) || '', line);
  if (hit) { console.log('命中图片:', hit, '| 行:', line.slice(0, 16)); break; }
  await p.mouse.click(640, 300);
  await p.waitForTimeout(700);
}
await b.close();