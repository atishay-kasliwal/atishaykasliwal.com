import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { onRequestGet as entries } from "../../functions/api/github-feedback/admin/entries.js";
import { onRequestGet as entry, onRequestPatch as patchEntry } from "../../functions/api/github-feedback/admin/entries/[id].js";
import { onRequestGet as facets } from "../../functions/api/github-feedback/admin/facets.js";
import { onRequestGet as exportRoute } from "../../functions/api/github-feedback/admin/export.js";
import { fixtureRows, importRows, memoryD1 } from "./helpers.mjs";

// Runs the real Pages Functions, including Cloudflare Access JWT verification, against a
// signing key whose public half is served from a stubbed certs endpoint.
const b64url = bytes => Buffer.from(bytes).toString("base64url");
let privateKey;
let realFetch;
const env = { ACCESS_TEAM_DOMAIN: "team.example", ACCESS_AUD: "aud-1", ADMIN_EMAILS: "owner@example.com" };

before(async () => {
  const pair = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  );
  privateKey = pair.privateKey;
  const jwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  realFetch = globalThis.fetch;
  globalThis.fetch = async url => {
    assert.equal(String(url), "https://team.example/cdn-cgi/access/certs");
    return Response.json({ keys: [{ ...jwk, kid: "k1" }] });
  };
  env.DB = memoryD1();
  await importRows(env.DB, fixtureRows());
});

after(() => {
  globalThis.fetch = realFetch;
});

async function token(email) {
  const header = b64url(JSON.stringify({ alg: "RS256", kid: "k1" }));
  const payload = b64url(JSON.stringify({ aud: "aud-1", iss: "https://team.example", email, exp: Math.floor(Date.now() / 1000) + 600 }));
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, new TextEncoder().encode(`${header}.${payload}`));
  return `${header}.${payload}.${b64url(signature)}`;
}

async function call(handler, path, { email = "owner@example.com", method = "GET", body, params = {} } = {}) {
  const headers = email ? { "Cf-Access-Jwt-Assertion": await token(email) } : {};
  const request = new Request(`https://atishaykasliwal.com${path}`, { method, headers, body });
  return handler({ request, env, params });
}

test("every route needs an Access sign-in from an allowed email", async () => {
  for (const [handler, path] of [[entries, "/api/github-feedback/admin/entries"], [facets, "/api/github-feedback/admin/facets"], [exportRoute, "/api/github-feedback/admin/export"]]) {
    assert.equal((await call(handler, path, { email: null })).status, 401, path);
    assert.equal((await call(handler, path, { email: "stranger@example.com" })).status, 403, path);
  }
  const patched = await call(patchEntry, "/x", { email: null, method: "PATCH", body: "{}", params: { id: "a".repeat(24) } });
  assert.equal(patched.status, 401);
});

test("list, edit, and export through the HTTP handlers", async () => {
  const listed = await call(entries, "/api/github-feedback/admin/entries?own=exclude&descriptions=exclude&sentiment=Neutral");
  assert.equal(listed.status, 200);
  assert.equal(listed.headers.get("Cache-Control"), "no-store");
  const page = await listed.json();
  assert.deepEqual(page.counts, { entries: 2, Positive: 0, Neutral: 2, Negative: 0 });

  const target = page.entries.find(item => item.type === "comment");
  const bad = await call(patchEntry, "/x", { method: "PATCH", body: "not json", params: { id: target.id } });
  assert.equal(bad.status, 400);
  const response = await call(patchEntry, "/x", { method: "PATCH", body: JSON.stringify({ sentiment: "Positive", reason: "Thanked me for the report." }), params: { id: target.id } });
  assert.equal(response.status, 200);
  const edited = await response.json();
  assert.equal(edited.sentiment.label, "Positive");
  assert.equal(edited.sentiment.editedBy, "owner@example.com", "editor comes from the verified token");

  const detail = await (await call(entry, "/x", { params: { id: target.id } })).json();
  assert.equal(detail.history.length, 1);
  assert.equal((await call(entry, "/x", { params: { id: "nope" } })).status, 404);
  assert.equal((await call(entries, "/api/github-feedback/admin/entries?sentiment=Great")).status, 400);

  const exported = await call(exportRoute, "/api/github-feedback/admin/export?sentiment=Positive");
  assert.equal(exported.headers.get("Content-Type"), "text/csv; charset=utf-8");
  assert.match(exported.headers.get("Content-Disposition"), /^attachment; filename="github-feedback-\d{4}-\d{2}-\d{2}\.csv"$/);
  assert.equal(exported.headers.get("X-Entry-Count"), "3");
  const text = await exported.text();
  assert.ok(text.includes("Thanked me for the report."));

  const summary = await (await call(facets, "/api/github-feedback/admin/facets")).json();
  assert.equal(summary.totals.Positive, 3);
  assert.ok(summary.authors.some(author => author.login === "helper[bot]" && author.attribution === "Organization" && author.avatarUrl.includes("/in/5")));
  assert.equal(summary.repositories.find(repo => repo.fullName === "me/private-tool").visibility, "private");
});
