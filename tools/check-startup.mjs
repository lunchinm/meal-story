import { chromium } from "playwright";
const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:2560,height:1600},deviceScaleFactor:1,serviceWorkers:"block"}); const p=await ctx.newPage();
const errs=[]; p.on("pageerror",e=>errs.push(e.message.slice(0,100)));
await p.goto("http://127.0.0.1:8081/?t="+Date.now(),{waitUntil:"commit"});
for (const ms of [400,1200,3000,6000]) { await p.waitForTimeout(ms===400?400:ms-400); await p.screenshot({path:`artifacts/start-${ms}.png`}); console.log(ms, await p.evaluate(()=>({boot:!!document.getElementById("paper-boot"),pre:!!document.getElementById("paper-preload"),title:document.getElementById("paper-title")?getComputedStyle(document.getElementById("paper-title")).display:"none",root:getComputedStyle(document.getElementById("root")).opacity}))); }
console.log("errors",errs);
await b.close();
