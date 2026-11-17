import { chromium } from '@playwright/test';
const dist = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/WebGAL-src/packages/webgal/dist';
const fs = await import('node:fs');
const jsClick = (p, l) => p.evaluate((label) => {
  const el = [...document.querySelectorAll('button,div,span')].filter((e) => e.textContent.trim() === label);
  const t = el[el.length - 1]; if (t) (t.closest('button') ?? t).dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, l);
const cases = {
  plain: ':第一句;\n米粒:第二句;',
  banner: 'changeBg:ch_banner_1.webp;\n:第一章《套餐的秘密》;\n米粒:第三句;',
  figure_no_id: 'changeBg:bg_chat.webp;\n米粒:先一句;\nchangeFigure:ch_zhoujian_normal.webp -center;\n周简:食堂二楼;',
  figure_with_id: 'changeBg:bg_chat.webp;\n米粒:先一句;\nchangeFigure:ch_zhoujian_normal.webp -center -id=zhoujian;\n周简:食堂二楼;',
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