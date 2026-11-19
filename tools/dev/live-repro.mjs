import { chromium } from "playwright";
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1600,height:1000}});
await p.goto("https://lunchinm.github.io/meal-story/?t="+Date.now(),{waitUntil:"commit"}); await p.waitForTimeout(6000);
await p.evaluate(()=>document.getElementById("paper-splash").click()); await p.waitForTimeout(300);
await p.evaluate(()=>document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click()); await p.waitForTimeout(300);
await p.evaluate(()=>document.getElementById("paper-press").click()); await p.waitForTimeout(5000);
await p.evaluate(()=>window.__wgOpenMenuTag(2)); await p.waitForTimeout(800);
await p.evaluate(()=>{const els=[...document.querySelectorAll("div,span")].filter(e=>e.children.length===0&&e.textContent.trim()==="标题");els[els.length-1].click();}); await p.waitForTimeout(700);
await p.evaluate(()=>{const c=document.getElementById("globalDialogContainer");if(c){const y=[...c.querySelectorAll('[class*="button"]')].find(x=>x.textContent.trim()==="是");if(y)y.click();}}); await p.waitForTimeout(1500);
console.log(await p.evaluate(()=>({gui:window.__wgGui(),title:getComputedStyle(document.getElementById("paper-title")).display,gameDom:!!document.querySelector('[class*="chooseContainer"], [class*="TextBox_Container"]')})));
await p.screenshot({path:"artifacts/live-r2.png"});
await b.close();

