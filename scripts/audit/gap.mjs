import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1440,height:1000} });
await p.goto('http://localhost:4173/', {waitUntil:'networkidle'});
const r = await p.evaluate(() => {
  const foot = document.querySelector('.site-footer');
  const main = document.querySelector('#main');
  const last = main?.querySelector(':scope > *')?.lastElementChild;
  const cs = getComputedStyle(foot);
  const mainRect = main.getBoundingClientRect();
  const footRect = foot.getBoundingClientRect();
  // walk to the last visible box inside main
  let deepest = main, best = 0;
  main.querySelectorAll('*').forEach(e=>{
    const b = e.getBoundingClientRect();
    if (b.height>0 && b.bottom>best) { best=b.bottom; deepest=e; }
  });
  return {
    lastContentBottom: Math.round(best),
    mainBottom: Math.round(mainRect.bottom),
    footerTop: Math.round(footRect.top),
    gapContentToFooter: Math.round(footRect.top - best),
    footerMarginTop: cs.marginTop, footerPaddingTop: cs.paddingTop,
    deepest: deepest.className?.toString?.().slice(0,50),
    bandTop: Math.round(document.querySelector('.spec-footer-band').getBoundingClientRect().top - footRect.top),
  };
});
console.log(JSON.stringify(r,null,2));
await b.close();
