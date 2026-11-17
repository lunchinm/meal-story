import { chromium } from '@playwright/test';
const dist = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/WebGAL-src/packages/webgal/dist';
const fs = await import('node:fs');
const all = fs.readFileSync(dist + '/game/scene/act1.txt', 'utf8').split('\n');
const jsClick = (p, l) => p.evaluate((label) => {
  const el = [...document.querySelectorAll('button,div,span')].filter((e) => e.textContent.trim() === label);
  const t = el[el.length - 1]; if (t) (t.closest('button') ?? t).dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, l);
const b = await chromium.launch();
for (const n of [20, 40, 80, 160, all.length]) {
  fs.writeFileSync(dist + '/game/scene/start.txt', all.slice(0, n).join('\n'), 'utf8');
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto('http://127.0.0.1:8082/');
  await p.waitForTimeout(1800);
  await p.mouse.click(640, 360); await p.waitForTimeout(600);
  await jsClick(p, '简体中文'); await p.waitForTimeout(600);
  await jsClick(p, '开始游戏'); await p.waitForTimeout(4500);
  const ok = await p.evaluate(() => !!document.querySelector('[class*="TextBox"]'));
  console.log(n, 'lines => textbox:', ok);
  await p.close();
  if (!ok) break;
}
await b.close();