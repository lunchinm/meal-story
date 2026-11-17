import { chromium } from '@playwright/test';
const out = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
const jsClick = (l) => p.evaluate((label) => {
  const el = [...document.querySelectorAll('button,div,span')].filter((e) => e.textContent.trim() === label);
  const t = el[el.length - 1]; if (t) (t.closest('button') ?? t).dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, l);
await p.goto('http://127.0.0.1:8082/');
await p.waitForTimeout(2000);
await p.mouse.click(640, 360); await p.waitForTimeout(700);
await jsClick('简体中文'); await p.waitForTimeout(700);
await jsClick('开始游戏');
await p.waitForTimeout(6000);
for (let i = 0; i < 90; i += 1) {
  const st = await p.evaluate(() => {
    const els = [...document.querySelectorAll('[class*="hoose"]')];
    const vis = els.filter((e) => { const r = e.getBoundingClientRect(); return r.width > 200 && r.height > 30; });
    return { count: els.length, vis: vis.length, txt: vis.length ? vis[0].textContent.replace(/\s+/g, '').slice(0, 24) : '' };
  });
  if (st.vis > 0) {
    await p.waitForTimeout(1000);
    const dump = await p.evaluate(() => {
      const c = [...document.querySelectorAll('[class*="hoose"]')].find((e) => e.getBoundingClientRect().height > 30);
      if (!c) return 'none';
      const r = c.getBoundingClientRect();
      const kids = [...c.children].slice(0, 4).map((k) => { const kr = k.getBoundingClientRect(); return k.tagName.toLowerCase() + '.' + k.className.toString().slice(0, 40) + ' ' + Math.round(kr.width) + 'x' + Math.round(kr.height); });
      return [c.className.toString(), Math.round(r.width) + 'x' + Math.round(r.height), ...kids].join(' || ');
    });
    console.log('step', i, JSON.stringify(st), dump);
    await p.screenshot({ path: out + '/wg48-choice-' + Date.now() + '.png' });
    break;
  }
  await p.keyboard.press('Space');
  await p.waitForTimeout(550);
}
await b.close();