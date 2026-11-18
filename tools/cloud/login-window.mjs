// 本地弹一个可见的登录窗口，由本人手动登录；
// 登录成功后导出 storageState，供云端无头浏览器复用。
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const URL = 'https://console.volcengine.com/speech/new/experience/tts?projectName=default';
const STATE = path.resolve('.artifacts', 'voice-cloud', 'state.json');
const SHOT = path.resolve('.artifacts', 'voice-cloud', 'login-window.png');
const MAX_MS = 8 * 60 * 1000;

const browser = await chromium.launch({ headless: false, channel: 'msedge' });
const ctx = await browser.newContext({ locale: 'zh-CN', viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
console.log('窗口已打开，请在其中登录火山引擎账号');

const t0 = Date.now();
let ok = false;
while (Date.now() - t0 < MAX_MS) {
  await page.waitForTimeout(3000);
  const u = page.url();
  if (!/login|passport|signin/i.test(u)) {
    ok = true;
    break;
  }
}

if (ok) {
  await page.waitForTimeout(5000);
  fs.mkdirSync(path.dirname(STATE), { recursive: true });
  await ctx.storageState({ path: STATE });
  await page.screenshot({ path: SHOT });
  console.log('登录成功，状态已保存:', STATE);
  console.log('落地页:', page.url());
} else {
  console.log('超时未登录');
}

await browser.close();
