import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1440,height:1000} });
await p.goto('http://localhost:4173/', {waitUntil:'networkidle'});
const r = await p.evaluate(() => {
  const pc = document.querySelector('.page-content');
  const kids = [...pc.children].map(c=>{
    const b=c.getBoundingClientRect(), cs=getComputedStyle(c);
    return {cls:(c.className||'').toString().slice(0,34), top:Math.round(b.top), bottom:Math.round(b.bottom),
            h:Math.round(b.height), mb:cs.marginBottom, pb:cs.paddingBottom};
  });
  const cards = document.querySelectorAll('.testimonial-card');
  const lastCard = cards[cards.length-1]?.getBoundingClientRect();
  return { kids, lastCardBottom: lastCard?Math.round(lastCard.bottom):null,
           pcBottom: Math.round(pc.getBoundingClientRect().bottom),
           pcPaddingBottom: getComputedStyle(pc).paddingBottom };
});
console.log('last testimonial card bottom:', r.lastCardBottom);
console.log('page-content bottom:', r.pcBottom, ' padding-bottom:', r.pcPaddingBottom);
console.log('\nsections inside .page-content:');
r.kids.forEach(k=>console.log(`  ${k.cls.padEnd(36)} top=${String(k.top).padEnd(6)} bottom=${String(k.bottom).padEnd(6)} h=${String(k.h).padEnd(6)} mb=${k.mb} pb=${k.pb}`));
await b.close();
