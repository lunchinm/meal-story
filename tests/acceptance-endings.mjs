import { chromium } from 'playwright';
const pick = process.argv[2] || 'normal'; // normal | trial | hidden
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto('http://127.0.0.1:8081/?t=' + Date.now(), { waitUntil: 'commit' });
await page.waitForTimeout(4000);
await page.evaluate(() => { window.__wgDebugStart = { scene: 'act4.txt', label: 't_a4_publish' }; });
await page.evaluate(() => { const s = document.getElementById('paper-splash'); if (s && getComputedStyle(s).display !== 'none') s.click(); });
await page.waitForTimeout(300);
await page.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await page.waitForTimeout(500);
await page.evaluate(() => { const pr = document.getElementById('paper-press'); if (pr && getComputedStyle(pr).display !== 'none') pr.click(); });
await page.waitForTimeout(4000);
const want = {
  normal: '先发布通用版',
  trial: '先试行，按具体的人核对一遍',
  hidden: '先试行，按具体的人核对一遍',
}[pick];
for (let step = 0; step < 200; step++) {
  const end = await page.evaluate(() => window.__wgGetVar ? window.__wgGetVar('ending') : null);
  if (end) { console.log('ENDING', pick, end); break; }
  const st = await page.evaluate(() => {
    const opts = [...document.querySelectorAll('#paper-ui .pu-choices button, #paper-chat .pc-choices button')]
      .filter(b => b.getBoundingClientRect().width > 20);
    const send = document.querySelector('#paper-chat .pc-send');
    return { opts: opts.map(b => b.textContent.trim()), send: send ? send.textContent.trim() : null };
  });
  if (st.send) {
    const b = await page.evaluate(() => { const s = document.querySelector('#paper-chat .pc-send'); const r = s.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    await page.mouse.click(b.x, b.y); await page.waitForTimeout(500); continue;
  }
  if (st.opts.length) {
    let idx = st.opts.findIndex(o => o.includes(want));
    if (idx < 0) idx = 0;
    if (pick === 'hidden' && st.opts.some(o => o.includes('改：把不方便的地方换掉'))) idx = st.opts.findIndex(o => o.includes('改：把不方便的地方换掉'));
    if (pick === 'trial' && st.opts.some(o => o.includes('先不改'))) idx = st.opts.findIndex(o => o.includes('先不改'));
    const b = await page.evaluate(i => {
      const opts = [...document.querySelectorAll('#paper-ui .pu-choices button, #paper-chat .pc-choices button')].filter(x => x.getBoundingClientRect().width > 20);
      const r = opts[i].getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    }, idx);
    await page.mouse.click(b.x, b.y); await page.waitForTimeout(600); continue;
  }
  await page.mouse.click(800, 700); await page.waitForTimeout(420);
}
await browser.close();
