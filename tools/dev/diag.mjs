import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
p.on('pageerror', e => console.log('PAGEERR', e.message.slice(0, 100)));
await p.goto('http://127.0.0.1:8081/?t=' + Date.now(), { waitUntil: 'commit' });
await p.waitForTimeout(6000);
await p.evaluate(() => document.getElementById('paper-splash').click()); await p.waitForTimeout(400);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click()); await p.waitForTimeout(400);
await p.evaluate(() => document.getElementById('paper-press').click()); await p.waitForTimeout(6000);
for (let i = 0; i < 4; i++) { await p.mouse.click(800, 700); await p.waitForTimeout(500); }
// SAVE
await p.evaluate(() => window.__wgOpenMenuTag(0)); await p.waitForTimeout(1000);
const saveInfo = await p.evaluate(() => {
  const slots = [...document.querySelectorAll('[class*="Save"] [class*="slot"], [class*="save"] [class*="item"], [class*="Save_main"] [class*="item"]')];
  return { slotCount: slots.length, lsKeys: Object.keys(localStorage).filter(k => /save|webgal/i.test(k)).slice(0, 10) };
});
console.log('save', saveInfo);
// click first slot-like element
const clicked = await p.evaluate(() => {
  const el = document.querySelector('[class*="Save_main"] [class*="item"], [class*="save"] [class*="slot"]');
  if (el) { el.click(); return el.className.slice(0, 40); }
  return null;
});
await p.waitForTimeout(800);
console.log('clickedSlot', clicked, 'lsAfter', await p.evaluate(() => Object.keys(localStorage).filter(k => /save/i.test(k)).length));
await p.screenshot({ path: 'artifacts/d-save.png' });
await p.evaluate(() => window.__wgClosePanels()); await p.waitForTimeout(500);
// BACKLOG
await p.evaluate(() => window.__wgOpenBacklog()); await p.waitForTimeout(1000);
console.log('backlogText', await p.evaluate(() => (document.querySelector('[class*="Backlog_main"]:not([class*="out"])') || {}).innerText?.slice(0, 200)));
await p.screenshot({ path: 'artifacts/d-backlog.png' });
await p.evaluate(() => window.__wgClosePanels()); await p.waitForTimeout(400);
// FLOWCHART via menu tag 3
await p.evaluate(() => window.__wgOpenMenuTag(3)); await p.waitForTimeout(1000);
await p.screenshot({ path: 'artifacts/d-flow.png' });
console.log('flowText', await p.evaluate(() => (document.querySelector('[class*="Flowchart_main"]:not([class*="out"])') || {}).innerText?.slice(0, 120)));
await b.close();
