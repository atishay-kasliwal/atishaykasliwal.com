import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage();
const routes = ['/','/about','/projects','/projects/fomc-intelligence','/blog',
  '/blog/point-in-time-correctness','/contact','/experience','/open-source',
  '/research','/privacy','/resume','/highlights','/atriveo','/art'];
let bad = [];
for (const r of routes) {
  await p.goto('http://localhost:4173'+r, {waitUntil:'networkidle'});
  await p.waitForTimeout(300);
  const t = await p.title();
  if (t.includes('—') || t.includes('–') || !t.includes('|')) bad.push(r+' -> '+t);
  console.log('  '+r.padEnd(34)+t);
}
console.log('\ninconsistent:', bad.length ? bad : 'none');
await b.close();
