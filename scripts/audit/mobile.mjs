import { chromium } from 'playwright';
const b = await chromium.launch();
console.log('route'.padEnd(30)+'overflow  tapTargets<44px  navWorks');
for (const r of ['/','/about','/research','/speaking','/atriveo','/projects']) {
  const p = await b.newPage({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true });
  await p.goto('http://localhost:4173'+r,{waitUntil:'networkidle'});
  await p.waitForTimeout(400);
  const d = await p.evaluate(()=>{
    const small=[...document.querySelectorAll('a,button')].filter(e=>{
      const b=e.getBoundingClientRect();
      return b.width>0 && b.height>0 && (b.height<44||b.width<24);
    }).length;
    return { of: document.documentElement.scrollWidth > window.innerWidth+2, small,
             burger: !!document.querySelector('.mobile-menu-toggle') };
  });
  console.log(r.padEnd(30)+String(d.of?'YES':'no').padEnd(10)+String(d.small).padEnd(17)+(d.burger?'burger ok':'—'));
  await p.close();
}
await b.close();
