import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8082/');
await p.waitForTimeout(2500);
await p.mouse.click(640, 360); await p.waitForTimeout(800);
const jsClick = (l) => p.evaluate((label) => {
  const el = [...document.querySelectorAll('button,div,span')].filter((e) => e.textContent.trim() === label);
  const t = el[el.length - 1]; if (t) (t.closest('button') ?? t).dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, l);
await jsClick('简体中文'); await p.waitForTimeout(800);
await jsClick('开始游戏'); await p.waitForTimeout(7000);
for (let i = 0; i < 12; i += 1) { await p.keyboard.press('Space'); await p.waitForTimeout(400); }
// 点自绘「选项」图标
const rect = await p.evaluate(() => {
  const btn = document.querySelector('#paper-ui .pu-tools button[data-label="选项"]');
  if (!btn) return null;
  const r = btn.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
if (rect) { await p.mouse.click(rect.x, rect.y); await p.waitForTimeout(1500); }
const opened = await p.evaluate(() => (document.body.innerText.includes('音量') || document.body.innerText.includes('文字速度')));
console.log('设置面板打开:', opened);
await p.screenshot({ path: out + '/wg51-settings-' + Date.now() + '.png' });
await b.close();