import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage();
for (const r of ['/','/contact','/about']) {
  await p.goto('http://localhost:4173'+r, { waitUntil:'networkidle' });
  const res = await p.evaluate(() => {
    const probe = document.querySelector('#root a[href^="mailto:"], #root p, #root h1');
    const cs = getComputedStyle(probe);
    // Actually try selecting it.
    const range = document.createRange();
    range.selectNodeContents(probe);
    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
    return { userSelect: cs.userSelect || cs.webkitUserSelect, selected: sel.toString().trim().slice(0,42) };
  });
  console.log(r.padEnd(12)+'user-select='+String(res.userSelect).padEnd(8)+' selected: "'+res.selected+'"');
}
await b.close();
