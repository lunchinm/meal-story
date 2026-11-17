import { chromium } from '@playwright/test';
const rel = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/webgal';
const fs = await import('node:fs');
const all = fs.readFileSync(rel + '/game/scene/act1.txt', 'utf8').split('\n');
const jsClick = (p, l) => p.evaluate((label) => {
  const el = [...document.querySelectorAll('button,div,span')].filter((e) => e.textContent.trim() === label);
  const t = el[el.length - 1]; if (t) (t.closest('button') ?? t).dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, l);
const b = await chromium.launch();
const test = async (n) => {
  fs.writeFileSync(rel + '/game/scene/start.txt', all.slice(0, n).join('\n'), 'utf8');
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto('http://127.0.0.1:8083/');
  await p.waitForTimeout(1600);
  await p.mouse.click(640, 360); await p.waitForTimeout(500);
  await jsClick(p, '简体中文'); await p.waitForTimeout(500);
  await jsClick(p, '开始游戏'); await p.waitForTimeout(3500);
  const ok = await p.evaluate(() => !!document.querySelector('[class*="TextBox"]'));
  await p.close();
  return ok;
};
let lo = 1, hi = all.length;
if (!(await test(hi))) {
  while (lo < hi - 1) {
    const mid = Math.floor((lo + hi) / 2);
    const ok = await test(mid);
    console.log('prefix', mid, ok ? 'OK' : 'FAIL');
    if (ok) lo = mid; else hi = mid;
  }
  console.log('第一处失败在行', hi);
  for (let i = Math.max(0, hi - 4); i < Math.min(all.length, hi + 1); i += 1) console.log(i + 1, ':', all[i]);
} else {
  console.log('全文可以跑通');
}
await b.close();