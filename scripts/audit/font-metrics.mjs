import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage();
await p.goto('http://localhost:4173/about', { waitUntil:'networkidle' });
const r = await p.evaluate(async () => {
  await document.fonts.ready;
  const probe = document.createElement('span');
  probe.style.cssText='position:absolute;visibility:hidden;white-space:nowrap;font-size:100px;font-weight:400';
  probe.textContent='Atishay Kasliwal builds AI systems';
  document.body.appendChild(probe);
  const w = (f) => { probe.style.fontFamily=f; return probe.getBoundingClientRect().width; };
  const out = {
    playfair: w("'Playfair Display'"),
    times:    w("'Times New Roman'"),
    georgia:  w('Georgia'),
  };
  probe.remove();
  return out;
});
console.log('width @100px for the /about h1 string:');
for (const [k,v] of Object.entries(r)) console.log('  '+k.padEnd(10)+v.toFixed(1)+'px');
console.log('\nsize-adjust needed so Times matches Playfair: '+(r.playfair/r.times*100).toFixed(1)+'%');
console.log('size-adjust needed so Georgia matches Playfair: '+(r.playfair/r.georgia*100).toFixed(1)+'%');
await b.close();
