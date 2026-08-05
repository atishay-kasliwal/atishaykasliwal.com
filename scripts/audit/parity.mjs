import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1280,height:900} });
const grab = async (url, sels) => {
  await p.goto('http://localhost:4173'+url, {waitUntil:'networkidle'});
  return p.evaluate((ss)=>Object.fromEntries(ss.map(([k,s])=>{
    const e=document.querySelector(s); if(!e) return [k,null];
    const c=getComputedStyle(e);
    return [k,{font:c.fontFamily.split(',')[0].replace(/['"]/g,''), align:c.textAlign,
               size:c.fontSize, weight:c.fontWeight}];
  })), sels);
};
const L = await grab('/', [['h1','.spec-display'],['status','.spec-status'],['meta','.spec-hero-meta'],['sectionH2','.editorial-grid-header h2']]);
const A = await grab('/atriveo', [['h1','.atv-wordmark'],['status','.atv-status'],['meta','.atv-hero-meta'],['sectionH2','.atv-section-head h2']]);
console.log('              LANDING                              ATRIVEO');
for (const k of Object.keys(L)) {
  const l=L[k], a=A[k];
  const f=(o)=>o?`${o.font.slice(0,16)} ${o.align} ${o.weight}`:'—';
  const same = l&&a && l.font===a.font && l.align===a.align;
  console.log(k.padEnd(12)+f(l).padEnd(38)+f(a).padEnd(34)+(same?'✓':'✗'));
}
const grid = await p.evaluate(()=>!!document.querySelector('.atv-hero-grid'));
const glow = await p.evaluate(()=>!!document.querySelector('.atv-hero-glow'));
const brackets = await p.evaluate(()=>getComputedStyle(document.querySelector('.atv-compiler-card'),'::before').backgroundImage.includes('gradient'));
console.log('\nhero grid plane:', grid, '| cursor glow:', glow, '| card registration ticks:', brackets);
await b.close();
