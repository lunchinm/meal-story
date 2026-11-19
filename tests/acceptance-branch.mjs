import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.on('pageerror', e => console.log('PAGEERR', e.message.slice(0, 300)));
await page.goto('http://127.0.0.1:8081/?t=' + Date.now(), { waitUntil: 'commit' });
await page.waitForTimeout(4000);
await page.evaluate(() => { window.__wgDebugStart = { scene: 'act3.txt', label: 't_a3_ask' }; });
await page.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
for (let i = 0; i < 16; i++) { await page.waitForTimeout(500); const t = await page.evaluate(() => getComputedStyle(document.getElementById('paper-title')).display); if (t === 'none') break; }
await page.waitForTimeout(1500);
console.log('boot state', await page.evaluate(() => ({
  title: getComputedStyle(document.getElementById('paper-title')).display,
  line: window.__paperLine || '', name: window.__paperName || '',
  chat: getComputedStyle(document.getElementById('paper-chat')).display,
  choose: document.querySelectorAll('[class*="chooseContainer"]').length,
  box: document.querySelectorAll('[class*="TextBox_Container"]').length,
  dbg: window.__wgDebugStart || null,
  varLine: window.__wgGetVar ? window.__wgGetVar('line') : 'noapi',
  titleDebug: window.__dbgTitle || null,
  menuClicked: window.__menuClicked || null,
  naCall: window.__naCall || null,
})));
for (let i = 0; i < 20; i++) {
  const n = await page.evaluate(() => document.querySelectorAll('#paper-ui .pu-choices button, #paper-chat .pc-choices button').length);
  if (n > 0) break;
  await page.mouse.click(800, 700); await page.waitForTimeout(500);
}
const box = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('#paper-ui .pu-choices button, #paper-chat .pc-choices button')];
  const b = btns.find(x => x.textContent.includes('先问一句'));
  if (!b) return null;
  const r = b.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2, text: b.textContent };
});
console.log('option', box);
if (box) await page.mouse.click(box.x, box.y);
await page.waitForTimeout(800);
// 连续推进，检查隐藏支线（photo 文案）或 fallback
let result = 'TIMEOUT';
for (let i = 0; i < 60; i++) {
  const line = await page.evaluate(() => window.__paperLine || '');
  if (line.includes('结账以后她没急着走') || line.includes('拍我们为什么买这些')) { result = 'PHOTO'; break; }
  if (line.includes('偶遇记录')) { result = 'FALLBACK'; break; }
  if (i % 10 === 0) console.log(i, line.slice(0, 24));
  await page.mouse.click(800, 700); await page.waitForTimeout(450);
}
console.log('gate:', result);
await browser.close();
