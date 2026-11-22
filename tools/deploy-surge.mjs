#!/usr/bin/env node
// 发布到 Surge：node tools/deploy-surge.mjs [目录] [域名]
//
// 目录默认 .artifacts/surge-dist（由 release 里的离线包解出来的成品），
// 域名默认读 .env 里的 SURGE_DOMAIN，凭据读 SURGE_LOGIN / SURGE_TOKEN。
// 凭据只从 .env 或当前环境取，不写进仓库。

import { readFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function loadEnv() {
  const out = { ...process.env }
  const file = join(root, '.env')
  if (!existsSync(file)) return out
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (!m) continue
    const value = m[2].replace(/^["']|["']$/g, '').trim()
    if (!(m[1] in out) || !out[m[1]]) out[m[1]] = value
  }
  return out
}

const env = loadEnv()
const source = resolve(root, process.argv[2] || '.artifacts/surge-dist')
const domain = process.argv[3] || env.SURGE_DOMAIN

if (!existsSync(join(source, 'index.html'))) {
  console.error(`❌ ${source} 里没有 index.html，先解包成品再发布`)
  process.exit(1)
}
if (!env.SURGE_TOKEN || !env.SURGE_LOGIN) {
  console.error('❌ 缺少 SURGE_LOGIN / SURGE_TOKEN（写在 .env 里，或先 export）')
  process.exit(1)
}
if (!domain) {
  console.error('❌ 没给域名，也没有 .env 里的 SURGE_DOMAIN')
  process.exit(1)
}

// 优先用本地装好的 surge，没有再退回 npx
const local = join(root, '.artifacts/surge-cli/node_modules/surge/bin/surge')
const args = existsSync(local)
  ? [local, 'publish', source, domain]
  : ['--yes', 'surge', 'publish', source, domain]

console.log(`▶ 发布 ${source}\n▶ 域名 ${domain}`)
const run = spawnSync(process.execPath, args, {
  stdio: 'inherit',
  env: { ...process.env, SURGE_LOGIN: env.SURGE_LOGIN, SURGE_TOKEN: env.SURGE_TOKEN },
})
process.exit(run.status ?? 1)