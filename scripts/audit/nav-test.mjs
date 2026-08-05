import { chromium } from 'playwright';
const BASE = process.argv[2] || 'http://localhost:3000';
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1280,height:900} });
const errs = [];
p.on('console', m => m.type()==='error' && errs.push(m.text().slice(0,160)));
p.on('pageerror', e => errs.push('PAGEERROR: '+e.message.slice(0,160)));

const routes = ['/','/about','/projects','/projects/fomc-intelligence','/blog','/blog/point-in-time-correctness',
                '/contact','/experience','/open-source','/research','/privacy','/resume','/highlights','/atriveo'];
console.log(BASE);
console.log('route'.padEnd(34)+'status  visibleText  h1');
for (const r of routes) {
  let res, len=0, h1='—';
  try {
    res = await p.goto(BASE+r, {waitUntil:'networkidle', timeout:25000});
    await p.waitForTimeout(400);
    len = (await p.locator('body').innerText()).replace(/\s+/g,' ').trim().length;
    h1  = await p.locator('h1').first().innerText({timeout:2000}).catch(()=>'—');
  } catch(e){ h1='LOAD FAIL: '+e.message.slice(0,50); }
  const flag = len < 400 ? '  <-- BLANK/BROKEN' : '';
  console.log(r.padEnd(34)+String(res?.status()??'ERR').padEnd(8)+String(len).padEnd(13)+h1.slice(0,40).replace(/\n/g,' ')+flag);
}
console.log('\nconsole/page errors: '+errs.length);
[...new Set(errs)].slice(0,10).forEach(e=>console.log('  '+e));
await b.close();
