import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1440,height:1000} });
const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,140)));
await p.goto('http://localhost:4173/about', {waitUntil:'networkidle'});
await p.waitForTimeout(500);
const r = await p.evaluate(() => {
  const secs=[...document.querySelectorAll('#main section, #main header')]
    .map(s=>({cls:(s.className||'').toString().split(' ')[0], h:Math.round(s.getBoundingClientRect().height)}))
    .filter(s=>s.h>0);
  const hs=[...document.querySelectorAll('#main h1,#main h2,#main h3')].map(h=>h.tagName);
  return { sections:secs, h1:hs.filter(x=>x==='H1').length,
    words:document.body.innerText.replace(/\s+/g,' ').trim().split(' ').length,
    faq:document.querySelectorAll('.ab-faq-item').length,
    links:document.querySelectorAll('#main a').length };
});
console.log('sections:'); r.sections.forEach(s=>console.log('   '+s.cls.padEnd(18)+s.h+'px'));
console.log(`\nh1 count: ${r.h1}  |  words: ${r.words}  |  FAQ items: ${r.faq}  |  internal links: ${r.links}`);
console.log('page errors:', errs.length?errs:'none');
// header no longer has Contact
await p.goto('http://localhost:4173/', {waitUntil:'networkidle'});
const nav = await p.evaluate(()=>[...document.querySelectorAll('nav.nav a')].map(a=>a.textContent.replace(/^\d+/,'').trim()));
const foot = await p.evaluate(()=>[...document.querySelectorAll('.spec-footer-nav a')].map(a=>a.textContent.trim()));
console.log('\nheader nav:', nav.join(' · '));
console.log('footer nav:', foot.slice(0,4).join(' · '), '…');
await b.close();
