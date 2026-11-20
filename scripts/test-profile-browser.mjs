// Test B (and the HTTP side of test C): load the built site in a real browser with JavaScript
// DISABLED, at desktop and phone sizes, and check that the profile is readable, navigable and
// complete; then check how /api/profile.json responds over HTTP.
//
//   npm run build && npm run test:profile:browser
//   PROFILE_BASE_URL=https://atishaykasliwal.com npm run test:profile:browser   (after a deploy)
//
// Uses playwright-core (already installed as a dependency of the seo tooling) with the local
// Google Chrome, so nothing new is downloaded. Skips with a message if either is missing.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let chromium;
try {
  ({ chromium } = await import("playwright-core"));
} catch {
  console.log("Browser test skipped: playwright-core is not installed.");
  process.exit(0);
}

let server;
let base = process.env.PROFILE_BASE_URL?.replace(/\/$/, "");
if (!base) {
  const port = 4329;
  server = spawn(process.execPath, [path.join(root, "scripts/lhci-server.mjs")], { env: { ...process.env, PORT: String(port) }, stdio: "ignore" });
  base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`${base}/`)).ok) break;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

const results = [];
const check = (condition, message) => {
  assert.ok(condition, message);
  results.push(message);
};

let browser;
try {
  browser = await chromium.launch({ channel: "chrome" });
} catch (error) {
  console.log(`Browser test skipped: could not start Google Chrome (${error.message.split("\n")[0]}).`);
  server?.kill();
  process.exit(0);
}

try {
  // ---------- HTTP behaviour of the API ----------
  const api = await fetch(`${base}/api/profile.json`);
  check(api.status === 200, "GET /api/profile.json returns 200");
  check(/application\/json/.test(api.headers.get("content-type") ?? ""), "the profile is served as application/json");
  const body = await api.json();
  check(body.schemaVersion && body.profile?.name === "Atishay Kasliwal", "the response is the profile, with a schema version");
  const schema = await fetch(`${base}/api/profile.schema.json`);
  check(schema.status === 200 && (await schema.json()).$id.endsWith("/api/profile.schema.json"), "the JSON Schema is served");
  const missing = await fetch(`${base}/api/profile-does-not-exist.json`);
  check(missing.status === 404, "an unknown API path returns 404");
  if (process.env.PROFILE_BASE_URL) {
    // Only the real host applies public/_headers.
    check(/max-age=\d+/.test(api.headers.get("cache-control") ?? ""), "the API response has a Cache-Control max-age");
    check(api.headers.get("access-control-allow-origin") === "*", "the API allows cross-origin reads");
  }

  // ---------- Pages with JavaScript disabled ----------
  for (const [label, viewport] of [["desktop", { width: 1440, height: 900 }], ["phone", { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport });
    const page = await context.newPage();

    const response = await page.goto(`${base}/profile/`, { waitUntil: "load" });
    check(response.status() === 200, `${label}: /profile/ loads without JavaScript`);
    const visible = await page.locator("main").innerText();
    for (const fact of ["Atishay Kasliwal", "Software & AI Engineer", "Experience", "Education", "Professional strengths", "Open source contributions", "Senior Software Developer", "M.S. in Data Science", "InsureRaft", "Kubernetes"]) {
      check(visible.toLowerCase().includes(fact.toLowerCase()), `${label}: /profile/ shows "${fact}" without JavaScript`);
    }
    const styled = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    check(styled === "rgb(0, 0, 0)", `${label}: /profile/ is styled without JavaScript`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    check(overflow <= 0, `${label}: /profile/ has no horizontal scroll`);
    const headings = await page.locator("h1, h2").allInnerTexts();
    check(headings.filter(Boolean).length >= 9, `${label}: /profile/ headings are visible`);
    const hiddenSections = await page.evaluate(() =>
      [...document.querySelectorAll("main section")].filter(section => section.getBoundingClientRect().height === 0).map(section => section.id),
    );
    check(hiddenSections.length === 0, `${label}: no /profile/ section is collapsed or hidden`);
    // Every in-page anchor lands on a section.
    const anchors = await page.locator(".toc a").evaluateAll(links => links.map(link => link.getAttribute("href")));
    for (const hash of anchors) check(await page.locator(hash).count(), `${label}: table-of-contents link ${hash} has a target`);
    // Keyboard: the first focusable elements are the navigation links, and focus is visible.
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => ({ text: document.activeElement?.textContent?.trim(), outline: getComputedStyle(document.activeElement).outlineStyle }));
    check(/Home/.test(focused.text ?? "") && focused.outline !== "none", `${label}: keyboard focus starts on Home and is visible`);

    // The homepage without JavaScript: identity, the profile link, prerendered cards.
    await page.goto(`${base}/`, { waitUntil: "load" });
    const homeText = await page.locator("body").innerText();
    for (const fact of ["Atishay Kasliwal", "Full-stack & AI engineer", "Selected work", "Atriveo Tracker"]) {
      // innerText applies CSS text-transform (the section labels are uppercase), so compare without case.
      check(homeText.toLowerCase().includes(fact.toLowerCase()), `${label}: homepage shows "${fact}" without JavaScript`);
    }
    const profileLink = page.locator('a[href="/profile/"]').first();
    check((await page.locator('a[href="/profile/"]').count()) >= 1, `${label}: homepage HTML links to /profile/`);
    if (label === "desktop") check(await profileLink.isVisible(), "desktop: the Full profile link is visible on the homepage");
    const counter = await page.locator("#total-count").innerText();
    check(counter === "14", `${label}: the work counter shows all 14 projects without JavaScript (got ${counter})`);
    await context.close();
  }
} finally {
  await browser.close();
  server?.kill();
}
console.log(`Browser and HTTP checks passed against ${base}: ${results.length} checks.\n- ${results.join("\n- ")}`);
