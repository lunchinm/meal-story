import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8090/?t=' + Date.now());
await p.waitForTimeout(4000);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(7000);
for (let i = 0; i < 220; i += 1) {
  if (await p.evaluate(() => document.querySelectorAll('#paper-ui .pu-choices button').length)) break;
  await p.mouse.click(800, 700);
  await p.waitForTimeout(380);
}
const info = await p.evaluate(() => {
  const chip = document.querySelector('#paper-ui .pu-choices button');
  const r = chip.getBoundingClientRect();
  const pts = [[r.left + r.width/2, r.top + r.height/2]];
  const under = pts.map(([x,y]) => { const e = document.elementFromPoint(x,y); return e ? e.tagName + '.' + e.className.toString().slice(0,40) : 'null'; });
  const cont = document.querySelector('#chooseContainer');
  return { chipPE: getComputedStyle(chip).pointerEvents, boxPE: getComputedStyle(chip.parentElement).pointerEvents, under, contHTML: cont ? cont.outerHTML.slice(0,120) : 'none', contKids: cont ? cont.children.length : -1 };
});
console.log(JSON.stringify(info).slice(0, 500));
await b.close();