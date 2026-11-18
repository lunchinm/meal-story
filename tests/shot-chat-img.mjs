import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
let found = false;
for (let i = 0; i < 25; i += 1) {
  const n = await p.evaluate(() => document.querySelectorAll('#paper-chat .pc-thumb').length);
  if (n > 0) { found = true; break; }
  await p.mouse.click(640, 300);
  await p.waitForTimeout(400);
}
console.log('缩略图出现:', found);
if (found) {
  await p.waitForTimeout(500);
  await p.screenshot({ path: out + '/chat-img-' + Date.now() + '.png' });
  const r = await p.evaluate(() => {
    const t = document.querySelector('#paper-chat .pc-thumb');
    const b = t.getBoundingClientRect();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  });
  await p.mouse.click(r.x, r.y);
  await p.waitForTimeout(800);
  const opened = await p.evaluate(() => document.getElementById('paper-viewer').classList.contains('open'));
  console.log('点开大图:', opened);
  await p.screenshot({ path: out + '/chat-img-big-' + Date.now() + '.png' });
  await p.mouse.click(80, 80);
  await p.waitForTimeout(600);
  const closed = await p.evaluate(() => !document.getElementById('paper-viewer').classList.contains('open'));
  console.log('点空白关闭:', closed);
  const stillThere = await p.evaluate(() => document.querySelectorAll('#paper-chat .pc-thumb').length);
  console.log('关闭后缩略图仍在:', stillThere);
}
await b.close();