// The résumé admin and public Pages Functions end to end: Access, upload, review, publish,
// restore, the stable public URL and /api/profile.json.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { onRequestGet as stateRoute } from "../../functions/api/admin/resume/index.js";
import { onRequestPost as uploadRoute } from "../../functions/api/admin/resume/versions.js";
import { onRequestGet as versionRoute } from "../../functions/api/admin/resume/versions/[id].js";
import { onRequestGet as fileRoute } from "../../functions/api/admin/resume/versions/[id]/file.js";
import { onRequestPost as publishRoute } from "../../functions/api/admin/resume/versions/[id]/publish.js";
import { onRequestPost as recheckRoute } from "../../functions/api/admin/resume/versions/[id]/recheck.js";
import { onRequestGet as bundledRoute } from "../../functions/api/admin/resume/bundled.js";
import { onRequestGet as resumeContextRoute } from "../../functions/api/admin/resume/context.js";
import { onRequest as apiMiddleware } from "../../functions/api/admin/_middleware.js";
import { onRequest as pageMiddleware } from "../../functions/admin/_middleware.js";
import { onRequest as publicResume } from "../../functions/Atishay-Kasliwal-Resume.pdf.js";
import { onRequest as publicProfile } from "../../functions/api/profile.json.js";
import { validateSchema } from "../../src/profile/schema-check.js";
import { sha256Hex } from "../../src/resume-core/constants.js";
import { checkResume, recheckText } from "../../src/resume-core/report.js";
import { reviewItems } from "../../src/profile/review.js";
import { accessFixture, bundledPdf, outdatedPdf, canonicalProfile, consistentResumeLines, makePdf, memoryAssets, memoryD1, memoryR2, profileSchema, SITE } from "./helpers.mjs";

const env = { ACCESS_TEAM_DOMAIN: "team.example", ACCESS_AUD: "aud-1", ADMIN_EMAILS: "owner@example.com" };
let access;
let realFetch;
const publicFetches = [];

before(async () => {
  access = await accessFixture();
  realFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url === "https://team.example/cdn-cgi/access/certs") return Response.json(access.certs);
    if (url.startsWith(SITE)) {
      publicFetches.push({ url, init });
      return new Response("<!doctype html><title>t</title>", { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=0" } });
    }
    throw new Error(`unexpected fetch ${url}`);
  };
  Object.assign(env, { DB: memoryD1(), RESUMES: memoryR2(), ASSETS: memoryAssets() });
});

after(() => {
  globalThis.fetch = realFetch;
});

async function call(handler, path, { email = "owner@example.com", method = "GET", body, headers = {}, params = {}, origin = SITE } = {}) {
  const all = { ...headers };
  if (email) all["Cf-Access-Jwt-Assertion"] = await access.token(email);
  if (origin && method !== "GET" && method !== "HEAD") all.Origin = origin;
  const request = new Request(`${SITE}${path}`, { method, headers: all, body });
  return handler({ request, env: { ...env }, params, data: {}, next: async () => new Response("static page", { headers: { "Content-Type": "text/html" } }) });
}

