import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1280,height:900} });

const read = async (url, sel) => {
  await p.goto('http://localhost:4173'+url, {waitUntil:'networkidle'});
  return p.evaluate((s)=>{
    const e=document.querySelector(s); if(!e) return null;
    const c=getComputedStyle(e);
    return {font:c.fontFamily.split(',')[0].replace(/['"]/g,''), size:c.fontSize,
            weight:c.fontWeight, color:c.color, numeric:c.fontVariantNumeric};
  }, sel);
};

const landing = await read('/', '.spec-metric-value');
const atriveo = await read('/atriveo', '.atv-stat-num');
const lLabel  = await read('/', '.spec-metric-label');
const aLabel  = await read('/atriveo', '.atv-stat-label');

console.log('METRIC NUMERALS');
console.log('  landing  ', JSON.stringify(landing));
console.log('  atriveo  ', JSON.stringify(atriveo));
console.log('  font match:', landing?.font === atriveo?.font ? 'YES ('+atriveo.font+')' : 'NO');
console.log('  weight match:', landing?.weight === atriveo?.weight ? 'YES' : 'NO');
console.log('\nMETRIC LABELS');
console.log('  landing  ', JSON.stringify(lLabel));
console.log('  atriveo  ', JSON.stringify(aLabel));

// plate border present?
await p.goto('http://localhost:4173/atriveo', {waitUntil:'networkidle'});
const plate = await p.evaluate(()=>{
  const e=document.querySelector('.atv-stats'); const c=getComputedStyle(e);
  return {display:c.display, cols:c.gridTemplateColumns.split(' ').length, border:c.borderTopWidth+' '+c.borderTopColor};
});
console.log('\nSTATS PLATE:', JSON.stringify(plate));
await b.close();
