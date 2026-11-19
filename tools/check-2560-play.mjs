import { chromium } from "playwright";
const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:2560,height:1600},serviceWorkers:"block"}); const p=await ctx.newPage();
const errs=[]; p.on("pageerror",e=>errs.push(e.message.slice(0,100)));
await p.goto("http://127.0.0.1:8081/?t="+Date.now(),{waitUntil:"commit"});
await p.waitForTimeout(7000);
console.log("title",await p.evaluate(()=>({t:getComputedStyle(document.getElementById("paper-title")).display,buttons:document.querySelectorAll("#paper-title .pt-menu button").length,esc:getComputedStyle(document.getElementById("paper-esc")).display})));
await p.screenshot({path:"artifacts/2560-title.png"});
await p.evaluate(()=>document.querySelector("#paper-title .pt-menu button[data-label=\"开始游戏\"]").click());
await p.waitForTimeout(9000);
const seen=[];
for(let i=0;i<7;i++){ seen.push(await p.evaluate(()=>window.__paperLine||"")); await p.mouse.click(1280,1100); await p.waitForTimeout(700); }
console.log("lines",seen);
console.log("state",await p.evaluate(()=>({chat:getComputedStyle(document.getElementById("paper-chat")).display,bubbles:document.querySelectorAll("#paper-chat .pc-bubble").length,name:window.__paperName})));
await p.screenshot({path:"artifacts/2560-game.png"});
console.log("errors",errs);
await b.close();
