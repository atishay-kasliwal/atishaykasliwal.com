import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage();
await p.goto('http://localhost:4173/about', { waitUntil:'networkidle' });
const r = await p.evaluate(async () => {
  await document.fonts.ready;
  const s = document.createElement('span');
  s.style.cssText='position:absolute;visibility:hidden;white-space:nowrap;font-size:100px;font-weight:400';
  s.textContent='Atishay Kasliwal is an AI Engineer based in New York building systems';
  document.body.appendChild(s);
  const w = f => { s.style.fontFamily=f; return s.getBoundingClientRect().width; };
  const o = { inter:w("'Inter'"), helvetica:w('Helvetica'), arial:w('Arial'),
              system:w('-apple-system'), verdana:w('Verdana') };
  s.remove(); return o;
});
console.log('width @100px:');
Object.entries(r).forEach(([k,v])=>console.log('  '+k.padEnd(11)+v.toFixed(1)));
console.log('\nsize-adjust so fallback matches Inter:');
for (const k of ['helvetica','arial','system','verdana'])
  console.log('  '+k.padEnd(11)+(r.inter/r[k]*100).toFixed(1)+'%');
await b.close();
