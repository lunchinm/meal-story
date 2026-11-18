import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('页面错误:', e.message.slice(0, 100)));
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
const meta = await p.evaluate(() => ({ n: window.__chatImages ? Object.keys(window.__chatImages).length : -1, keys: window.__chatImages ? Object.keys(window.__chatImages).slice(0, 3) : [] }));
console.log('映射:', JSON.stringify(meta).slice(0, 200));
for (let i = 0; i < 22; i += 1) {
  const line = await p.evaluate(() => window.__paperLine || '');
  const hit = await p.evaluate((t) => (window.__chatImages && window.__chatImages[t]) || '', line);
  if (hit) { console.log('命中:', hit, '| 行:', line.slice(0, 14)); break; }
  if (i === 21) console.log('当前行示例:', JSON.stringify(line.slice(0, 30)));
  await p.mouse.click(640, 300);
  await p.waitForTimeout(650);
}
await b.close();