// As the admin page does: the full check runs first (in the browser), and its report goes with the file.
const browserReport = (bytes, name = "resume.pdf", type = "application/pdf") => checkResume(bytes, { filename: name, contentType: type, profile: canonicalProfile(), reviewItems });
const pdfForm = async (bytes, name = "resume.pdf", type = "application/pdf", report) => {
  const form = new FormData();
  form.append("file", new File([bytes], name, { type }));
  const value = report === undefined ? await browserReport(bytes, name, type) : report;
  if (value !== null) form.append("report", typeof value === "string" ? value : JSON.stringify(value));
  return form;
};
const upload = async (bytes, options = {}) => call(uploadRoute, "/api/admin/resume/versions", { method: "POST", body: await pdfForm(bytes, options.name, options.type, options.report), ...options });
const publish = (id, body, options = {}) =>
  call(publishRoute, `/api/admin/resume/versions/${id}/publish`, { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" }, params: { id }, ...options });

test("admin routes and pages need an Access sign-in from an allowed email", async () => {
  const routes = [
    [stateRoute, "/api/admin/resume", "GET"],
    [uploadRoute, "/api/admin/resume/versions", "POST"],
    [versionRoute, "/api/admin/resume/versions/0123456789abcdef", "GET"],
    [fileRoute, "/api/admin/resume/versions/0123456789abcdef/file", "GET"],
    [publishRoute, "/api/admin/resume/versions/0123456789abcdef/publish", "POST"],
    [recheckRoute, "/api/admin/resume/versions/0123456789abcdef/recheck", "POST"],
    [bundledRoute, "/api/admin/resume/bundled", "GET"],
    [resumeContextRoute, "/api/admin/resume/context", "GET"],
    [apiMiddleware, "/api/admin/anything", "GET"],
    [pageMiddleware, "/admin/resume/", "GET"],
    [pageMiddleware, "/admin/responses/", "GET"],
    [pageMiddleware, "/admin/anything/", "GET"],
  ];
  for (const [handler, path, method] of routes) {
    const params = { id: "0123456789abcdef" };
    assert.equal((await call(handler, path, { email: null, method, params })).status, 401, `${path} without sign-in`);
    assert.equal((await call(handler, path, { email: "stranger@example.com", method, params })).status, 403, `${path} for another account`);
  }
  const wrongAudience = new Request(`${SITE}/api/admin/resume`, { headers: { "Cf-Access-Jwt-Assertion": await access.token("owner@example.com", { aud: "other" }) } });
  assert.equal((await stateRoute({ request: wrongAudience, env })).status, 403);

  const page = await call(pageMiddleware, "/admin/resume/");
  assert.equal(page.status, 200);
  assert.equal(page.headers.get("Cache-Control"), "no-store");
  assert.match(page.headers.get("X-Robots-Tag"), /noindex/);
  assert.match(page.headers.get("Content-Security-Policy"), /frame-ancestors 'none'/);
  const root = await call(pageMiddleware, "/admin");
  assert.equal(root.status, 302);
  assert.equal(root.headers.get("Location"), "/admin/resume/");
});

test("forged, replayed-elsewhere or malformed Access tokens never reach admin code", async () => {
  const b64 = value => Buffer.from(JSON.stringify(value)).toString("base64url");
  const valid = await access.token("owner@example.com");
  const [header, payload, signature] = valid.split(".");
  const now = Math.floor(Date.now() / 1000);
  const attempts = {
    "wrong issuer": await access.token("owner@example.com", { iss: "https://other-team.cloudflareaccess.com" }),
    "missing issuer": await access.token("owner@example.com", { iss: null }),
    "not yet valid": await access.token("owner@example.com", { nbf: now + 3600 }),
    expired: await access.token("owner@example.com", { exp: now - 10 }),
    "unknown key": await access.token("owner@example.com", { kid: "rotated-away" }),
    "payload swapped under the original signature": `${header}.${b64({ ...JSON.parse(Buffer.from(payload, "base64url")), email: "stranger@example.com" })}.${signature}`,
    "alg none": `${b64({ alg: "none", kid: "k1" })}.${payload}.`,
    "alg HS256": `${b64({ alg: "HS256", kid: "k1" })}.${payload}.${signature}`,
    "signature garbage": `${header}.${payload}.!!!`,
    "two parts": `${header}.${payload}`,
    "not base64 json": "a.b.c",
  };
  for (const [label, token] of Object.entries(attempts)) {
    const request = new Request(`${SITE}/api/admin/resume`, { headers: { "Cf-Access-Jwt-Assertion": token } });
    const response = await stateRoute({ request, env });
    assert.ok([401, 403].includes(response.status), `${label}: got ${response.status}`);
    const page = await pageMiddleware({ request: new Request(`${SITE}/admin/resume/`, { headers: { "Cf-Access-Jwt-Assertion": token } }), env, next: async () => new Response("secret page") });
    assert.ok([401, 403].includes(page.status), `${label} (page): got ${page.status}`);
  }
  // The token is only read from the header Cloudflare Access sets, never from cookies or the URL.
  const viaCookie = new Request(`${SITE}/api/admin/resume`, { headers: { Cookie: `CF_Authorization=${valid}` } });
  assert.equal((await stateRoute({ request: viaCookie, env })).status, 401);
  const viaQuery = new Request(`${SITE}/api/admin/resume?token=${valid}`);
  assert.equal((await stateRoute({ request: viaQuery, env })).status, 401);
  // Missing configuration fails closed instead of accepting everyone.
  for (const missing of ["ACCESS_AUD", "ACCESS_TEAM_DOMAIN", "ADMIN_EMAILS"]) {
    const request = new Request(`${SITE}/api/admin/resume`, { headers: { "Cf-Access-Jwt-Assertion": valid } });
    const response = await stateRoute({ request, env: { ...env, [missing]: "" } });
    assert.equal(response.status, 503, `${missing} unset`);
  }
  // Allowlist matching ignores case and surrounding spaces only.
  const spaced = new Request(`${SITE}/api/admin/resume`, { headers: { "Cf-Access-Jwt-Assertion": await access.token("Owner@Example.com") } });
  assert.equal((await stateRoute({ request: spaced, env: { ...env, ADMIN_EMAILS: " owner@example.com , other@example.com" } })).status, 200);
});

test("state-changing calls from another origin are refused", async () => {
  const response = await upload(makePdf(consistentResumeLines()), { origin: "https://evil.example" });
  assert.equal(response.status, 403);
  const missing = await upload(makePdf(consistentResumeLines()), { origin: null });
  assert.equal(missing.status, 403);
});

test("the admin pages are served by the Function after the Access check, never as static files", async t => {
  let pageRoute;
  try {
    ({ onRequestGet: pageRoute } = await import("../../functions/admin/[[path]].js"));
  } catch {
    return t.skip("run npm run build first: functions/_generated/admin-pages.js is generated");
  }
  const get = path => pageRoute({ request: new Request(`${SITE}${path}`) });
  const page = await get("/admin/resume/");
  assert.equal(page.status, 200);
  assert.match(await page.text(), /<title>Résumé admin<\/title>/);
  assert.equal((await get("/admin/responses/")).status, 404, "the responses inspector moved to Admin");
  assert.equal((await get("/admin/resume")).status, 308);
  assert.equal((await get("/admin/other/")).status, 404);
  // And nothing in the build output serves them.
  const fs = await import("node:fs");
  assert.equal(fs.existsSync(new URL("../../dist/admin", import.meta.url)), false);
  assert.equal(fs.existsSync(new URL("../../dist/photography/admin", import.meta.url)), false);
  const { onRequestGet: photography } = await import("../../functions/photography/admin/[[path]].js");
  for (const path of ["/photography/admin/", "/photography/admin/index.html", "/photography/admin%2F", "/%70hotography/admin/", "/photography/admin/seo/", "/photography/admin/seo/report.json"]) {
    const request = new Request(`${SITE}${path}`);
    assert.equal((await photography({ request, env })).status, 401, path);
  }
  // The photography admin pages moved to Admin: signed in, they are a 404; only the report JSON remains.
  const authHeaders = { "Cf-Access-Jwt-Assertion": await access.token("owner@example.com") };
  for (const path of ["/photography/admin/", "/photography/admin/seo/"]) {
    const moved = await photography({ request: new Request(`${SITE}${path}`, { headers: authHeaders }), env });
    assert.equal(moved.status, 404, path);
    assert.equal(moved.headers.get("Cache-Control"), "no-store");
  }
  const report = await photography({ request: new Request(`${SITE}/photography/admin/seo/report.json`, { headers: authHeaders }), env });
  assert.equal(report.status, 200);
  assert.ok((await report.json()).summary.pages > 0);
});

test("the admin can preview the bundled PDF and load what uploads are checked against", async () => {
  const bundled = await call(bundledRoute, "/api/admin/resume/bundled");
  assert.equal(bundled.status, 200);
  assert.equal(bundled.headers.get("Content-Type"), "application/pdf");
  assert.equal(bundled.headers.get("Cache-Control"), "no-store");
  assert.equal(await sha256Hex(await bundled.arrayBuffer()), await sha256Hex(bundledPdf()));
  const context = await (await call(resumeContextRoute, "/api/admin/resume/context")).json();
  assert.ok(context.profile.profile.name);
  assert.ok(context.reviewItems.some(item => item.acceptedOnResume?.length), "the full review register, for the browser's check");
});

test("before anything is published the bundled PDF and the built profile are served", async () => {
  const pdf = await publicResume({ request: new Request(`${SITE}/Atishay-Kasliwal-Resume.pdf`), env });
  assert.equal(pdf.headers.get("X-Served-By"), "assets");
  const profile = await publicProfile({ request: new Request(`${SITE}/api/profile.json`), env });
  const body = await profile.json();
  assert.equal(body.profile.resume.version.source, "bundled");
  // The dashboard says the bundled PDF is live, with its build-time report (it agrees with the profile).
  const state = await (await call(stateRoute, "/api/admin/resume")).json();
  assert.deepEqual(state.serving, { source: "bundled", reason: "nothing-published" });
  assert.equal(state.bundled.sha256, await sha256Hex(bundledPdf()));
  assert.equal(state.bundled.report.consistency.summary.conflict, 0);
  assert.ok(state.bundled.report.checkedAt);
  assert.equal(profile.headers.get("X-Resume-Version"), "bundled");
  assert.equal(profile.headers.get("Access-Control-Allow-Origin"), "*");
});

let first;
let second;

test("invalid uploads are rejected and audited, and nothing is stored", async () => {
  const before = env.RESUMES.objects.size;
  const exe = await upload(Uint8Array.from([0x4d, 0x5a, ...new Uint8Array(4096)]), { name: "resume.pdf" });
  assert.equal(exe.status, 422);
  assert.match((await exe.json()).validation.errors.join(" "), /executable/);
  // The server screens the file itself: a forged "passing" report does not get a script through.
  const scripted = makePdf(consistentResumeLines(), { catalogExtra: "/OpenAction 6 0 R ", extraObjects: ["<< /S /JavaScript /JS (app.alert(1)) >>"] });
  const forged = { ...(await browserReport(makePdf(consistentResumeLines()))), sha256: await sha256Hex(scripted) };
  const script = await upload(scripted, { report: forged });
  assert.equal(script.status, 422);
  assert.match((await script.json()).validation.errors.join(" "), /JavaScript/);
  const huge = await call(uploadRoute, "/api/admin/resume/versions", { method: "POST", body: "x", headers: { "Content-Length": String(6 * 1024 * 1024) } });
  assert.equal(huge.status, 413);
  assert.equal(env.RESUMES.objects.size, before);
  const state = await (await call(stateRoute, "/api/admin/resume")).json();
  assert.equal(state.versions.length, 0);
  assert.equal(state.audit.filter(entry => entry.action === "upload_rejected").length, 3);
});

test("an upload needs the browser's report for that exact file, and its counts are recomputed", async () => {
  const bytes = makePdf([...consistentResumeLines(), "Extra line for a distinct file"]);
  assert.equal((await upload(bytes, { report: null })).status, 400, "no report");
  assert.equal((await upload(bytes, { report: "{" })).status, 400, "not JSON");
  const other = await browserReport(makePdf(consistentResumeLines()));
  assert.equal((await upload(bytes, { report: other })).status, 400, "report for a different file");
  const report = await browserReport(bytes);
  assert.equal((await upload(bytes, { report: { ...report, text: "not lines" } })).status, 400, "malformed text");
  assert.equal((await upload(bytes, { report: { ...report, validation: { ...report.validation, info: { ...report.validation.info, pages: 99 } } } })).status, 400, "impossible page count");
  assert.equal(env.RESUMES.objects.size, 0, "nothing stored for a bad report");
});

test("upload stores a private, unpublished version with its report", async () => {
  const response = await upload(outdatedPdf(), { name: "Atishay Kasliwal Resume.pdf" });
  assert.equal(response.status, 201);
  first = (await response.json()).version;
  assert.equal(first.sha256, await sha256Hex(outdatedPdf()));
  assert.equal(first.active, false);
  assert.ok(env.RESUMES.objects.has(`versions/${first.sha256}.pdf`));
  assert.ok(first.report.consistency.items.some(item => item.id === "stony-brook-research-end-date"), "outdated Present is flagged on upload");
  assert.equal(first.report.validation.checkedIn, "browser");
  assert.ok(first.report.validation.serverChecks.some(check => check.id === "active-content" && check.ok), "the server's own screen is recorded");

  const again = await upload(outdatedPdf());
  assert.equal(again.status, 200);
  assert.equal((await again.json()).duplicate, true);

  const preview = await call(fileRoute, `/api/admin/resume/versions/${first.id}/file`, { params: { id: first.id } });
  assert.equal(preview.status, 200);
  assert.equal(preview.headers.get("Content-Type"), "application/pdf");
  assert.equal(preview.headers.get("X-Frame-Options"), "SAMEORIGIN");
  assert.equal((await preview.arrayBuffer()).byteLength, outdatedPdf().length);

  // Uploading changes nothing public.
  const pdf = await publicResume({ request: new Request(`${SITE}/Atishay-Kasliwal-Resume.pdf`), env });
  assert.equal(pdf.headers.get("X-Served-By"), "assets");
});

test("publishing needs the exact file and an acknowledgement of conflicts", async () => {
  assert.equal((await publish(first.id, { sha256: "0".repeat(64), acknowledgeConflicts: true })).status, 409);
  const unacknowledged = await publish(first.id, { sha256: first.sha256 });
  assert.equal(unacknowledged.status, 409);
  assert.equal((await unacknowledged.json()).needsAcknowledgement, true);
  const wrongType = await call(publishRoute, `/api/admin/resume/versions/${first.id}/publish`, { method: "POST", body: "{}", params: { id: first.id } });
  assert.equal(wrongType.status, 415);
  const ok = await publish(first.id, { sha256: first.sha256, acknowledgeConflicts: true, reason: "first publish" });
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).action, "publish");
  assert.equal((await publish(first.id, { sha256: first.sha256, acknowledgeConflicts: true })).status, 409, "already published");
});

