/**
 * 截几张关键界面对比用：node tools/shots.mjs http://127.0.0.1:4174 输出目录
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const base = process.argv[2] ?? 'http://127.0.0.1:4174';
const outDir = process.argv[3] ?? './shots';
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const shots = [
  ['dialog', '/?node=a1-45'],
  ['actor', '/?node=a3-18'],
  ['chat', '/?node=a1-08'],
  ['choice', '/?node=a1-15'],
  ['ending', '/?node=e_hidden'],
  ['title', '/'],
];

for (const [name, path] of shots) {
  await page.goto(base + path);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${outDir}/${name}.png` });
  console.log('shot', name);
}

await browser.close();
