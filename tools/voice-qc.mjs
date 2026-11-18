// 配音批量体检：不靠耳朵，靠波形指标把"坏"的挑出来。
// 用法: node tools/voice-qc.mjs
// 输出: .artifacts/voice-qc/report.csv（全量指标）+ redo.txt（待重配 id）
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';

const run = promisify(execFile);
const FFMPEG = 'C:\\Users\\MIC lunchinm\\Tools\\ffmpeg\\bin\\ffmpeg.exe';
const ROOT = path.resolve(import.meta.dirname, '..');
const VOICE = path.join(ROOT, 'assets', 'voice');

// ---- 台词表 ----
const lines = new Map();
for (const f of fs.readdirSync(path.join(ROOT, 'content'))) {
  if (!/^act\d+\.json$/.test(f)) continue;
  for (const n of JSON.parse(fs.readFileSync(path.join(ROOT, 'content', f), 'utf8'))) {
    if (n.type !== 'say') continue;
    lines.set(n.id, { text: n.text ?? '', speaker: n.speaker ?? '旁白' });
  }
}

// ffmpeg 的 silencedetect 输出是有序事件流：start/end 交替，末尾若停在 start 说明静到 EOF
async function probe(file) {
  const { stderr } = await run(FFMPEG, [
    '-hide_banner', '-nostats', '-i', file,
    '-af', 'silencedetect=noise=-35dB:d=0.2,astats=metadata=1:reset=0',
    '-f', 'null', '-',
  ]).catch((e) => ({ stderr: e.stderr ?? '' }));

  const dur = /Duration: (\d+):(\d+):([\d.]+)/.exec(stderr);
  const seconds = dur ? +dur[1] * 3600 + +dur[2] * 60 + +dur[3] : NaN;

  // 按出现顺序取事件，保留原始次序信息
  const events = [...stderr.matchAll(/silence_(start|end):\s*(-?[\d.]+)(?:\s*\|\s*silence_duration:\s*([\d.]+))?/g)]
    .map((m) => ({ k: m[1], t: +m[2], d: m[3] ? +m[3] : 0 }));

  // 开头静音：只有第一个事件是 start 且落在 0 附近，才算"开头有静音"
  const first = events[0];
  const headSil = first && first.k === 'start' && first.t <= 0.05
    ? (events[1]?.k === 'end' ? events[1].t : seconds)
    : 0;

  // 结尾静音：最后一个事件是 start（没有配对的 end）= 一路静到文件末尾
  const last = events[events.length - 1];
  const tailSil = last && last.k === 'start' ? Math.max(0, seconds - last.t) : 0;

  // 内部最长停顿（不含头尾），这是"说话一顿一顿"的直接证据
  let maxGap = 0;
  for (let i = 0; i < events.length - 1; i++) {
    if (events[i].k === 'start' && events[i + 1].k === 'end') {
      maxGap = Math.max(maxGap, events[i + 1].t - events[i].t);
    }
  }

  const nums = (re) => [...stderr.matchAll(re)].map((m) => (m[1] === '-inf' ? -99 : +m[1]));
  const rms = nums(/RMS level dB:\s*(-?[\d.]+|-inf)/g);
  const peak = nums(/Peak level dB:\s*(-?[\d.]+|-inf)/g);

  return {
    seconds,
    rms: rms.length ? Math.max(...rms) : -99,
    peak: peak.length ? Math.max(...peak) : -99,
    headSil, tailSil, maxGap,
  };
}

