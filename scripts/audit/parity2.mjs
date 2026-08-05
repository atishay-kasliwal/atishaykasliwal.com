import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1280,height:900} });
const norm = a => (a==='start'?'left':a);
const grab = async (url, sels) => {
  await p.goto('http://localhost:4173'+url, {waitUntil:'networkidle'});
  return p.evaluate((ss)=>Object.fromEntries(ss.map(([k,s])=>{
    const e=document.querySelector(s); if(!e) return [k,null];
    const c=getComputedStyle(e), r=e.getBoundingClientRect();
    return [k,{font:c.fontFamily.split(',')[0].replace(/['"]/g,''), align:c.textAlign,
               weight:c.fontWeight, left:Math.round(r.left)}];
  })), sels);
};
const L = await grab('/', [['h1','.spec-display'],['status','.spec-status'],['meta','.spec-hero-meta']]);
const A = await grab('/atriveo',[['h1','.atv-wordmark'],['status','.atv-status'],['meta','.atv-hero-meta']]);
console.log('element     landing                      atriveo                      match');
let ok=true;
for (const k of Object.keys(L)) {
  const l=L[k], a=A[k];
  const same = l&&a && l.font===a.font && norm(l.align)===norm(a.align) && l.weight===a.weight
               && Math.abs(l.left-a.left)<=4;
  if(!same) ok=false;
  const f=o=>o?`${o.font.slice(0,14)} ${norm(o.align)} x=${o.left}`:'—';
  console.log(k.padEnd(12)+f(l).padEnd(29)+f(a).padEnd(29)+(same?'YES':'NO'));
}
console.log('\nhero left edges aligned across both pages:', ok ? 'YES' : 'NO');
await b.close();
