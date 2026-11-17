import { chromium } from '@playwright/test';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const jsClick = (l) => p.evaluate((label) => {
  const el = [...document.querySelectorAll('button,div,span')].filter((e) => e.textContent.trim() === label);
  const t = el[el.length - 1]; if (t) (t.closest('button') ?? t).dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, l);
await p.goto('http://127.0.0.1:8083/');
await p.waitForTimeout(2200);
await p.mouse.click(640, 360); await p.waitForTimeout(700);
await jsClick('简体中文'); await p.waitForTimeout(700);
await jsClick('开始游戏'); await p.waitForTimeout(2500);
await p.keyboard.press('Space'); await p.waitForTimeout(900);
await p.keyboard.press('Space'); await p.waitForTimeout(1500);
const info = await p.evaluate(() => {
  const hits = [...document.querySelectorAll('*')].filter((e) => e.textContent.trim() === '周简' && e.children.length === 0);
  return hits.map((e) => ({ tag: e.tagName, cls: e.className.toString(), parent: e.parentElement?.className.toString() }));
});
console.log(JSON.stringify(info, null, 1));
const rules = await p.evaluate(() => {
  const el = document.querySelector('[class*="TextBox_Background"]');
  const sheet = [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules]; } catch { return []; } });
  return sheet.filter((r) => (r.selectorText || '').includes('TextBox_Background')).map((r) => r.selectorText).slice(0, 8);
});
console.log('rules:', JSON.stringify(rules));
await b.close();