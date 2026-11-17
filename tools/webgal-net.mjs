import { chromium } from '@playwright/test';
const b = await chromium.launch();
const p = await b.newPage();
p.on('request', (r) => { const u = r.url(); if (u.includes('game/') || u.includes('scene')) console.log('REQ', u.slice(-60)); });
p.on('response', (r) => { const u = r.url(); if (u.includes('game/')) console.log('RES', r.status(), u.slice(-60)); });
p.on('requestfailed', (r) => console.log('FAIL', r.url().slice(-60), r.failure()?.errorText));
await p.goto('http://127.0.0.1:8080/index.html');
await p.waitForTimeout(4000);
await b.close();