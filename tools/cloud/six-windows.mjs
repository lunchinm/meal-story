// 六窗口合成台：每个窗口对应一个角色，人工配好音色后，按指令串行批量合成。
// 指令：写 .artifacts/voice-new/control.json  {"action":"run","role":"米粒"}
// 状态：.artifacts/voice-new/status.json 实时更新
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const URL = 'https://console.volcengine.com/speech/new/experience/tts?projectName=default';
const STATE = path.resolve('.artifacts', 'voice-cloud', 'state.json');
const PLAN = path.resolve('.artifacts', 'voice-cleanup', 'tts-plan.json');
const OUT = path.resolve('.artifacts', 'voice-new');
const CTRL = path.join(OUT, 'control.json');
const STATUS = path.join(OUT, 'status.json');
const LOGF = path.join(OUT, 'run.log');

const ROLES = ['米粒', '许知夏', '苏桃', '周简', '陆燃', '罗师傅'];
const OFFICIAL = /Vivi|青年|温柔|小何|阿虎|小明|梓辛|云舟|刘飞/i;

fs.mkdirSync(OUT, { recursive: true });
const plan = JSON.parse(fs.readFileSync(PLAN, 'utf8'));
const byRole = {};
for (const t of plan.tasks) (byRole[t.role] ||= []).push(t);

const log = (m) => {
  const line = `[${new Date().toISOString().slice(11, 19)}] ${m}`;
  console.log(line);
  fs.appendFileSync(LOGF, line + '\n');
};

const browser = await chromium.launch({ headless: false, channel: 'msedge' });
const wins = {};

for (const role of ROLES) {
  const ctx = await browser.newContext({
    storageState: fs.existsSync(STATE) ? STATE : undefined,
    locale: 'zh-CN',
    viewport: { width: 1180, height: 800 },
  });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  try {
    await page.waitForFunction(() => (document.body.innerText || '').includes('单人模式'), { timeout: 60000 });
  } catch { /* 继续 */ }
  // 角标：告诉用户这个窗口该配哪个角色
  await page.evaluate((r) => {
    const d = document.createElement('div');
    d.id = '__role_badge';
    d.textContent = `请配音色：${r}`;
    d.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:2147483647;height:34px;'
      + 'background:#111;color:#fff;font:16px/34px system-ui;text-align:center;pointer-events:none';
    document.body.appendChild(d);
  }, role).catch(() => {});
  wins[role] = { page, ctx, total: (byRole[role] || []).length, done: 0, running: false };
  log(`窗口已开：${role}（${wins[role].total} 句待合成）`);
}

const cardText = (page) => page.evaluate(() => {
  const c = document.querySelector('.card');
  return c ? (c.innerText || '').trim().split('\n')[0] : '';
}).catch(() => '');

async function synthOne(page, text) {
  await page.evaluate(() => document.querySelector('.ProseMirror').focus());
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Delete');
  await page.keyboard.type(text, { delay: 6 });
  await page.waitForTimeout(250);
  const respP = page.waitForResponse((r) => {
    const ct = r.headers()['content-type'] || '';
    return ct.includes('audio') && r.status() === 200;
  }, { timeout: 90000 });
  const btn = page.getByText('合成试听', { exact: false }).first();
  await btn.click({ force: true, timeout: 15000 });
  const resp = await respP;
  return await resp.body();
}

let busy = false;

async function runRole(role) {
  const w = wins[role];
  if (!w || w.running) return;
  const card = await cardText(w.page);
  if (OFFICIAL.test(card)) {
    log(`拒绝执行 ${role}：当前音色还是「${card}」，请先选成复刻音色`);
    return;
  }
  w.running = true;
  busy = true;
  const list = byRole[role] || [];
  log(`开始 ${role}：${list.length} 句，音色=${card}`);
  let ok = 0, fail = 0;
  for (let i = 0; i < list.length; i++) {
    const t = list[i];
    const dest = path.join(OUT, `${t.id}.mp3`);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 2000) { ok++; w.done++; continue; }
    try {
      const buf = await synthOne(w.page, t.text);
      if (buf && buf.length > 1500) {
        fs.writeFileSync(dest, buf);
        ok++; w.done++;
      } else { fail++; }
    } catch (e) {
      fail++;
      log(`  ${t.id} 失败：${String(e).slice(0, 80)}`);
    }
    if ((i + 1) % 10 === 0) log(`  ${role} 进度 ${i + 1}/${list.length}（成功 ${ok} 失败 ${fail}）`);
  }
  log(`完成 ${role}：成功 ${ok}，失败 ${fail}`);
  w.running = false;
  busy = false;
}

// 主循环：更新状态 + 响应指令
while (true) {
  const st = {};
  for (const role of ROLES) st[role] = { card: await cardText(wins[role].page), done: wins[role].done, total: wins[role].total, running: wins[role].running };
  fs.writeFileSync(STATUS, JSON.stringify({ at: new Date().toISOString(), busy, wins: st }, null, 1));

  if (!busy && fs.existsSync(CTRL)) {
    try {
      const cmd = JSON.parse(fs.readFileSync(CTRL, 'utf8'));
      if (cmd.action === 'run' && cmd.role) {
        fs.unlinkSync(CTRL);
        runRole(cmd.role);
        continue;
      }
    } catch { /* 忽略解析错误 */ }
  }
  await new Promise((r) => setTimeout(r, 2000));
}

