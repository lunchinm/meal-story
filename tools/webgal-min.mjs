import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block' });
const p = await ctx.newPage();
p.on('response', async (r) => {
  if (r.url().includes('start.txt')) console.log('START', r.status(), (await r.text().catch(()=>'')).slice(0, 40).replace(/\n/g,'|'));
});
await p.goto('http://127.0.0.1:8081/index.html');
await p.waitForTimeout(3000);
await p.mouse.click(640, 360);
await p.waitForTimeout(2500);
await p.screenshot({ path: 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out/webgal-min.png' });
console.log('shot');
await b.close();