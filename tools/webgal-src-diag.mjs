import { chromium } from '@playwright/test';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
p.on('console', (m) => { const t = m.text(); if (/error|Error|WARN|失败/.test(t)) console.log('C:', t.replace(/%c/g,'').slice(0,160)); });
p.on('pageerror', (e) => console.log('E:', e.message.slice(0,160)));
const jsClick = (l) => p.evaluate((label) => {
  const el = [...document.querySelectorAll('button,div,span')].filter((e) => e.textContent.trim() === label);
  const t = el[el.length - 1]; if (t) (t.closest('button') ?? t).dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, l);
await p.goto('http://127.0.0.1:8082/');
await p.waitForTimeout(2500);
await p.mouse.click(640, 360); await p.waitForTimeout(900);
await jsClick('简体中文'); await p.waitForTimeout(900);
await jsClick('开始游戏');
await p.waitForTimeout(15000);
console.log('state:', JSON.stringify(await p.evaluate(() => ({ box: !!document.querySelector('[class*="TextBox"]'), txt: (document.querySelector('[class*="TextBox"]')?.innerText||'').replace(/\s+/g,'').slice(0,20) }))));
await b.close();