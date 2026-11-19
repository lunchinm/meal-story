import { chromium } from "playwright";
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1600,height:1000}});
const errs=[]; p.on("pageerror",e=>errs.push(e.message));
await p.goto("https://lunchinm.github.io/meal-story/?t="+Date.now(),{waitUntil:"commit",timeout:120000});
await p.waitForTimeout(9000);
await p.screenshot({path:"artifacts/live-title-t.png"});
console.log(await p.evaluate(()=>({ver:[...document.scripts].map(s=>s.src).find(s=>s.includes("theme-inject")), backup:[...document.querySelectorAll("[class*=Title_backup_background]")].map(e=>getComputedStyle(e).display)})));
console.log("errors",errs);
await b.close();
