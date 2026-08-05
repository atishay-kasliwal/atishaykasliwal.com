import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1350,height:940} });
await p.addInitScript(() => {
  window.__s = [];
  window.__g = (l) => window.__s.push({ l,
    rootLen: document.getElementById('root')?.innerHTML.length ?? -1,
    nodes: document.querySelectorAll('#root *').length,
    mainH: Math.round(document.querySelector('#main')?.getBoundingClientRect().height ?? 0),
    sheets: document.styleSheets.length,
    cssRules: [...document.styleSheets].reduce((n,s)=>{try{return n+s.cssRules.length}catch{return n}},0),
  });
  document.addEventListener('readystatechange', ()=>window.__g('ready:'+document.readyState));
  window.addEventListener('load', ()=>window.__g('load'));
});
await p.goto('http://localhost:4173/about', { waitUntil:'domcontentloaded' });
await p.evaluate(()=>window.__g('after-DCL'));
for (const t of [100,300,700,1500]) { await p.waitForTimeout(t); await p.evaluate((x)=>window.__g('t+'+x), t); }
const s = await p.evaluate(()=>window.__s);
console.log('label'.padEnd(22)+'rootHTML'.padEnd(10)+'nodes'.padEnd(8)+'mainH'.padEnd(8)+'sheets'.padEnd(8)+'cssRules');
s.forEach(x=>console.log(String(x.l).padEnd(22)+String(x.rootLen).padEnd(10)+String(x.nodes).padEnd(8)+String(x.mainH).padEnd(8)+String(x.sheets).padEnd(8)+x.cssRules));
await b.close();
