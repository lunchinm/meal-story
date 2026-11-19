import { chromium } from "playwright";
const b=await chromium.launch();
for (const scale of [1,1.25]) {
  const ctx=await b.newContext({viewport:{width:2560,height:1600},deviceScaleFactor:scale,serviceWorkers:"block"});
  const p=await ctx.newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message.slice(0,120)));
  await p.goto("http://127.0.0.1:8081/?t="+Date.now(),{waitUntil:"commit"});
  await p.waitForTimeout(7000);
  const info=await p.evaluate(()=>{const t=document.getElementById("paper-title");const esc=document.getElementById("paper-esc");return {title:t?getComputedStyle(t).display:"none",menu:!!document.querySelector("#paper-title .pt-menu button"),esc:esc?getComputedStyle(esc).display:"none",nativeMenu:[...document.querySelectorAll("span")].filter(s=>["开始游戏","继续游戏"].includes(s.textContent.trim())).length};});
  await p.screenshot({path:`artifacts/title-2560-${scale}.png`});
  console.log(scale,info,"errors",errs);
  await p.evaluate(()=>document.querySelector("#paper-title .pt-menu button[data-label=\"开始游戏\"]").click());
  await p.waitForTimeout(8000);
  console.log(scale,"afterStart",await p.evaluate(()=>({line:window.__paperLine,title:getComputedStyle(document.getElementById("paper-title")).display,chat:getComputedStyle(document.getElementById("paper-chat")).display})));
  await p.screenshot({path:`artifacts/game-2560-${scale}.png`});
  await ctx.close();
}
await b.close();
