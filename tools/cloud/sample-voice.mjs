// 采样脚本：弹出可见窗口，等手动选音色，然后对比选择前后的存储快照。
// 目的：找出音色选择被存在哪，之后靠改值切换，不再碰界面控件。
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const URL = 'https://console.volcengine.com/speech/new/experience/tts?projectName=default';
const STATE = path.resolve('.artifacts', 'voice-cloud', 'state.json');
const OUT = path.resolve('.artifacts', 'voice-cloud');
const MAX_MS = 10 * 60 * 1000;

const snap = async (page) => page.evaluate(() => {
  const dump = (store) => {
    const o = {};
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i);
      o[k] = (store.getItem(k) ?? '').slice(0, 2000);
    }
    return o;
  };
  return { local: dump(localStorage), session: dump(sessionStorage) };
});

const cardText = async (page) => page.evaluate(() => {
  const c = document.querySelector('.card');
  return c ? (c.innerText || '').trim().slice(0, 30) : '';
});

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: false, channel: 'msedge' });
const ctx = await browser.newContext({
  storageState: fs.existsSync(STATE) ? STATE : undefined,
  locale: 'zh-CN',
  viewport: { width: 1440, height: 900 },
});
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForFunction(() => (document.body.innerText || '').includes('单人模式'), { timeout: 60000 });
await page.waitForTimeout(4000);

const before = await snap(page);
const beforeCard = await cardText(page);
fs.writeFileSync(path.join(OUT, 'store-before.json'), JSON.stringify({ before, card: beforeCard }, null, 1));
console.log('当前音色:', beforeCard);
console.log('基线已存，请在窗口里点：音色 → 预付费音色 → 米粒');
console.log('完成后我会自动检测并保存');

const t0 = Date.now();
let picked = '';
while (Date.now() - t0 < MAX_MS) {
  await page.waitForTimeout(2500);
  const now = await cardText(page);
  if (now && now !== beforeCard && /米粒|许知夏|苏桃|周简|陆燃|罗师傅/.test(now)) {
    picked = now;
    break;
  }
}

if (!picked) {
  console.log('10 分钟内没检测到音色变化');
  await browser.close();
  process.exit(1);
}

await page.waitForTimeout(1500);
const after = await snap(page);
await page.screenshot({ path: path.join(OUT, 'picked.png') });

// 对比
const diff = [];
for (const scope of ['local', 'session']) {
  const a = before[scope] || {}, b = after[scope] || {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    if ((a[k] ?? '') !== (b[k] ?? '')) {
      diff.push({ scope, key: k, before: (a[k] ?? '').slice(0, 400), after: (b[k] ?? '').slice(0, 400) });
    }
  }
}
fs.writeFileSync(path.join(OUT, 'store-after.json'), JSON.stringify({ after, diff }, null, 1));
console.log('\n选中音色:', picked);
console.log('存储变化项:', diff.length);
for (const d of diff.slice(0, 20)) {
  console.log(`[${d.scope}] ${d.key}`);
  console.log(`   before: ${d.before.slice(0, 160)}`);
  console.log(`   after : ${d.after.slice(0, 160)}`);
}

await ctx.storageState({ path: STATE });
console.log('\n登录态已更新:', STATE);
await browser.close();
