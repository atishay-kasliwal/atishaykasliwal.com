import { chromium } from 'playwright';
const b = await chromium.launch();
for (const r of ['/resume','/highlights','/atriveo','/art']) {
  const p = await b.newPage({ viewport:{width:1350,height:940} });
  await p.addInitScript(()=>{ window.__s=[]; window.__g=l=>window.__s.push({l,
    h:Math.round(document.querySelector('#main')?.getBoundingClientRect().height||0),
    kids:[...(document.querySelector('#main')?.children||[])].map(c=>c.className?.toString?.().slice(0,28))});});
  await p.goto('http://localhost:4173'+r,{waitUntil:'domcontentloaded'});
  await p.evaluate(()=>window.__g('DCL'));
  await p.waitForTimeout(1500);
  await p.evaluate(()=>window.__g('after'));
  const s = await p.evaluate(()=>window.__s);
  console.log(r.padEnd(14)+s.map(x=>`${x.l}=${x.h}px[${x.kids.join(',')}]`).join('  →  '));
  await p.close();
}
await b.close();
