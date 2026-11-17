import { chromium } from '@playwright/test';
const dist = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/WebGAL-src/packages/webgal/dist';
const fs = await import('node:fs');
const jsClick = (p, l) => p.evaluate((label) => {
  const el = [...document.querySelectorAll('button,div,span')].filter((e) => e.textContent.trim() === label);
  const t = el[el.length - 1]; if (t) (t.closest('button') ?? t).dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, l);
const cases = {
  canteen_then_say: 'changeBg:bg_canteen.webp;\n米粒:背景后一句;',
  banner_then_say: 'changeBg:ch_banner_1.webp;\n米粒:章节图后一句;',
  narration_title: ':第一章《套餐的秘密》;\n米粒:接着一句;',
  say_then_banner: '米粒:先说一句;\nchangeBg:ch_banner_1.webp;',
};
const b = await chromium.launch();
for (const [name, sc] of Object.entries(cases)) {
  fs.writeFileSync(dist + '/game/scene/start.txt', sc, 'utf8');
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto('http://127.0.0.1:8082/');
  await p.waitForTimeout(1800);
  await p.mouse.click(640, 360); await p.waitForTimeout(600);
  await jsClick(p, '简体中文'); await p.waitForTimeout(600);
  await jsClick(p, '开始游戏'); await p.waitForTimeout(4500);
  console.log(name, '=> textbox:', await p.evaluate(() => !!document.querySelector('[class*="TextBox"]')));
  await p.close();
}
await b.close();