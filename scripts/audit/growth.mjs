import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1350,height:940} });
await p.addInitScript(() => {
  window.__snap = [];
  const grab = (label) => {
    const els = [...document.querySelectorAll('body *')].filter(e=>e.offsetParent!==null);
    window.__snap.push({ label, t: performance.now(),
      docH: document.documentElement.scrollHeight,
      footerTop: document.querySelector('.site-footer')?.getBoundingClientRect().top + window.scrollY,
      bandH: document.querySelector('.spec-footer-band')?.getBoundingClientRect().height,
      mainH: document.querySelector('#main')?.getBoundingClientRect().height,
    });
  };
  window.__grab = grab;
  document.addEventListener('DOMContentLoaded', ()=>grab('DOMContentLoaded'));
  window.addEventListener('load', ()=>grab('load'));
});
await p.goto('http://localhost:4173/about', { waitUntil:'domcontentloaded' });
for (const t of [0, 300, 800, 1500, 2500, 3500]) {
  await p.waitForTimeout(t===0?50:t - (await p.evaluate(()=>0)));
  await p.evaluate((tt)=>window.__grab('t+'+tt), t);
}
const snaps = await p.evaluate(()=>window.__snap);
console.log('label'.padEnd(20)+'docH'.padEnd(9)+'footerTop'.padEnd(11)+'bandH'.padEnd(9)+'mainH');
snaps.forEach(s=>console.log(String(s.label).padEnd(20)+String(Math.round(s.docH)).padEnd(9)+String(Math.round(s.footerTop||0)).padEnd(11)+String(Math.round(s.bandH||0)).padEnd(9)+Math.round(s.mainH||0)));
await b.close();
