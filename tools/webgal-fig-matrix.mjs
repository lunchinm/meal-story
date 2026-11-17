import { chromium } from '@playwright/test';
const dist = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/WebGAL-src/packages/webgal/dist';
const fs = await import('node:fs');
const variants = {
  'no-options': 'changeFigure:ch_mili_normal.webp;\n米粒:测试;',
  'center-only': 'changeFigure:ch_mili_normal.webp -center;\n米粒:测试;',
  'with-id': 'changeFigure:ch_mili_normal.webp -center -id=mili;\n米粒:测试;',
  'no-ext': 'changeFigure:ch_mili_normal;\n米粒:测试;',
};
const b = await chromium.launch();
for (const [name, script] of Object.entries(variants)) {
  fs.writeFileSync(dist + '/game/scene/start.txt', script, 'utf8');
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto('http://127.0.0.1:8082/');
  await p.waitForTimeout(2200);
  await p.mouse.click(640, 360);
  await p.waitForTimeout(900);
  await p.evaluate(() => {
    const el = [...document.querySelectorAll('button,div,span')].filter((e) => e.textContent.trim() === '简体中文');
    const t = el[el.length - 1]; if (t) (t.closest('button') ?? t).dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await p.waitForTimeout(900);
  await p.evaluate(() => {
    const el = [...document.querySelectorAll('button,div,span')].filter((e) => e.textContent.trim() === '开始游戏');
    const t = el[el.length - 1]; if (t) (t.closest('button') ?? t).dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await p.waitForTimeout(3200);
  const txt = (await p.locator('body').innerText()).replace(/\s+/g, '');
  console.log(name, '=> text:', txt.includes('测试'), '| figure:', await p.evaluate(() => !!document.querySelector('img[src*="figure"], canvas')));
  await p.close();
}
await b.close();