// 判断：只用"能确定是缺陷"的规则，宁可漏报不要误报
function judge(m) {
  const out = [];
  const { chars, seconds, rms, peak, headSil, tailSil, maxGap } = m;
  const span = seconds - headSil - tailSil;          // 真正的发声时长
  const cps = span > 0 ? chars / span : 0;
  m.span = span;
  m.cps = cps;

  if (chars >= 4 && span < chars / 9) out.push(`截断 ${chars}字/${span.toFixed(2)}s`);
  if (seconds < 0.3 && chars >= 4) out.push(`空壳 ${seconds.toFixed(2)}s`);
  if (chars >= 6 && cps < 3.0) out.push(`太慢 ${cps.toFixed(1)}字/秒`);
  if (chars >= 6 && cps > 9.0) out.push(`太快 ${cps.toFixed(1)}字/秒`);
  if (rms < -30) out.push(`过轻 RMS${rms.toFixed(0)}dB`);
  if (peak > -0.15) out.push(`削波`);
  if (headSil > 0.8) out.push(`头静音${headSil.toFixed(1)}s`);
  if (tailSil > 1.2) out.push(`尾静音${tailSil.toFixed(1)}s`);
  if (maxGap > 0.9 && chars >= 8) out.push(`中间卡${maxGap.toFixed(1)}s`);
  return out;
}

const files = fs.readdirSync(VOICE).filter((f) => f.endsWith('.mp3'));
const rows = [];
let i = 0;
for (const f of files) {
  const id = f.replace(/\.mp3$/, '');
  const meta = lines.get(id);
  const text = meta?.text ?? '';
  const chars = (text.match(/[\u4e00-\u9fa5a-zA-Z0-9]/g) ?? []).length;
  const m = { id, chars, speaker: meta?.speaker ?? '?', text, ...(await probe(path.join(VOICE, f))) };
  m.issues = chars ? judge(m) : [];
  rows.push(m);
  if (++i % 100 === 0) process.stderr.write(`  ${i}/${files.length}\n`);
}

const bad = rows.filter((r) => r.issues.length);
const byCode = {};
for (const r of bad) for (const s of r.issues) {
  const k = s.replace(/[-\d.]+.*$/, '').trim();
  byCode[k] = (byCode[k] ?? 0) + 1;
}

console.log(`\n=== 配音体检 ===`);
console.log(`文件 ${rows.length} / 可疑 ${bad.length} 条 (${((bad.length / rows.length) * 100).toFixed(1)}%)`);
console.log(`问题分布 ${JSON.stringify(byCode, null, 0)}`);
const cps = rows.filter((r) => r.chars >= 4).map((r) => r.cps).sort((a, b) => a - b);
const q = (p) => cps[Math.floor(cps.length * p)]?.toFixed(2);
console.log(`语速（按发声时长）p5=${q(0.05)} p50=${q(0.5)} p95=${q(0.95)} 字/秒`);

bad.sort((a, b) => b.issues.length - a.issues.length);
console.log(`\n--- 最可疑 20 条 ---`);
for (const r of bad.slice(0, 20)) {
  console.log(`${r.id.padEnd(9)} ${r.speaker.padEnd(4)} ${String(r.chars).padStart(2)}字 ${r.seconds.toFixed(2)}s | ${r.issues.join('; ')}`);
}

const dir = path.join(ROOT, '.artifacts', 'voice-qc');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'report.csv'), '\ufeff' + [
  'id,speaker,chars,seconds,span,cps,rms,peak,headSil,tailSil,maxGap,issues,text',
  ...rows.map((r) => [r.id, r.speaker, r.chars, r.seconds.toFixed(2), (r.span ?? 0).toFixed(2),
    (r.cps ?? 0).toFixed(2), r.rms.toFixed(1), r.peak.toFixed(1), r.headSil.toFixed(2),
    r.tailSil.toFixed(2), r.maxGap.toFixed(2), r.issues.join('|'),
    `"${r.text.replace(/"/g, '""')}"`].join(',')),
].join('\n'), 'utf8');
fs.writeFileSync(path.join(dir, 'redo.txt'), bad.map((r) => r.id).join('\n'), 'utf8');
console.log(`\n报表 .artifacts/voice-qc/report.csv`);
console.log(`待重配 .artifacts/voice-qc/redo.txt（${bad.length} 条）`);
