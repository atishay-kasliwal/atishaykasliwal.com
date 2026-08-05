import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1200,height:760}, deviceScaleFactor:1 });
await p.goto('http://localhost:4173/atriveo', {waitUntil:'networkidle'});
await p.waitForTimeout(600);
await p.screenshot({ path:'/tmp/shots/atriveo-top.png' });
await b.close(); console.log('ok');
