// 复用本地 Edge 的登录态：复制 profile 的关键文件，用 playwright 打开控制台，
// 成功后导出 storageState，供云端无头浏览器直接复用。
// 只读取 Cookie 与密钥副本，不改动正在运行的 Edge。
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const SRC = path.join(process.env.LOCALAPPDATA, 'Microsoft', 'Edge', 'User Data');
const DST = path.resolve('.artifacts', 'edge-profile', 'User Data');
const URL = 'https://console.volcengine.com/speech/new/experience/tts?projectName=default';
const STATE = path.resolve('.artifacts', 'voice-cloud', 'state.json');
const SHOT = path.resolve('.artifacts', 'voice-cloud', 'local-login.png');

function copy(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  if (!fs.existsSync(from)) return false;
  fs.copyFileSync(from, to);
  return true;
}

fs.rmSync(DST, { recursive: true, force: true });
const copied = [
  copy(path.join(SRC, 'Local State'), path.join(DST, 'Local State')),
  copy(path.join(SRC, 'Default', 'Network', 'Cookies'), path.join(DST, 'Default', 'Network', 'Cookies')),
  copy(path.join(SRC, 'Default', 'Preferences'), path.join(DST, 'Default', 'Preferences')),
];
console.log('复制结果:', copied, '→', DST);

const ctx = await chromium.launchPersistentContext(DST, {
  channel: 'msedge',
  headless: true,
  locale: 'zh-CN',
  viewport: { width: 1600, height: 1000 },
});

const page = ctx.pages()[0] ?? (await ctx.newPage());
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(6000);
console.log('当前地址:', page.url());

const loggedIn = !/login|passport|signin/i.test(page.url());
console.log('已登录:', loggedIn);

fs.mkdirSync(path.dirname(SHOT), { recursive: true });
await page.screenshot({ path: SHOT });
console.log('截图:', SHOT);

if (loggedIn) {
  fs.mkdirSync(path.dirname(STATE), { recursive: true });
  await ctx.storageState({ path: STATE });
  console.log('登录态已保存:', STATE);
}

await ctx.close();
