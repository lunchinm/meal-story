import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: 'block' });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8081/index.html');
await p.waitForTimeout(3000);
const info = await p.evaluate(() => {
  const hits = [...document.querySelectorAll('div')].filter((d) => d.textContent.includes('LANGUAGE SELECT') && d.children.length < 6);
  const top = hits[hits.length - 1];
  return {
    cls: top ? top.className : 'none',
    parentCls: top?.parentElement?.className ?? 'none',
    titleVisible: !!document.querySelector('.Title_main, [class*=Title]'),
    img: getComputedStyle(document.body).backgroundImage.slice(0, 60),
  };
});
console.log(JSON.stringify(info));
await b.close();