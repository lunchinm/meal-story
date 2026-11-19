import { chromium } from "playwright";
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1356,height:700}});
const errs=[]; p.on("pageerror",e=>errs.push(e.message.slice(0,100)));
await p.goto("http://127.0.0.1:8081/?t="+Date.now(),{waitUntil:"commit"});
await p.waitForTimeout(7000);
await p.evaluate(()=>document.querySelector("#paper-title .pt-menu button[data-label=\"开始游戏\"]").click());
await p.waitForTimeout(9000);
console.log("start",await p.evaluate(()=>({line:window.__paperLine,title:document.getElementById("paper-title")?getComputedStyle(document.getElementById("paper-title")).display:"none",chat:document.getElementById("paper-chat")?getComputedStyle(document.getElementById("paper-chat")).display:"none"})));
for(let i=0;i<4;i++){await p.mouse.click(680,450);await p.waitForTimeout(700);}
console.log("after",await p.evaluate(()=>({line:window.__paperLine,bubbles:document.querySelectorAll("#paper-chat .pc-bubble").length})));
await p.screenshot({path:"artifacts/local-y.png"});
console.log("errors",errs);
await b.close();
