import { chromium } from '@playwright/test';
const dist = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/WebGAL-src/packages/webgal/dist';
const fs = await import('node:fs');
const variants = {
  'with-next': 'changeBg:bg_canteen.webp;\nchangeFigure:ch_mili_normal.webp -center -next;\n米粒:测试加next;',
  'no-anim': 'changeBg:bg_canteen.webp;\nchangeFigure:ch_mili_normal.webp -center -enter=none;\n米粒:测试关动画;',
};
const b = await chromium.launch();
for (const [name, script] of Object.entries(variants)) {
  fs.writeFileSync(dist + '/game/scene/start.txt', script, 'utf8');
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const jsClick = (l) => p.evaluate((label) => {
    const el = [...document.querySelectorAll('button,div,span')].filter((e) => e.textContent.trim() === label);
    const t = el[el.length - 1]; if (t) (t.closest('button') ?? t).dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }, l);
  await p.goto('http://127.0.0.1:8082/');
  await p.waitForTimeout(1800);
  await p.mouse.click(640, 360);
  await p.waitForTimeout(600);
  await jsClick('简体中文');
  await p.waitForTimeout(600);
  await jsClick('开始游戏');
  await p.waitForTimeout(2500);
  const t = (await p.locator('body').innerText()).replace(/\s+/g, '');
  console.log(name, '=>', t.includes('测试'));
  await p.close();
}
await b.close();