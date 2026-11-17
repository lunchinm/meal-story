import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block' });
const p = await ctx.newPage();
p.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE', m.text().slice(0, 120)); });
p.on('response', async (r) => {
  if (r.url().includes('start.txt')) {
    const t = await r.text().catch(() => '');
    console.log('START', r.status(), JSON.stringify(t.slice(0, 60)));
  }
});
await p.goto('http://127.0.0.1:8080/index.html');
await p.waitForTimeout(3500);
await p.mouse.click(720, 450);
await p.waitForTimeout(3000);
await p.screenshot({ path: 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out/webgal-after-start.png' });
await b.close();