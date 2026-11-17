import { chromium } from '@playwright/test';
const dir = 'C:/Users/MIC lunchinm/Desktop/学习资料/Vibe-Coding/合理膳食/文档/out/styles';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
for (const key of ['A', 'B', 'C']) {
  await p.goto('file:///' + dir + '/' + key + '.html');
  await p.waitForTimeout(600);
  await p.screenshot({ path: dir + '/' + key + '.png' });
  console.log('shot', key);
}
await b.close();