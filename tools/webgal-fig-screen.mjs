import { chromium } from '@playwright/test';
const dist = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/WebGAL-src/packages/webgal/dist';
const fs = await import('node:fs');
fs.writeFileSync(dist + '/game/scene/start.txt', 'changeBg:bg_canteen.webp;\nchangeFigure:stand.webp -left;\n米粒:测试立绘显示;', 'utf8');
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const jsClick = (l) => p.evaluate((label) => {
  const el = [...document.querySelectorAll('button,div,span')].filter((e) => e.textContent.trim() === label);
  const t = el[el.length - 1]; if (t) (t.closest('button') ?? t).dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, l);
await p.goto('http://127.0.0.1:8082/');
await p.waitForTimeout(2000);
await p.mouse.click(640, 360);
await p.waitForTimeout(700);
await jsClick('简体中文');
await p.waitForTimeout(700);
await jsClick('开始游戏');
await p.waitForTimeout(4000);
await p.screenshot({ path: 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out/wg12-fig-screen.png' });
const info = await p.evaluate(() => ({
  textbox: !!document.querySelector('[class*=TextBox]'),
  textContent: (document.querySelector('[class*=TextBox]')?.innerText || '').slice(0, 40),
  figures: document.querySelectorAll('canvas').length,
}));
console.log(JSON.stringify(info));
await b.close();