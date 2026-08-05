import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1350,height:940} });
await p.addInitScript(() => {
  window.__snap = (l) => {
    const m = document.querySelector('#main');
    const kids = [...(m?.children||[])].map(c=>({
      tag:c.tagName, cls:(c.className||'').toString().slice(0,40),
      h:Math.round(c.getBoundingClientRect().height),
      disp:getComputedStyle(c).display, pos:getComputedStyle(c).position,
    }));
    (window.__out ||= []).push({l, mainH:Math.round(m?.getBoundingClientRect().height||0), kids});
  };
});
await p.goto('http://localhost:4173/about', { waitUntil:'domcontentloaded' });
await p.evaluate(()=>window.__snap('DCL'));
await p.waitForTimeout(1200);
await p.evaluate(()=>window.__snap('after'));
const out = await p.evaluate(()=>window.__out);
for (const s of out) {
  console.log(`\n[${s.l}] main=${s.mainH}px`);
  s.kids.forEach(k=>console.log(`   ${k.tag.padEnd(8)} h=${String(k.h).padEnd(6)} display=${k.disp.padEnd(10)} pos=${k.pos.padEnd(9)} ${k.cls}`));
}
await b.close();
