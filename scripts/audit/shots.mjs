import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1440,height:1000} });
const routes = {'/':'01-home','/about':'02-about','/projects':'03-projects',
  '/blog/point-in-time-correctness':'04-post','/experience':'05-experience','/contact':'06-contact'};
for (const [r,name] of Object.entries(routes)) {
  await p.goto('http://localhost:4173'+r, {waitUntil:'networkidle', timeout:30000});
  await p.waitForTimeout(500);
  await p.screenshot({ path:`/tmp/shots/${name}.png` });
  // also capture the footer specifically
  const f = await p.locator('.site-footer');
  await f.scrollIntoViewIfNeeded();
  await p.waitForTimeout(300);
}
await p.goto('http://localhost:4173/about', {waitUntil:'networkidle'});
await p.locator('.site-footer').scrollIntoViewIfNeeded();
await p.waitForTimeout(400);
await p.locator('.site-footer').screenshot({ path:'/tmp/shots/07-footer.png' });
await b.close();
console.log('captured');
