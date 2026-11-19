import { chromium } from "playwright";
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1600,height:1000}});
await p.goto("http://127.0.0.1:8081/?t="+Date.now(),{waitUntil:"commit"}); await p.waitForTimeout(6000);
await p.evaluate(()=>document.getElementById("paper-splash").click()); await p.waitForTimeout(300);
// appreciation from title
await p.evaluate(()=>document.querySelector('#paper-title .pt-menu button[data-label="鉴赏模式"]').click()); await p.waitForTimeout(600);
await p.screenshot({path:"artifacts/af-appreciation.png"});
await p.evaluate(()=>{const a=document.getElementById("paper-appreciation");a.querySelector(".pa-close").click();}); await p.waitForTimeout(300);
// ending persistence
await p.evaluate(()=>{window.__wgDebugStart={scene:"act4.txt",label:"t_e_normal"};});
await p.evaluate(()=>document.querySelector('#paper-title .pt-menu button[data-label="开始游戏"]').click()); await p.waitForTimeout(400);
await p.evaluate(()=>{const pr=document.getElementById("paper-press");if(pr&&getComputedStyle(pr).display!=="none")pr.click();}); await p.waitForTimeout(5000);
await p.screenshot({path:"artifacts/af-ending-1.png"});
await p.waitForTimeout(4000);
await p.screenshot({path:"artifacts/af-ending-2.png"});
console.log("endingStill", await p.evaluate(()=>{const t=document.getElementById("paper-task");return t&&getComputedStyle(t).display!=="none"&&t.classList.contains("pt-ending");}));
await b.close();
