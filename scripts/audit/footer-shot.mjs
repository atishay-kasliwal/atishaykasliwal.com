import { chromium } from 'playwright';
const b = await chromium.launch();
for (const [w,name] of [[1440,'footer-desktop'],[820,'footer-tablet']]) {
  const p = await b.newPage({ viewport:{width:w,height:900} });
  await p.goto('http://localhost:4173/about', {waitUntil:'networkidle'});
  await p.locator('.site-footer').scrollIntoViewIfNeeded();
  await p.waitForTimeout(400);
  await p.locator('.site-footer').screenshot({ path:`/tmp/shots/${name}.png` });
  await p.close();
}
await b.close(); console.log('captured');
