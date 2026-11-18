import { chromium } from '@playwright/test';
import fs from 'node:fs';
const set = new Set();
for (const a of [1,2,3,4]) { const j = JSON.parse(fs.readFileSync(`content/act${a}.json`,'utf8')); for (const n of j) if (n.text) set.add(String(n.text).replace(/\s+/g,'')); }
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8090/?t=' + Date.now());
await p.waitForTimeout(4000);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(7000);
for (let i = 0; i < 8; i += 1) {
  const row = await p.evaluate(() => {
    const rows = [].slice.call(document.querySelectorAll('#paper-chat .pc-row'));
    const card = document.querySelector('#paper-ui .pu-text');
    if (rows.length) { const last = rows[rows.length-1]; const bub = last.querySelector('.pc-bubble'); return { src:'chat', t: bub ? bub.textContent.trim() : '' }; }
    return { src:'card', t: card ? card.textContent.trim() : '' };
  });
  console.log(i, row.src, JSON.stringify(row.t.slice(0,20)), '命中:', set.has(row.t.replace(/\s+/g,'')));
  await p.mouse.click(800, 700);
  await p.waitForTimeout(700);
}
await b.close();