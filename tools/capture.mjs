import { chromium } from 'playwright';
import fs from 'node:fs';
fs.mkdirSync('artifacts/shots', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const startAt = async (scene, label, wait = 7000) => {
  await page.evaluate(([s, l]) => { window.__wgDebugStart = { scene: s, label: l }; }, [scene, label]);
  await page.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
  await page.waitForTimeout(wait);
};
const back = async () => { await page.evaluate(() => window.__wgBackToTitle && window.__wgBackToTitle()); await page.waitForTimeout(2000); };
await page.goto('http://127.0.0.1:8081/?t=' + Date.now(), { waitUntil: 'commit' });
await page.waitForTimeout(4500);
await page.screenshot({ path: 'artifacts/shots/title.png' });
await startAt('act1.txt', 'seg1_1', 6500);
for (let i = 0; i < 3; i++) { await page.mouse.click(800, 700); await page.waitForTimeout(700); }
await page.screenshot({ path: 'artifacts/shots/chat.png' });
await back();
await startAt('act2.txt', 't_a2_plate', 7000);
await page.screenshot({ path: 'artifacts/shots/plate.png' });
await back();
// 隐藏结局真实路线
await startAt('act4.txt', 't_a4_publish', 6000);
for (let step = 0; step < 220; step++) {
  const end = await page.evaluate(() => window.__wgGetVar ? window.__wgGetVar('ending') : null);
  if (end) { await page.waitForTimeout(900); break; }
  const st = await page.evaluate(() => {
    const opts = [...document.querySelectorAll('#paper-ui .pu-choices button, #paper-chat .pc-choices button')].filter(b => b.getBoundingClientRect().width > 20);
    const send = document.querySelector('#paper-chat .pc-send');
    return { opts: opts.map(b => b.textContent.trim()), send: !!send };
  });
  if (st.send) {
    const b = await page.evaluate(() => { const s = document.querySelector('#paper-chat .pc-send'); const r = s.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    await page.mouse.click(b.x, b.y); await page.waitForTimeout(450); continue;
  }
  if (st.opts.length) {
    let idx = st.opts.findIndex(o => o.includes('先试行'));
    if (st.opts.some(o => o.includes('改：把不方便的地方换掉'))) idx = st.opts.findIndex(o => o.includes('改：把不方便的地方换掉'));
    if (idx < 0) idx = 0;
    const b = await page.evaluate(i => {
      const opts = [...document.querySelectorAll('#paper-ui .pu-choices button, #paper-chat .pc-choices button')].filter(x => x.getBoundingClientRect().width > 20);
      const r = opts[i].getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    }, idx);
    await page.mouse.click(b.x, b.y); await page.waitForTimeout(500); continue;
  }
  await page.mouse.click(800, 700); await page.waitForTimeout(380);
}
await page.screenshot({ path: 'artifacts/shots/ending.png' });
console.log('ending', await page.evaluate(() => window.__wgGetVar('ending')));
await browser.close();
