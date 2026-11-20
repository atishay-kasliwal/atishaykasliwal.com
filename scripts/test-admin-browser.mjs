// Local Chrome QA with real Functions, an in-memory database/bucket, and test-only Access keys.
// No production credentials, data, uploads, or publications are used.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { accessFixture, memoryD1, memoryR2, makePdf, consistentResumeLines } from "../tests/resume/helpers.mjs";
import { onRequest as adminMiddleware } from "../functions/admin/_middleware.js";
import { onRequestGet as adminPage } from "../functions/admin/[[path]].js";
import { onRequestGet as photoPage } from "../functions/photography/admin/[[path]].js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const evidence = path.join(root, "artifacts", "admin-browser");
mkdirSync(evidence, { recursive: true });
const access = await accessFixture();
const db = memoryD1();
db.sqlite.exec(readFileSync(path.join(root, "migrations", "0001_photography.sql"), "utf8"));
db.sqlite.exec(readFileSync(path.join(root, "migrations", "0006_photo_variants.sql"), "utf8"));
const env = { DB: db, RESUMES: memoryR2(), PHOTOS: memoryR2(), ACCESS_TEAM_DOMAIN: "team.example", ACCESS_AUD: "aud-1", ADMIN_EMAILS: "owner@example.com", PHOTO_PUBLIC_BASE: "https://photos.example" };
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".pdf": "application/pdf", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".txt": "text/plain" };
env.ASSETS = { async fetch(input) {
  const url = new URL(typeof input === "string" ? input : input.url);
  let file = path.resolve(dist, `.${decodeURIComponent(url.pathname)}`);
  if (url.pathname.endsWith("/")) file = path.join(file, "index.html");
  if (!file.startsWith(`${dist}${path.sep}`) || !existsSync(file)) return new Response("Not found", { status: 404 });
  return new Response(readFileSync(file), { headers: { "Content-Type": mime[path.extname(file)] ?? "application/octet-stream" } });
} };
const realFetch = globalThis.fetch;
globalThis.fetch = (input, init) => String(input) === "https://team.example/cdn-cgi/access/certs" ? Promise.resolve(Response.json(access.certs)) : realFetch(input, init);
const routes = [
  [/^\/api\/admin\/resume$/, "api/admin/resume/index.js"],
  [/^\/api\/admin\/resume\/context$/, "api/admin/resume/context.js"],
  [/^\/api\/admin\/resume\/bundled$/, "api/admin/resume/bundled.js"],
  [/^\/api\/admin\/resume\/versions$/, "api/admin/resume/versions.js"],
  [/^\/api\/admin\/resume\/versions\/([^/]+)\/file$/, "api/admin/resume/versions/[id]/file.js"],
  [/^\/api\/admin\/resume\/versions\/([^/]+)\/publish$/, "api/admin/resume/versions/[id]/publish.js"],
  [/^\/api\/admin\/resume\/versions\/([^/]+)\/recheck$/, "api/admin/resume/versions/[id]/recheck.js"],
  [/^\/api\/admin\/resume\/versions\/([^/]+)$/, "api/admin/resume/versions/[id].js"],
  [/^\/Atishay-Kasliwal-Resume\.pdf$/, "Atishay-Kasliwal-Resume.pdf.js"],
  [/^\/api\/profile\.json$/, "api/profile.json.js"],
];
const server = createServer(async (incoming, outgoing) => {
  try {
    const buffers = [];
    for await (const chunk of incoming) buffers.push(chunk);
    const request = new Request(`http://${incoming.headers.host}${incoming.url}`, { method: incoming.method, headers: incoming.headers, ...(["GET", "HEAD"].includes(incoming.method) ? {} : { body: Buffer.concat(buffers) }) });
    const pathname = new URL(request.url).pathname;
    const context = { request, env, data: {}, params: {}, next: () => env.ASSETS.fetch(request) };
    let response;
    if (pathname.startsWith("/admin/")) response = await adminMiddleware({ ...context, next: () => adminPage(context) });
    else if (pathname.startsWith("/photography/admin")) response = await photoPage(context);
    else {
      for (const [pattern, file] of routes) {
        const match = pattern.exec(pathname);
        if (!match) continue;
        context.params = { id: match[1] };
        const module = await import(path.join(root, "functions", file));
        const handler = module[`onRequest${incoming.method[0]}${incoming.method.slice(1).toLowerCase()}`] ?? module.onRequest;
        response = handler ? await handler(context) : new Response(null, { status: 405 });
        break;
      }
      response ??= await env.ASSETS.fetch(request);
    }
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error(error);
    outgoing.writeHead(500);
    outgoing.end("QA server failed");
  }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
let checks = 0;
const check = (ok, label) => { assert.ok(ok, label); checks++; };
const failures = [];
try {
  browser = await chromium.launch({ channel: "chrome" });
  for (const route of ["/admin/resume/", "/admin/responses/", "/photography/admin/", "/photography/admin/seo/", "/photography/admin/seo/report.json"]) {
    check((await realFetch(`${base}${route}`)).status === 401, `${route} must refuse signed-out requests`);
  }
  const context = await browser.newContext({ extraHTTPHeaders: { "Cf-Access-Jwt-Assertion": await access.token("owner@example.com") } });
  const page = await context.newPage();
  page.setDefaultTimeout(10_000);
  page.on("pageerror", error => failures.push(error.message));
  page.on("console", message => { if (message.type() === "error" && /Content Security Policy|Refused to/.test(message.text())) failures.push(message.text()); });
  await page.goto(`${base}/admin/resume/`);
  await page.getByText("The bundled résumé is live", { exact: true }).waitFor();
  await page.getByText("✓ Public URL verified", { exact: true }).waitFor();
  check(await page.locator("#review").innerText().then(text => text.includes("Bundled PDF")) && (await page.locator('#review [data-stat="conflict"] .rz-stat-n').innerText()) === "0", "the live bundled PDF opens with its report");
  await page.locator("#doc canvas.rz-page").first().waitFor();
  check(await page.locator("#doc canvas.rz-page").first().evaluate(canvas => canvas.width > 300 && canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data.some((value, i) => i % 4 !== 3 && value < 128)), "the résumé is drawn as a page with visible text");
  check(!/\bnull\b/.test(await page.locator("#live-check").innerText()), "live check prints no stray null");
  await page.locator("#file").setInputFiles({ name: "qa-consistent.pdf", mimeType: "application/pdf", buffer: Buffer.from(makePdf(consistentResumeLines())) });
  await page.getByRole("button", { name: "Publish this version", exact: true }).waitFor();
  check(await page.locator("#publish-button").isEnabled(), "consistent résumé can publish without conflict acknowledgement");
  check(await page.locator("#versions .rz-item.is-selected").innerText().then(text => /draft/i.test(text)), "the new upload is selected in the version list");
  await page.getByRole("tab", { name: "Text" }).click();
  check(await page.locator(".rz-text").innerText().then(text => text.includes("Atishay Kasliwal")), "the Text tab shows the extracted text");
  await page.getByRole("tab", { name: "Findings" }).click();
  page.once("dialog", dialog => dialog.accept());
  await page.locator("#publish-button").click();
  await page.getByText("This version is published.", { exact: true }).waitFor();
  check((await realFetch(`${base}/Atishay-Kasliwal-Resume.pdf`)).headers.get("X-Resume-Version") !== "bundled", "signed-out public URL serves the test publication");
  const savedBucket = env.RESUMES;
  env.RESUMES = memoryR2();
  await page.reload();
  await page.getByText("Fallback: the public URL is serving the bundled PDF, not the published version", { exact: true }).waitFor();
  await page.getByText("✓ Public URL verified", { exact: true }).waitFor();
  check(true, "missing R2 object shows fallback and verifies the served PDF");
  env.RESUMES = savedBucket;
  // The responses inspector, photography admin and SEO page moved to Admin: gone even signed in.
  for (const route of ["/admin/responses/", "/photography/admin/", "/photography/admin/seo/"]) {
    check((await page.goto(`${base}${route}`)).status() === 404, `${route} is gone (moved to Admin)`);
  }
  for (const [label, viewport] of [["desktop", { width: 1440, height: 1000 }], ["phone", { width: 390, height: 844 }]]) {
    await page.setViewportSize(viewport);
    await page.goto(`${base}/admin/resume/`);
    await page.locator("#live-check .good").waitFor({ state: "visible" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    check(overflow <= 1, `${label} résumé admin has no page overflow (${overflow}px)`);
    if (label === "desktop") {
      const extra = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
      check(extra <= 1, `desktop résumé admin fits one screen (${extra}px extra)`);
    }
    await page.screenshot({ path: path.join(evidence, `resume-${label}.png`), fullPage: true });
  }
  check(failures.length === 0, `no browser errors: ${failures.join("; ")}`);
  console.log(`Admin browser QA passed: ${checks} checks. Screenshots: ${evidence}`);
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
  globalThis.fetch = realFetch;
  db.sqlite.close();
}
