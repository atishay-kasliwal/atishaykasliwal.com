import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1440,height:900} });
const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,120)));
await p.goto('http://localhost:4173/atriveo', {waitUntil:'networkidle'});
await p.waitForTimeout(900);
const r = await p.evaluate(() => {
  const q=s=>document.querySelector(s);
  const rect=s=>{const e=q(s); if(!e) return null; const b=e.getBoundingClientRect();
    return {x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),h:Math.round(b.height)};};
  return {
    cols: q('.atv-hero-cols') ? getComputedStyle(q('.atv-hero-cols')).gridTemplateColumns : null,
    lead: rect('.atv-hero-lead'),
    figure: rect('.atv-hero-figure'),
    map: rect('.atv-hero-figure .atv-map'),
    nodes: document.querySelectorAll('.atv-hero-figure .atv-node').length,
    edges: document.querySelectorAll('.atv-hero-figure .atv-edge').length,
    mapInHero: !!q('.atv-hero-figure .atv-map'),
    mapAboveFold: (q('.atv-map')?.getBoundingClientRect().top ?? 9999) < 900,
  };
});
console.log(JSON.stringify(r,null,2));
// click a node -> detail panel appears
await p.locator('.atv-hero-figure .atv-node').first().click();
await p.waitForTimeout(400);
const detail = await p.evaluate(()=>{const e=document.querySelector('.atv-detail');
  return e ? e.querySelector('h3')?.textContent : null;});
console.log('clicking a node opens detail:', detail || 'NO');
console.log('page errors:', errs.length ? errs : 'none');
await b.close();
