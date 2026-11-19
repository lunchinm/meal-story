import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8123/?t=' + Date.now());
await p.waitForTimeout(4500);
await p.evaluate(() => { window.__wgDebugStart = { scene: 'act1.txt', label: 'seg1_3' }; });
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(9000);
let chip = null;
for (let i = 0; i < 40; i += 1) {
  chip = await p.evaluate(() => {
    const c = document.querySelector('#paper-chat .pc-send');
    if (!c) return null;
    const r = c.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, t: c.textContent.slice(0, 14) };
  });
  if (chip) break;
  await p.mouse.click(800, 700);
  await p.waitForTimeout(600);
}
console.log('回复条:', JSON.stringify(chip));
if (chip) {
  const before = await p.evaluate(() => window.__paperLine || '');
  await p.mouse.click(chip.x, chip.y);
  await p.waitForTimeout(1500);
  const st = await p.evaluate(() => ({
    chip: !!document.querySelector('#paper-chat .pc-send'),
    me: [...document.querySelectorAll('#paper-chat .pc-row.me .pc-bubble')].map((x) => x.textContent.slice(0, 12)),
    line: (window.__paperLine || '').slice(0, 14),
  }));
  console.log('点击后 回复条仍在:', st.chip, '| 我的气泡:', JSON.stringify(st.me.slice(-2)), '| 剧情:', before.slice(0,8), '→', st.line);
}
await b.close();