test("the stable public URL, the profile API and caching follow the published version", async () => {
  const pdf = await publicResume({ request: new Request(`${SITE}/Atishay-Kasliwal-Resume.pdf`), env });
  assert.equal(pdf.status, 200);
  assert.equal(pdf.headers.get("X-Served-By"), null, "served from R2, not the asset store");
  assert.equal(pdf.headers.get("ETag"), `"${first.sha256}"`);
  assert.equal(pdf.headers.get("Cache-Control"), "public, max-age=0, must-revalidate");
  assert.equal(pdf.headers.get("X-Resume-Version"), first.id);
  assert.equal(await sha256Hex(await pdf.arrayBuffer()), first.sha256);

  const cached = await publicResume({ request: new Request(`${SITE}/Atishay-Kasliwal-Resume.pdf`, { headers: { "If-None-Match": `"${first.sha256}"` } }), env });
  assert.equal(cached.status, 304);
  const range = await publicResume({ request: new Request(`${SITE}/Atishay-Kasliwal-Resume.pdf`, { headers: { Range: "bytes=0-99" } }), env });
  assert.equal(range.status, 206);
  assert.equal(range.headers.get("Content-Range"), `bytes 0-99/${first.sizeBytes}`);
  assert.equal((await range.arrayBuffer()).byteLength, 100);
  const head = await publicResume({ request: new Request(`${SITE}/Atishay-Kasliwal-Resume.pdf`, { method: "HEAD" }), env });
  assert.equal(head.headers.get("Content-Length"), String(first.sizeBytes));
  assert.equal((await publicResume({ request: new Request(`${SITE}/Atishay-Kasliwal-Resume.pdf`, { method: "POST" }), env })).status, 405);

  const api = await publicProfile({ request: new Request(`${SITE}/api/profile.json`), env });
  const body = await api.json();
  assert.deepEqual(validateSchema(profileSchema(), body), []);
  assert.equal(body.profile.resume.url, `${SITE}/Atishay-Kasliwal-Resume.pdf`);
  assert.equal(body.profile.resume.version.sha256, first.sha256);
  assert.equal(body.profile.resume.version.source, "published");
  assert.equal(api.headers.get("X-Resume-Version"), first.id);
  const notModified = await publicProfile({ request: new Request(`${SITE}/api/profile.json`, { headers: { "If-None-Match": api.headers.get("ETag") } }), env });
  assert.equal(notModified.status, 304);
});

