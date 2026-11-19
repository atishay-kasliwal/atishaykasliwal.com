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
import { onRequestGet as contextRoute } from "../../functions/api/admin/responses/context.js";
import { onRequestGet as fetchRoute } from "../../functions/api/admin/responses/fetch.js";
import { onRequest as apiMiddleware } from "../../functions/api/admin/_middleware.js";
import { onRequest as pageMiddleware } from "../../functions/admin/_middleware.js";
import { onRequest as publicResume } from "../../functions/Atishay-Kasliwal-Resume.pdf.js";
import { onRequest as publicProfile } from "../../functions/api/profile.json.js";
import { validateSchema } from "../../src/profile/schema-check.js";
import { sha256Hex } from "../../src/resume-core/constants.js";
import { accessFixture, bundledPdf, consistentResumeLines, makePdf, memoryAssets, memoryD1, memoryR2, profileSchema, SITE } from "./helpers.mjs";

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

const pdfForm = (bytes, name = "resume.pdf", type = "application/pdf") => {
  const form = new FormData();
  form.append("file", new File([bytes], name, { type }));
  return form;
};
const upload = (bytes, options = {}) => call(uploadRoute, "/api/admin/resume/versions", { method: "POST", body: pdfForm(bytes, options.name, options.type), ...options });
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
    [contextRoute, "/api/admin/responses/context", "GET"],
    [fetchRoute, "/api/admin/responses/fetch?target=home", "GET"],
    [apiMiddleware, "/api/admin/anything", "GET"],
    [pageMiddleware, "/admin/resume/", "GET"],
    [pageMiddleware, "/admin/responses/", "GET"],
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
  assert.match(await (await get("/admin/responses/")).text(), /<title>Response inspector<\/title>/);
  assert.equal((await get("/admin/resume")).status, 308);
  assert.equal((await get("/admin/other/")).status, 404);
  // And nothing in the build output serves them.
  const fs = await import("node:fs");
  assert.equal(fs.existsSync(new URL("../../dist/admin", import.meta.url)), false);
});

test("before anything is published the bundled PDF and the built profile are served", async () => {
  const pdf = await publicResume({ request: new Request(`${SITE}/Atishay-Kasliwal-Resume.pdf`), env });
  assert.equal(pdf.headers.get("X-Served-By"), "assets");
  const profile = await publicProfile({ request: new Request(`${SITE}/api/profile.json`), env });
  const body = await profile.json();
  assert.equal(body.profile.resume.version.source, "bundled");
  // The dashboard says the bundled PDF is live and that it is outdated.
  const state = await (await call(stateRoute, "/api/admin/resume")).json();
  assert.deepEqual(state.serving, { source: "bundled", reason: "nothing-published" });
  assert.equal(state.bundled.sha256, await sha256Hex(bundledPdf()));
  assert.ok(state.bundled.report.consistency.summary.conflict > 0);
  assert.ok(state.bundled.report.consistency.items.some(item => item.id === "stony-brook-research-end-date"));
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
  const script = await upload(makePdf(consistentResumeLines(), { catalogExtra: "/OpenAction 6 0 R ", extraObjects: ["<< /S /JavaScript /JS (app.alert(1)) >>"] }));
  assert.equal(script.status, 422);
  const huge = await call(uploadRoute, "/api/admin/resume/versions", { method: "POST", body: "x", headers: { "Content-Length": String(6 * 1024 * 1024) } });
  assert.equal(huge.status, 413);
  assert.equal(env.RESUMES.objects.size, before);
  const state = await (await call(stateRoute, "/api/admin/resume")).json();
  assert.equal(state.versions.length, 0);
  assert.equal(state.audit.filter(entry => entry.action === "upload_rejected").length, 3);
});

test("upload stores a private, unpublished version with its report", async () => {
  const response = await upload(bundledPdf(), { name: "Atishay Kasliwal Resume.pdf" });
  assert.equal(response.status, 201);
  first = (await response.json()).version;
  assert.equal(first.sha256, await sha256Hex(bundledPdf()));
  assert.equal(first.active, false);
  assert.ok(env.RESUMES.objects.has(`versions/${first.sha256}.pdf`));
  assert.ok(first.report.consistency.items.some(item => item.id === "stony-brook-research-end-date"), "outdated Present is flagged on upload");

  const again = await upload(bundledPdf());
  assert.equal(again.status, 200);
  assert.equal((await again.json()).duplicate, true);

  const preview = await call(fileRoute, `/api/admin/resume/versions/${first.id}/file`, { params: { id: first.id } });
  assert.equal(preview.status, 200);
  assert.equal(preview.headers.get("Content-Type"), "application/pdf");
  assert.equal(preview.headers.get("X-Frame-Options"), "SAMEORIGIN");
  assert.equal((await preview.arrayBuffer()).byteLength, bundledPdf().length);

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
  const response = await upload(makePdf(consistentResumeLines()), { name: "regenerated.pdf" });
  assert.equal(response.status, 201);
  second = (await response.json()).version;
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
  const response = await call(recheckRoute, `/api/admin/resume/versions/${second.id}/recheck`, { method: "POST", params: { id: second.id } });
  assert.equal(response.status, 200);
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

test("the inspector context and server fetch are fixed to this site", async () => {
  const context = await (await call(contextRoute, "/api/admin/responses/context")).json();
  assert.equal(context.resume.expected.sha256, first.sha256);
  assert.equal(context.resume.expected.source, "published");
  assert.equal(context.canonical.profile.resume.version.source, "bundled", "canonical is the build output, not the overlay");
  assert.ok(context.reviewItems.some(item => item.id === "stony-brook-research-end-date"));

  assert.equal((await call(fetchRoute, "/api/admin/responses/fetch?target=https://evil.example/")).status, 400);
  assert.equal((await call(fetchRoute, "/api/admin/responses/fetch?target=home&agent=wget")).status, 400);
  const result = await (await call(fetchRoute, "/api/admin/responses/fetch?target=profile&agent=gptbot")).json();
  assert.equal(result.url, `${SITE}/profile/`);
  assert.equal(result.status, 200);
  assert.match(result.userAgent, /GPTBot/);
  assert.equal(result.simulated, true);
  assert.match(result.note, /not a verified request/);
  assert.equal(result.body, "<!doctype html><title>t</title>");
  const sent = publicFetches.at(-1);
  assert.equal(sent.init.headers["User-Agent"], result.userAgent);
  assert.equal(sent.init.headers.Cookie, undefined, "no admin credentials are forwarded");
});
