import { chromium } from 'playwright';
const b = await chromium.launch();
for (const route of ['/about','/blog/point-in-time-correctness','/']) {
  const p = await b.newPage({ viewport:{width:1350,height:940} });
  await p.addInitScript(() => {
    window.__shifts = [];
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        if (e.hadRecentInput) continue;
        window.__shifts.push({
          value: +e.value.toFixed(4),
          sources: (e.sources||[]).map(s => ({
            tag: s.node?.tagName, cls: s.node?.className?.toString?.().slice(0,60),
            id: s.node?.id,
          })),
        });
      }
    }).observe({ type:'layout-shift', buffered:true });
  });
  // Cold cache so the font swap actually happens, as in a Lighthouse run.
  await p.context().clearCookies();
  await p.goto('http://localhost:4173'+route, { waitUntil:'load' });
  await p.waitForTimeout(3500);
  const shifts = await p.evaluate(() => window.__shifts);
  const total = shifts.reduce((s,x)=>s+x.value,0);
  console.log(`\n${route}  CLS=${total.toFixed(3)}`);
  shifts.filter(s=>s.value>0.001).slice(0,6).forEach(s=>
    console.log('   '+String(s.value).padEnd(9)+JSON.stringify(s.sources).slice(0,150)));
  await p.close();
}
await b.close();
