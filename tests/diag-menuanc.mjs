import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
await p.evaluate(() => document.querySelector('#paper-ui .pu-tools button[data-label="选项"]').click());
await p.waitForTimeout(1500);
const chain = await p.evaluate(() => {
  const leaf = [...document.querySelectorAll('div,span')].find((e) => !e.children.length && e.textContent.trim() === '自动播放速度');
  if (!leaf) return 'not found';
  const out = [];
  let cur = leaf;
  for (let i = 0; i < 6 && cur; i += 1) {
    const r = cur.getBoundingClientRect();
    const cs = getComputedStyle(cur);
    out.push(cur.tagName.toLowerCase() + '.' + cur.className.toString().slice(0, 34) + ' | ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' | bg=' + cs.backgroundColor + ' | img=' + (cs.backgroundImage === 'none' ? '-' : 'yes'));
    cur = cur.parentElement;
  }
  return out;
});
console.log(JSON.stringify(chain, null, 1).slice(0, 900));
await b.close();