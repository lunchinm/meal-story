import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('ERR:', e.message.slice(0, 160)));
p.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE:', m.text().slice(0, 160)); });
await p.goto('http://127.0.0.1:8082/?t=' + Date.now(), { waitUntil: 'commit' });
for (let i = 0; i < 12; i += 1) {
  const st = await p.evaluate(() => ({
    boot: !!document.getElementById('paper-boot'),
    title: document.querySelectorAll('#paper-title .pt-menu button').length,
    body: !!document.body,
  }));
  console.log(i, JSON.stringify(st));
  await p.waitForTimeout(300);
}
await p.waitForTimeout(3000);
console.log('final', JSON.stringify(await p.evaluate(() => ({ boot: !!document.getElementById('paper-boot'), btns: document.querySelectorAll('#paper-title .pt-menu button').length }))));
await b.close();