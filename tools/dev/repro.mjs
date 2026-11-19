import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
p.on('pageerror', e => console.log('PAGEERR', e.message.slice(0, 120)));
const gui = () => p.evaluate(() => window.__wgGui());
await p.goto('http://127.0.0.1:8081/?t=' + Date.now(), { waitUntil: 'commit' });
await p.waitForTimeout(6000);
await p.evaluate(() => document.getElementById('paper-splash').click()); await p.waitForTimeout(300);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click()); await p.waitForTimeout(300);
await p.evaluate(() => document.getElementById('paper-press').click()); await p.waitForTimeout(5000);
for (let i = 0; i < 4; i++) { await p.mouse.click(800, 700); await p.waitForTimeout(400); }
// A: settings -> 标题 -> 是
await p.evaluate(() => window.__wgOpenMenuTag(2)); await p.waitForTimeout(800);
await p.screenshot({ path: 'artifacts/r-option.png' });
// click native bottom 标题 button
const t = await p.evaluate(() => { const els = [...document.querySelectorAll('div,span')].filter(e => e.children.length === 0 && e.textContent.trim() === '标题'); if (els.length) { els[els.length - 1].click(); return els.length; } return 0; });
await p.waitForTimeout(800);
console.log('after 标题 click, dialog?', await p.evaluate(() => !!document.getElementById('globalDialogContainer') && getComputedStyle(document.getElementById('globalDialogContainer')).display), 'gui', await gui());
await p.screenshot({ path: 'artifacts/r-dialog.png' });
// click 是
const yes = await p.evaluate(() => { const c = document.getElementById('globalDialogContainer'); if (!c) return null; const btns = [...c.querySelectorAll('[class*="button"]')]; const y = btns.find(x => x.textContent.trim() === '是'); if (y) { y.click(); return y.textContent; } return btns.map(x => x.textContent); });
await p.waitForTimeout(1000);
console.log('yes clicked', yes, 'gui', await gui());
await p.screenshot({ path: 'artifacts/r-after-yes.png' });
await b.close();
