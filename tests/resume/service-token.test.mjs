// The analytics dashboard calls the admin APIs server to server with a Cloudflare Access service
// token (functions/_lib/access.js). It must reach exactly the routes it proxies, never a page, and
// only when ADMIN_SERVICE_TOKEN_ID names it.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { readdirSync, readFileSync } from "node:fs";
import { requireAdmin, SERVICE_ACTOR } from "../../functions/_lib/access.js";
import { onRequestGet as stateRoute } from "../../functions/api/admin/resume/index.js";
import { onRequestGet as contextRoute } from "../../functions/api/admin/responses/context.js";
import { onRequest as apiMiddleware } from "../../functions/api/admin/_middleware.js";
import { onRequest as pageMiddleware } from "../../functions/admin/_middleware.js";
import { onRequestGet as photosRoute } from "../../functions/api/photography/admin/photos.js";
import { onRequestPost as uploadRoute } from "../../functions/api/photography/admin/upload.js";
import { onRequestGet as insightsRoute } from "../../functions/api/photography/admin/insights.js";
import { onRequestGet as feedbackFacets } from "../../functions/api/github-feedback/admin/facets.js";
import { accessFixture, memoryAssets, memoryD1, memoryR2, SITE } from "./helpers.mjs";

const CLIENT_ID = "0123abcd.access";
const base = { ACCESS_TEAM_DOMAIN: "team.example", ACCESS_AUD: "aud-1", ADMIN_EMAILS: "owner@example.com", ADMIN_SERVICE_TOKEN_ID: CLIENT_ID };
let env;
let access;
let realFetch;

before(async () => {
  access = await accessFixture();
  realFetch = globalThis.fetch;
  globalThis.fetch = async input => {
    const url = String(input instanceof Request ? input.url : input);
    if (url === "https://team.example/cdn-cgi/access/certs") return Response.json(access.certs);
    return new Response("<!doctype html><title>t</title>", { headers: { "Content-Type": "text/html; charset=utf-8" } });
  };
  const db = memoryD1();
  for (const file of readdirSync(new URL("../../migrations/", import.meta.url)).sort()) {
    if (file !== "0005_resume_versions.sql") db.sqlite.exec(readFileSync(new URL(`../../migrations/${file}`, import.meta.url), "utf8"));
  }
  env = { ...base, DB: db, RESUMES: memoryR2(), PHOTOS: memoryR2(), ASSETS: memoryAssets() };
});
after(() => {
  globalThis.fetch = realFetch;
});

const serviceToken = (commonName = CLIENT_ID) => access.token(undefined, { claims: { common_name: commonName, sub: "" } });
const request = async (path, { token, method = "GET", actor } = {}) =>
  new Request(`${SITE}${path}`, {
    method,
    headers: { "Cf-Access-Jwt-Assertion": token ?? (await serviceToken()), ...(actor ? { "X-Admin-Actor": actor } : {}), ...(method === "GET" ? {} : { Origin: SITE }) },
  });
const run = async (handler, path, options = {}, extraEnv = {}) =>
  handler({ request: await request(path, options), env: { ...env, ...extraEnv }, params: options.params ?? {}, data: {}, next: async () => new Response("page", { headers: { "Content-Type": "text/html" } }) });

test("requireAdmin takes a service token only where a route opts in and the Client ID matches", async () => {
  const req = await request("/api/admin/resume");
  assert.deepEqual(await requireAdmin(req, env), { ok: false, status: 403 }, "a route that does not opt in refuses it");
  assert.equal((await requireAdmin(req, env, { allowService: true })).ok, true);
  assert.equal((await requireAdmin(req, { ...env, ADMIN_SERVICE_TOKEN_ID: "" }, { allowService: true })).status, 403, "unset ID accepts no token");
  const other = await request("/api/admin/resume", { token: await serviceToken("someone-else.access") });
  assert.equal((await requireAdmin(other, env, { allowService: true })).status, 403, "another token's Client ID is refused");
  const wrongAud = await request("/api/admin/resume", { token: await access.token(undefined, { aud: "other", claims: { common_name: CLIENT_ID } }) });
  assert.equal((await requireAdmin(wrongAud, env, { allowService: true })).status, 403, "the audience is still checked");
});

test("the recorded actor is X-Admin-Actor only when it names an allowed email", async () => {
  const named = await requireAdmin(await request("/api/admin/resume", { actor: "Owner@Example.com" }), env, { allowService: true });
  assert.deepEqual(named, { ok: true, email: "owner@example.com", service: true });
  const stranger = await requireAdmin(await request("/api/admin/resume", { actor: "mallory@example.com" }), env, { allowService: true });
  assert.equal(stranger.email, SERVICE_ACTOR);
  const missing = await requireAdmin(await request("/api/admin/resume"), env, { allowService: true });
  assert.equal(missing.email, SERVICE_ACTOR);
  // A signed-in person's own email wins; the header is ignored for them.
  const person = await requireAdmin(await request("/api/admin/resume", { token: await access.token("owner@example.com"), actor: "other@example.com" }), env, { allowService: true });
  assert.deepEqual(person, { ok: true, email: "owner@example.com" });
});

test("the dashboard reaches the résumé, photo and feedback APIs it proxies", async () => {
  assert.equal((await run(apiMiddleware, "/api/admin/resume")).status, 200, "the /api/admin backstop lets résumé paths through");
  assert.equal((await run(stateRoute, "/api/admin/resume")).status, 200);
  assert.equal((await run(photosRoute, "/api/photography/admin/photos")).status, 200);
  assert.equal((await run(feedbackFacets, "/api/github-feedback/admin/facets")).status, 200);
});

test("the service token never opens a page or an API the dashboard does not proxy", async () => {
  assert.equal((await run(apiMiddleware, "/api/admin/responses/context")).status, 403, "backstop refuses non-résumé /api/admin paths");
  assert.equal((await run(contextRoute, "/api/admin/responses/context")).status, 403);
  assert.equal((await run(pageMiddleware, "/admin/resume/")).status, 403, "admin pages refuse it");
  assert.equal((await run(uploadRoute, "/api/photography/admin/upload", { method: "POST" })).status, 403, "photo upload refuses it");
  assert.equal((await run(insightsRoute, "/api/photography/admin/insights")).status, 403, "photo insights refuse it");
});

test("on the photography admin route, only the SEO report JSON accepts it", async t => {
  let route;
  try {
    ({ onRequestGet: route } = await import("../../functions/photography/admin/[[path]].js"));
  } catch {
    return t.skip("run npm run build first: functions/_generated/ is generated");
  }
  assert.equal((await run(route, "/photography/admin/seo/report.json")).status, 200);
  for (const page of ["/photography/admin/", "/photography/admin/seo/", "/photography/admin/seo/report.json/"]) {
    assert.equal((await run(route, page)).status, 403, `${page} refuses it`);
  }
});
