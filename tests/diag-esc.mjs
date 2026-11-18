import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 80)));
await p.goto('http://127.0.0.1:8082/?t=' + Date.now());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(6000);
await p.evaluate(() => document.querySelector('#paper-ui .pu-tools button[data-label="选项"]').click());
await p.waitForTimeout(1500);
await p.screenshot({ path: out + '/cfg-paper-' + Date.now() + '.png' });
const btn = await p.evaluate(() => { const e = document.querySelector('#paper-esc button:nth-child(2)'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
console.log('标题按钮:', JSON.stringify(btn));
if (btn) { await p.mouse.click(btn.x, btn.y); await p.waitForTimeout(3000); }
const st = await p.evaluate(() => ({
  title: getComputedStyle(document.getElementById('paper-title')).display,
  hasBox: !!document.querySelector('[class*="TextBox_Container"]'),
  esc: document.getElementById('paper-esc') ? getComputedStyle(document.getElementById('paper-esc')).display : 'none',
}));
console.log('返回标题后:', JSON.stringify(st));
await p.screenshot({ path: out + '/after-title-' + Date.now() + '.png' });
await p.evaluate(() => { const b = document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]'); if (b) b.click(); });
await p.waitForTimeout(6000);
console.log('再次开始:', JSON.stringify(await p.evaluate(() => ({ line: (window.__paperLine || '').slice(0, 12), title: getComputedStyle(document.getElementById('paper-title')).display }))));
console.log('错误:', errs.length ? errs.slice(0, 2).join(' | ') : 'none');
await b.close();