test("a new version replaces it, and an earlier one can be restored", async () => {
  // A report that under-counts its own conflicts is stored with the real count.
  const bytes = makePdf(consistentResumeLines());
  const report = await browserReport(bytes, "regenerated.pdf");
  const response = await upload(bytes, { name: "regenerated.pdf", report: { ...report, consistency: { ...report.consistency, summary: { conflict: 0, unverified: 0, info: 0 } } } });
  assert.equal(response.status, 201);
  second = (await response.json()).version;
  assert.equal(second.report.consistency.summary.unverified, report.consistency.summary.unverified);
  assert.equal(second.report.consistency.summary.conflict, 0);
  assert.equal((await publish(second.id, { sha256: second.sha256 })).status, 200, "no conflicts, no acknowledgement needed");
  let pdf = await publicResume({ request: new Request(`${SITE}/Atishay-Kasliwal-Resume.pdf`), env });
  assert.equal(await sha256Hex(await pdf.arrayBuffer()), second.sha256);

  const restored = await publish(first.id, { sha256: first.sha256, acknowledgeConflicts: true, reason: "roll back" });
  assert.equal((await restored.json()).action, "restore");
  pdf = await publicResume({ request: new Request(`${SITE}/Atishay-Kasliwal-Resume.pdf`), env });
  assert.equal(await sha256Hex(await pdf.arrayBuffer()), first.sha256);

  const state = await (await call(stateRoute, "/api/admin/resume")).json();
  assert.equal(state.active.id, first.id);
  assert.equal(state.versions.length, 2);
  assert.equal(state.versions.find(v => v.id === second.id).firstPublishedAt !== null, true);
  const actions = state.audit.map(entry => entry.action).reverse();
  assert.deepEqual(actions.filter(a => a === "publish" || a === "restore"), ["publish", "publish", "restore"]);
  const restore = state.audit.find(entry => entry.action === "restore");
  assert.equal(restore.actor, "owner@example.com");
  assert.equal(restore.detail.previousVersionId, second.id);
  assert.equal(restore.detail.reason, "roll back");
  assert.equal(state.audit.find(entry => entry.action === "publish").sha256.length, 64);
});

