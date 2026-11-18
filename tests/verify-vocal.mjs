import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
const vocal = [], bad = [];
p.on('request', (r) => { if (r.url().includes('/vocal/')) vocal.push(r.url().split('/').pop()); });
p.on('response', (r) => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url().split('/').pop()); });
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(3000);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(7000);
for (let i = 0; i < 14; i += 1) { await p.keyboard.press('Space'); await p.waitForTimeout(700); }
const langEl = await p.evaluate(() => {
  const hits = [];
  document.querySelectorAll('div,span').forEach((e) => {
    if (e.children.length === 0 && e.textContent.trim() === 'LANGUAGE SELECT') {
      let cur = e, chain = [];
      for (let i = 0; i < 4 && cur; i += 1) { chain.push(cur.tagName.toLowerCase() + '.' + cur.className.toString()); cur = cur.parentElement; }
      hits.push(chain.join(' < '));
    }
  });
  return hits.slice(0, 2);
});
console.log('配音请求:', vocal.length, vocal.slice(0, 3).join(','));
console.log('资源异常:', bad.length ? bad.slice(0, 3).join(' | ') : 'none');
console.log('LANGUAGE 元素:', langEl.join(' ;; ') || '已消失');
await b.close();