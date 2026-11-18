import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('https://lunchinm.github.io/meal-story/?t=' + Date.now(), { timeout: 120000, waitUntil: 'domcontentloaded' });
await p.waitForTimeout(7000);
await p.mouse.click(640, 360); await p.waitForTimeout(2000);
await p.evaluate(() => {
  const el = [...document.querySelectorAll('span,div')].filter((e) => e.children.length === 0 && e.textContent.trim() === '简体中文');
  if (el.length) el[el.length - 1].click();
});
await p.waitForTimeout(5000);
const hasMenu = await p.evaluate(() => !!document.querySelector('#paper-title .pt-menu button'));
if (hasMenu) await p.evaluate(() => document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click());
await p.waitForTimeout(8000);
let thumb = false;
for (let i = 0; i < 20; i += 1) {
  if (await p.evaluate(() => document.querySelectorAll('#paper-chat .pc-thumb').length)) { thumb = true; break; }
  await p.mouse.click(640, 300);
  await p.waitForTimeout(600);
}
const st = await p.evaluate(() => ({
  chat: getComputedStyle(document.getElementById('paper-chat')).display,
  thumbs: document.querySelectorAll('#paper-chat .pc-thumb').length,
  tools: document.querySelectorAll('#paper-ui .pu-tools button').length,
}));
console.log('菜单:', hasMenu, '| 缩略图:', thumb, '| 状态:', JSON.stringify(st));
await p.screenshot({ path: 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out/live-chat-' + Date.now() + '.png' });
await b.close();