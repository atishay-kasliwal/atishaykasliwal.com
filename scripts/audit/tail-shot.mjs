import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1440,height:1000} });
await p.goto('http://localhost:4173/', {waitUntil:'networkidle'});
await p.evaluate(()=>window.scrollTo(0, document.body.scrollHeight));
await p.waitForTimeout(600);
await p.screenshot({ path:'/tmp/shots/tail.png' });
await b.close(); console.log('tail captured');
