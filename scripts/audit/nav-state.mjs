import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1440,height:900} });
await p.goto('http://localhost:4173/', {waitUntil:'networkidle'});
const r = await p.evaluate(()=>({
  header: [...document.querySelectorAll('.header nav.nav a')].map(a=>({t:a.textContent.replace(/^\d+/,'').trim(), href:a.getAttribute('href')})),
  footer: [...document.querySelectorAll('.spec-footer-nav a')].map(a=>a.textContent.trim()),
}));
console.log('HEADER NAV:');
r.header.forEach(x=>console.log(`   ${x.t.padEnd(12)} -> ${x.href}`));
console.log('\nFOOTER NAV (first 5):');
r.footer.slice(0,5).forEach(x=>console.log('   '+x));
console.log('\ncontact in header?', r.header.some(x=>/contact/i.test(x.t)) ? 'YES' : 'no');
console.log('contact in footer?', r.footer.some(x=>/contact/i.test(x)) ? 'YES' : 'no');
await b.close();
