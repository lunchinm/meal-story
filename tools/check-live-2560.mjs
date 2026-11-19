import { chromium } from "playwright";
const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:2560,height:1600},serviceWorkers:"block"}); const p=await ctx.newPage();
const errs=[]; p.on("pageerror",e=>errs.push(e.message.slice(0,100)));
await p.goto("https://lunchinm.github.io/meal-story/?t="+Date.now(),{waitUntil:"commit",timeout:120000});
const snaps=[];
for(const ms of [500,1500,4000]){await p.waitForTimeout(ms===500?500:1000);snaps.push(await p.evaluate(()=>({boot:!!document.getElementById("paper-boot"),title:document.getElementById("paper-title")?getComputedStyle(document.getElementById("paper-title")).display:"none",root:document.getElementById("root")?getComputedStyle(document.getElementById("root")).opacity:"none",ver:[...document.scripts].map(s=>s.src).find(s=>s.includes("theme-inject"))})));}
console.log(snaps);
await p.screenshot({path:"artifacts/live-title-w.png"});
await p.evaluate(()=>document.querySelector("#paper-title .pt-menu button[data-label=\"开始游戏\"]").click());
await p.waitForTimeout(9000);
const seen=[]; for(let i=0;i<7;i++){seen.push(await p.evaluate(()=>window.__paperLine||""));await p.mouse.click(1280,1100);await p.waitForTimeout(700);}
console.log(seen);
console.log(await p.evaluate(()=>({chat:getComputedStyle(document.getElementById("paper-chat")).display,bubbles:document.querySelectorAll("#paper-chat .pc-bubble").length})));
await p.screenshot({path:"artifacts/live-game-w.png"});
console.log("errors",errs);
await b.close();

