import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('页面错误:', e.message.slice(0, 120)));
p.on('console', (m) => { if (m.type() === 'error') console.log('控制台:', m.text().slice(0, 120)); });
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
for (let i = 0; i < 25; i += 1) {
  if (await p.evaluate(() => document.querySelectorAll('#paper-chat .pc-thumb').length) > 0) break;
  await p.mouse.click(640, 300);
  await p.waitForTimeout(400);
}
const r1 = await p.evaluate(() => {
  const t = document.querySelector('#paper-chat .pc-thumb');
  const rect = t.getBoundingClientRect();
  const top = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
  return { hasThumb: !!t, rect: Math.round(rect.x) + ',' + Math.round(rect.y) + ' ' + Math.round(rect.width) + 'x' + Math.round(rect.height), topEl: top ? top.tagName + '.' + top.className.toString().slice(0, 30) : 'null' };
});
console.log(JSON.stringify(r1));
const r2 = await p.evaluate(() => {
  document.querySelector('#paper-chat .pc-thumb').click();
  const v = document.getElementById('paper-viewer');
  return { viewerFound: !!v, open: v ? v.classList.contains('open') : null };
});
console.log('程序化点击:', JSON.stringify(r2));
await b.close();