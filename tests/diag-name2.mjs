import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
for (let i = 0; i < 5; i += 1) { await p.mouse.click(640, 300); await p.waitForTimeout(700); }
const info = await p.evaluate(() => {
  const boxes = [...document.querySelectorAll('[class*="showname"]')];
  const first = boxes[0];
  return {
    count: boxes.length,
    cls: first ? first.className.toString() : '',
    text: first ? (first.innerText || '').replace(/\s+/g, '') : '',
    leafs: first ? [...first.querySelectorAll('*')].slice(0, 6).map((e) => e.className.toString().slice(0, 20) + '|' + (e.textContent || '').trim() + '|' + e.children.length) : [],
    inBox: first && first.closest('#textBoxMain') ? 'in textBoxMain' : 'outside',
  };
});
console.log(JSON.stringify(info).slice(0, 500));
await b.close();