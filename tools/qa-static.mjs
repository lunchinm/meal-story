/**
 * 静态自检：内容图、资源引用、可达性、配音覆盖。
 *
 * 用法：node tools/qa-static.mjs
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const CONTENT = join(ROOT, 'content');
const problems = [];
const warnings = [];

function loadAll() {
  const nodes = new Map();
  const dupes = [];
  for (const act of [1, 2, 3, 4]) {
    const list = JSON.parse(readFileSync(join(CONTENT, `act${act}.json`), 'utf8'));
    for (const node of list) {
      if (nodes.has(node.id)) dupes.push(node.id);
      nodes.set(node.id, node);
    }
  }
  if (dupes.length) problems.push(`重复节点 id：${dupes.join(', ')}`);
  return nodes;
}

function outgoing(node) {
  const out = [];
  if (node.next) out.push(node.next);
  for (const opt of node.options ?? []) out.push(opt.next);
  for (const rule of node.rules ?? []) out.push(rule.next);
  if (node.fallback) out.push(node.fallback);
  for (const target of node.targets ?? []) out.push(target);
  return out.filter(Boolean);
}

function main() {
  const nodes = loadAll();

  // 1. 断链
  for (const node of nodes.values()) {
    for (const target of outgoing(node)) {
      if (!nodes.has(target)) problems.push(`${node.id} 指向不存在的 ${target}`);
    }
  }

  // 2. 出口
  for (const node of nodes.values()) {
    if (node.type === 'ending') continue;
    if (outgoing(node).length === 0) problems.push(`${node.id}（${node.type}）没有出口`);
  }

  // 3. 可达性
  const seen = new Set();
  const queue = ['a1-00'];
  while (queue.length) {
    const id = queue.shift();
    if (seen.has(id) || !nodes.has(id)) continue;
    seen.add(id);
    queue.push(...outgoing(nodes.get(id)));
  }
  const unreachable = [...nodes.keys()].filter((id) => !seen.has(id));
  if (unreachable.length) warnings.push(`不可达节点 ${unreachable.length} 个：${unreachable.slice(0, 8).join(', ')}`);

  // 4. 结局可达
  const endings = [...nodes.values()].filter((n) => n.type === 'ending');
  if (endings.length < 3) problems.push(`结局只有 ${endings.length} 个`);
  for (const ending of endings) {
    if (!seen.has(ending.id)) problems.push(`结局 ${ending.id} 不可达`);
    if (ending.image && !existsSync(join(ROOT, 'assets', 'bg', `${ending.image}.webp`))) {
      problems.push(`结局 ${ending.id} 缺少配图 ${ending.image}`);
    }
  }

  // 5. 背景与立绘
  const bgFiles = new Set(readdirSync(join(ROOT, 'assets', 'bg')).filter((f) => f.endsWith('.webp')).map((f) => f.slice(0, -5)));
  const chFiles = new Set(readdirSync(join(ROOT, 'assets', 'ch')).filter((f) => f.endsWith('.webp')).map((f) => f.slice(0, -5)));
  for (const node of nodes.values()) {
    if (node.type === 'chapter' && node.image && !bgFiles.has(node.image)) {
      problems.push(`章节 ${node.id} 缺少过场图 ${node.image}`);
    }
    if (node.type === 'say' && node.actor) {
      const key = `ch_${node.actor}_${node.expr ?? 'normal'}`;
      if (!chFiles.has(key)) problems.push(`${node.id} 缺少立绘 ${key}`);
    }
    if (node.type === 'evidence' && node.image && !bgFiles.has(node.image)) {
      problems.push(`${node.id} 缺少证据图 ${node.image}`);
    }
  }

  // 6. 配音覆盖
  const voiceDir = join(ROOT, 'assets', 'voice');
  const voices = new Set(readdirSync(voiceDir).filter((f) => f.endsWith('.mp3')).map((f) => f.slice(0, -4)));
  let needVoice = 0;
  let missing = 0;
  for (const node of nodes.values()) {
    if (node.type !== 'say') continue;
    const silent = node.channel === 'chat' || node.speaker === '你';
    if (silent) {
      if (voices.has(node.id)) warnings.push(`${node.id} 是群聊/心声，却有配音`);
      continue;
    }
    needVoice += 1;
    if (!voices.has(node.id)) missing += 1;
  }
  if (missing) warnings.push(`缺配音 ${missing}/${needVoice} 句`);

  // 7. 台词与文案
  for (const node of nodes.values()) {
    if (node.type === 'say') {
      if (!node.text || !node.text.trim()) problems.push(`${node.id} 台词为空`);
      if (node.text && node.text.length > 120) warnings.push(`${node.id} 台词过长（${node.text.length} 字）`);
    }
    if (node.type === 'choice') {
      if (!node.options?.length) problems.push(`${node.id} 没有选项`);
      for (const opt of node.options ?? []) {
        if (!opt.text?.trim()) problems.push(`${node.id} 有空选项`);
      }
    }
  }

  // 8. 统计
  const stats = {};
  for (const node of nodes.values()) stats[node.type] = (stats[node.type] ?? 0) + 1;
  const chat = [...nodes.values()].filter((n) => n.type === 'say' && n.channel === 'chat').length;

  console.log('=== 内容自检 ===');
  console.log('节点总数', nodes.size, JSON.stringify(stats));
  console.log(`群聊台词 ${chat} 句，需要配音 ${needVoice} 句，缺 ${missing} 句`);
  console.log(`可达 ${seen.size} / ${nodes.size}`);
  if (warnings.length) {
    console.log('\n提示：');
    warnings.slice(0, 20).forEach((w) => console.log('  ·', w));
  }
  if (problems.length) {
    console.log('\n问题：');
    problems.slice(0, 30).forEach((p) => console.log('  ✗', p));
    process.exit(1);
  }
  console.log('\n静态自检通过');
}

main();
