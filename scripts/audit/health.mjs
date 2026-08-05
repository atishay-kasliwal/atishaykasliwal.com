import { chromium } from 'playwright';
const b = await chromium.launch();
const routes = ['/','/about','/projects','/projects/fomc-intelligence','/experience','/research',
  '/speaking','/blog','/blog/point-in-time-correctness','/open-source','/contact','/privacy',
  '/resume','/highlights','/atriveo','/art'];
console.log('route'.padEnd(34)+'err  imgs  broken  h1  text');
let problems=[];
for (const r of routes) {
  const p = await b.newPage({ viewport:{width:1440,height:900} });
  const errs=[]; p.on('pageerror',e=>errs.push(r+': '+e.message.slice(0,90)));
  p.on('console',m=>m.type()==='error'&&errs.push(r+' [console]: '+m.text().slice(0,90)));
  const failed=[]; p.on('requestfailed',q=>failed.push(q.url().slice(-60)));
  await p.goto('http://localhost:4173'+r,{waitUntil:'networkidle',timeout:30000});
  await p.waitForTimeout(500);
  const d = await p.evaluate(()=>{
    const imgs=[...document.images];
    return { imgs:imgs.length,
      broken:imgs.filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.currentSrc||i.src).slice(0,3),
      h1:document.querySelectorAll('h1').length,
      text:document.body.innerText.replace(/\s+/g,' ').trim().length,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 2 };
  });
  const flag = (errs.length||d.broken.length||d.h1!==1||d.text<300||d.overflow) ? ' <<' : '';
  console.log(r.padEnd(34)+String(errs.length).padEnd(5)+String(d.imgs).padEnd(6)+String(d.broken.length).padEnd(8)+String(d.h1).padEnd(4)+String(d.text).padEnd(7)+(d.overflow?'H-OVERFLOW':'')+flag);
  if(errs.length) problems.push(...errs);
  if(d.broken.length) problems.push(r+' broken img: '+d.broken.join(', '));
  if(failed.length) problems.push(r+' failed req: '+failed.slice(0,2).join(', '));
  await p.close();
}
console.log('\n── problems ──');
console.log(problems.length ? [...new Set(problems)].join('\n') : 'none');
await b.close();
