import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('ERR', e.message.slice(0, 100)));
await p.goto('http://127.0.0.1:8090/?t=' + Date.now());
await p.waitForTimeout(4000);
await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(7000);
for (let i = 0; i < 60; i += 1) {
  const st = await p.evaluate(() => ({
    task: document.getElementById('paper-task') ? getComputedStyle(document.getElementById('paper-task')).display : 'x',
    kind: document.getElementById('paper-task') ? (document.getElementById('paper-task').querySelector('.pt-tag') || {}).textContent : '',
    line: (window.__paperLine || '').slice(0, 16),
  }));
  if (st.task === 'block') { console.log('命中互动面板:', JSON.stringify(st)); await p.screenshot({ path: out + '/task-' + Date.now() + '.png' }); break; }
  await p.mouse.click(800, 700);
  await p.waitForTimeout(420);
}
await b.close();