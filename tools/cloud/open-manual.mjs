// 开一个有画面的浏览器窗口，带着登录态停在语音合成页，供手动点击。
// 窗口保持打开，直到脚本被终止。
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const URL = 'https://console.volcengine.com/speech/new/experience/tts?projectName=default';
const STATE = path.resolve('.artifacts', 'voice-cloud', 'state.json');

if (!fs.existsSync(STATE)) {
  console.error('缺登录态:', STATE);
  process.exit(1);
}

const browser = await chromium.launch({
  headless: false,
  channel: 'msedge',
  args: ['--disable-blink-features=AutomationControlled'],
});
const ctx = await browser.newContext({
  storageState: STATE,
  locale: 'zh-CN',
  viewport: { width: 1440, height: 900 },
});
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForTimeout(3000);
console.log('窗口已打开，停留 30 分钟');
await page.waitForTimeout(30 * 60 * 1000);
await browser.close();

