import { chromium } from '@playwright/test';
import fs from 'node:fs';
const list = JSON.parse(fs.readFileSync('webgal-game/jump.json', 'utf8'));
const target = list.find((x) => x.act === 3) || list[2];
console.log('目标:', JSON.stringify(target));
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8123/?t=' + Date.now());
await p.waitForTimeout(4500);
let found = false;
for (let i = 0; i < 40; i += 1) {
  if (await p.evaluate(() => !!document.getElementById('paper-jump-btn'))) { found = true; break; }
  await p.waitForTimeout(200);
}
await p.evaluate(() => document.getElementById('paper-jump-btn').click());
await p.waitForTimeout(500);
const btns = await p.evaluate(() => [...document.querySelectorAll('#paper-jump button')].map((b) => b.textContent.slice(0, 24)));
console.log('面板条目数:', btns.length, '示例:', btns.slice(0, 3));
await p.evaluate((idx) => { document.querySelectorAll('#paper-jump button')[idx].click(); }, list.findIndex((x) => x.label === target.label));
await p.waitForTimeout(9000);
console.log('跳转后:', (await p.evaluate(() => window.__paperLine || '')).slice(0, 22));
await b.close();