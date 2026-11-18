import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
const read = () => p.evaluate(() => {
  const c = document.querySelector('[class*="TextBox_Container"]');
  const t = c ? (c.innerText || '').replace(/\s+/g, '') : '';
  return (t.length % 3 === 0 ? t.slice(0, t.length / 3) : t).slice(0, 14);
});
const at = await p.evaluate(() => {
  const pts = [[640, 300], [640, 600]];
  return pts.map(([x, y]) => {
    const el = document.elementFromPoint(x, y);
    return x + ',' + y + ' → ' + (el ? el.tagName + '.' + el.className.toString().slice(0, 30) : 'null');
  });
});
console.log(at.join(' | '));
// 先把纸卡设为可穿透，再分别点两处
await p.evaluate(() => { document.querySelector('#paper-ui .pu-card').style.pointerEvents = 'none'; });
for (const [x, y] of [[640, 300], [640, 600], [640, 300], [640, 600]]) {
  const before = await read();
  await p.mouse.click(x, y);
  await p.waitForTimeout(700);
  const after = await read();
  console.log(`click ${x},${y}:`, before === after ? '无变化' : '推进了');
}
await b.close();