test("re-checking replaces the report without publishing anything", async () => {
  const { version } = await (await call(versionRoute, `/api/admin/resume/versions/${second.id}`, { params: { id: second.id } })).json();
  const consistency = recheckText(version.report.text, { profile: canonicalProfile(), reviewItems });
  const recheck = body => call(recheckRoute, `/api/admin/resume/versions/${second.id}/recheck`, { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" }, params: { id: second.id } });
  assert.equal((await recheck({ consistency: { items: [{ id: "x", severity: "nonsense", message: "m" }] } })).status, 400);
  const response = await recheck({ consistency });
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).version.report.consistency.summary, consistency.summary);
  const state = await (await call(stateRoute, "/api/admin/resume")).json();
  assert.equal(state.active.id, first.id);
  assert.equal(state.audit[0].action, "recheck");
});

test("the dashboard reports a fallback when the published file cannot be served", async () => {
  const published = await (await call(stateRoute, "/api/admin/resume")).json();
  assert.deepEqual(published.serving, { source: "published", reason: null });
  const missing = await stateRoute({
    request: new Request(`${SITE}/api/admin/resume`, { headers: { "Cf-Access-Jwt-Assertion": await access.token("owner@example.com") } }),
    env: { ...env, RESUMES: memoryR2() },
  });
  const body = await missing.json();
  assert.deepEqual(body.serving, { source: "bundled", reason: "published-file-missing" });
  assert.equal(body.active.id, first.id, "the published record is still shown, as not served");
});

test("if D1 or R2 fails the public URL falls back to the bundled PDF", async () => {
  const brokenDb = { prepare: () => ({ first: async () => { throw new Error("D1 down"); } }) };
  const quiet = console.error;
  console.error = () => {};
  try {
    const pdf = await publicResume({ request: new Request(`${SITE}/Atishay-Kasliwal-Resume.pdf`), env: { ...env, DB: brokenDb } });
    assert.equal(pdf.headers.get("X-Served-By"), "assets");
    const emptyBucket = await publicResume({ request: new Request(`${SITE}/Atishay-Kasliwal-Resume.pdf`), env: { ...env, RESUMES: memoryR2() } });
    assert.equal(emptyBucket.headers.get("X-Served-By"), "assets");
    const api = await publicProfile({ request: new Request(`${SITE}/api/profile.json`), env: { ...env, DB: brokenDb } });
    assert.equal((await api.json()).profile.resume.version.source, "bundled");
  } finally {
    console.error = quiet;
  }
});

