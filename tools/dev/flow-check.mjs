import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
const errs = [];
p.on('pageerror', e => errs.push(e.message.slice(0, 120)));
p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
await p.goto('http://127.0.0.1:8081/?t=' + Date.now(), { waitUntil: 'commit' });
await p.waitForTimeout(6000);
const splash = await p.evaluate(() => { const s = document.getElementById('paper-splash'); return s && getComputedStyle(s).display !== 'none'; });
console.log('splash', splash);
await p.evaluate(() => document.getElementById('paper-splash').click());
await p.waitForTimeout(800);
const title = await p.evaluate(() => ({ t: getComputedStyle(document.getElementById('paper-title')).display, bg: getComputedStyle(document.getElementById('paper-title')).backgroundImage.slice(0, 60) }));
console.log('title', title);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(600);
console.log('press', await p.evaluate(() => getComputedStyle(document.getElementById('paper-press')).display));
await p.evaluate(() => document.getElementById('paper-press').click());
await p.waitForTimeout(8000);
console.log('line', await p.evaluate(() => window.__paperLine));
// advance into chat
for (let i = 0; i < 4; i++) { await p.mouse.click(800, 700); await p.waitForTimeout(600); }
console.log('chat', await p.evaluate(() => ({ chat: getComputedStyle(document.getElementById('paper-chat')).display, bubbles: document.querySelectorAll('#paper-chat .pc-bubble').length })));
// settings
await p.evaluate(() => document.querySelector('#paper-ui .pu-tools button[data-label="选项"]').click());
await p.waitForTimeout(1200);
console.log('option', await p.evaluate(() => ({ gui: window.__wgGui(), card: getComputedStyle(document.querySelector('#paper-ui .pu-card')).display, ui: getComputedStyle(document.getElementById('paper-ui')).display })));
await p.screenshot({ path: 'artifacts/opt.png' });
await p.evaluate(() => window.__wgClosePanels());
await p.waitForTimeout(800);
// save
await p.evaluate(() => document.querySelector('#paper-ui .pu-tools button[data-label="存档"]').click());
await p.waitForTimeout(1200);
console.log('save', await p.evaluate(() => ({ gui: window.__wgGui(), slots: document.querySelectorAll('[class*="Save"] [class*="slot"], [class*="save"] [class*="item"]').length })));
await p.screenshot({ path: 'artifacts/save.png' });
await p.evaluate(() => window.__wgClosePanels());
await p.waitForTimeout(600);
// backlog
await p.evaluate(() => document.querySelector('#paper-ui .pu-tools button[data-label="回想"]').click());
await p.waitForTimeout(1200);
console.log('backlog', await p.evaluate(() => ({ gui: window.__wgGui(), items: document.querySelectorAll('[class*="backlog_item"]').length })));
await p.screenshot({ path: 'artifacts/backlog.png' });
console.log('errs', errs.slice(0, 6));
await b.close();
