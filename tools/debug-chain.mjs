import { chromium } from '@playwright/test';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1360, height: 860 } });
p.on('pageerror', (e) => console.log('ERR', e.message.slice(0, 160)));
await p.goto('http://127.0.0.1:4175/?node=a4-publish');
await p.waitForTimeout(700);
const ui = async () => p.evaluate(() => {
  const id = JSON.parse(localStorage.getItem('meal_save_v1') || '{}').nodeId;
  const kind = document.querySelector('.choice') ? 'choice'
    : document.querySelector('.food') ? 'plate'
    : document.querySelector('.ending-title') ? 'ending'
    : document.querySelector('.dialog') ? 'dialog'
    : document.querySelector('.phone') ? 'chat' : 'other';
  const txt = (document.querySelector('.dialog .text')?.textContent || '').slice(0, 14);
  return { id, kind, txt };
});
console.log('start', JSON.stringify(await ui()));
await p.locator('.choice').nth(1).click();
for (let i = 0; i < 24; i += 1) {
  await p.waitForTimeout(120);
  const s = await ui();
  console.log(i, JSON.stringify(s));
  if (s.kind === 'ending') break;
  if (s.kind === 'choice') { await p.locator('.choice').nth(0).click(); continue; }
  if (s.kind === 'dialog') { await p.locator('.dialog').click().catch(() => {}); }
}
await b.close();