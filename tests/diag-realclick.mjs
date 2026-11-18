import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(3000);
const box = await p.evaluate(() => {
  const btn = document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]');
  const r = btn.getBoundingClientRect();
  const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
  return { x: r.x + r.width / 2, y: r.y + r.height / 2, top: top ? top.tagName + '.' + top.className.toString().slice(0, 30) : 'null' };
});
console.log('按钮中心:', JSON.stringify(box));
await p.mouse.click(box.x, box.y);
await p.waitForTimeout(4000);
console.log('真实点击后:', JSON.stringify(await p.evaluate(() => ({ line: (window.__paperLine || '').slice(0, 12), title: getComputedStyle(document.getElementById('paper-title')).display }))));
await b.close();