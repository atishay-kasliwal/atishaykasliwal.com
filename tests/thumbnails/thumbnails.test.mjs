// Card thumbnails chosen in Admin: the admin API (list, replace, reset), what the homepage swaps in,
// and the card data the browser builds from it. See docs/card-thumbnails.md.
import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { readdirSync, readFileSync } from "node:fs";
import { onRequestGet as listRoute } from "../../functions/api/admin/thumbnails/index.js";
import { onRequestPost as replaceRoute, onRequestDelete as resetRoute } from "../../functions/api/admin/thumbnails/[section]/[slug].js";
import { onRequest as apiMiddleware } from "../../functions/api/admin/_middleware.js";
import { onRequest as homepage } from "../../functions/index.js";
import { forgetChosen, loadChosen, rewriteHomepage } from "../../functions/_lib/card-thumbnails.js";
import catalog from "../../functions/_generated/card-catalog.js";
import { accessFixture, memoryD1, memoryR2, SITE } from "../resume/helpers.mjs";

const CLIENT_ID = "0123abcd.access";
const base = {
  ACCESS_TEAM_DOMAIN: "team.example", ACCESS_AUD: "aud-1", ADMIN_EMAILS: "owner@example.com",
  ADMIN_SERVICE_TOKEN_ID: CLIENT_ID, PHOTO_PUBLIC_BASE: "https://photos.atishaykasliwal.com",
};
let access;
let realFetch;
let env;

// A WebP header (VP8X) declaring the given size: all the server reads before storing.
function webp(width, height, pad = 64) {
  const bytes = new Uint8Array(30 + pad);
  bytes.set(new TextEncoder().encode("RIFF"), 0);
  bytes.set(new TextEncoder().encode("WEBPVP8X"), 8);
  bytes[16] = 10;
  const put24 = (offset, value) => { bytes[offset] = value & 0xff; bytes[offset + 1] = (value >> 8) & 0xff; bytes[offset + 2] = (value >> 16) & 0xff; };
  put24(24, width - 1);
  put24(27, height - 1);
  bytes[29 + 1] = Math.floor(Math.random() * 256); // different content, different address
  return bytes;
}
const png = () => Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, 4, 56, 0, 0, 2, 152]);

before(async () => {
  access = await accessFixture();
  realFetch = globalThis.fetch;
  globalThis.fetch = async input => {
    const url = String(input instanceof Request ? input.url : input);
    if (url === "https://team.example/cdn-cgi/access/certs") return Response.json(access.certs);
    throw new Error(`unexpected fetch ${url}`);
  };
});
after(() => {
  globalThis.fetch = realFetch;
});
beforeEach(() => {
  const db = memoryD1();
  for (const file of readdirSync(new URL("../../migrations/", import.meta.url)).sort()) {
    if (file !== "0005_resume_versions.sql") db.sqlite.exec(readFileSync(new URL(`../../migrations/${file}`, import.meta.url), "utf8"));
  }
  env = { ...base, DB: db, PHOTOS: memoryR2() };
  forgetChosen();
});

const serviceToken = () => access.token(undefined, { claims: { common_name: CLIENT_ID, sub: "" } });
async function call(handler, path, { method = "GET", body, origin = SITE, token, params } = {}) {
  const headers = { "Cf-Access-Jwt-Assertion": token ?? (await serviceToken()), "X-Admin-Actor": "owner@example.com" };
  if (method !== "GET") headers.Origin = origin;
  const request = new Request(`${SITE}${path}`, { method, headers, body });
  const [, , , , section, slug] = new URL(request.url).pathname.split("/");
  const response = await handler({ request, env, params: params ?? { section, slug }, data: {}, next: async () => new Response("next") });
  return { status: response.status, body: await response.json().catch(() => null) };
}
const form = (full, small) => {
  const data = new FormData();
  if (full) data.append("full", new Blob([full], { type: "image/webp" }), "full.webp");
  if (small) data.append("small", new Blob([small], { type: "image/webp" }), "small.webp");
  return data;
};
const upload = (path, full = webp(1080, 664), small = webp(640, 394), options = {}) =>
  call(replaceRoute, path, { method: "POST", body: form(full, small), ...options });

test("the catalog lists all 31 cards once, with built-in images except the three drawn in HTML", () => {
  assert.equal(catalog.length, 31);
  assert.equal(new Set(catalog.map(card => card.id)).size, 31);
  assert.deepEqual(catalog.filter(card => !card.builtIn).map(card => card.id), ["project:kaggriculture", "project:atriveo-reel", "project:bayesian-marketing-mix"]);
  assert.deepEqual([...new Set(catalog.map(card => card.section))], ["project", "open-source", "volunteer"]);
});

test("replace stores both copies, points the card at them and logs it; reset goes back", async () => {
  const listed = await call(listRoute, "/api/admin/thumbnails");
  assert.equal(listed.status, 200);
  assert.equal(listed.body.cards.length, 31);
  assert.ok(listed.body.cards.every(card => card.thumbnail === null));

  const saved = await upload("/api/admin/thumbnails/project/atriveo-tracker");
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  assert.match(saved.body.thumbnail.src, /^https:\/\/photos\.atishaykasliwal\.com\/cards\/[a-f0-9]{24}-1080\.webp$/);
  assert.equal(saved.body.thumbnail.updatedBy, "owner@example.com");
  const keys = [...env.PHOTOS.objects.keys()];
  assert.equal(keys.length, 2);
  assert.ok(keys.every(key => /^cards\/[a-f0-9]{24}-(1080|640)\.webp$/.test(key)));
  assert.equal(env.PHOTOS.objects.get(keys[0]).options.httpMetadata.contentType, "image/webp");

  const card = (await call(listRoute, "/api/admin/thumbnails")).body.cards.find(c => c.id === "project:atriveo-tracker");
  assert.equal(card.thumbnail.src, saved.body.thumbnail.src);
  assert.deepEqual(await loadChosen(env), { "project:atriveo-tracker": { src: saved.body.thumbnail.src, small: saved.body.thumbnail.small } });

  const again = await upload("/api/admin/thumbnails/project/atriveo-tracker");
  const reset = await call(resetRoute, "/api/admin/thumbnails/project/atriveo-tracker", { method: "DELETE" });
  assert.equal(reset.status, 200);
  assert.equal(reset.body.thumbnail, null);
  assert.deepEqual(await loadChosen(env), {});
  const audit = env.DB.sqlite.prepare("SELECT action, sha, previous_sha, actor FROM card_thumbnail_audit ORDER BY id").all();
  const sha = src => /cards\/([a-f0-9]{24})-/.exec(src)[1];
  assert.deepEqual(audit.map(row => ({ ...row })), [
    { action: "replace", sha: sha(saved.body.thumbnail.src), previous_sha: null, actor: "owner@example.com" },
    { action: "replace", sha: sha(again.body.thumbnail.src), previous_sha: sha(saved.body.thumbnail.src), actor: "owner@example.com" },
    { action: "reset", sha: null, previous_sha: sha(again.body.thumbnail.src), actor: "owner@example.com" },
  ]);
});

test("uploads that aren't two WebPs of the card's exact sizes are refused, and nothing is stored", async () => {
  const path = "/api/admin/thumbnails/open-source/keycloak";
  const cases = [
    [webp(1200, 664), webp(640, 394), 400, /1080×664 pixels, not 1200×664/],
    [webp(1080, 664), webp(640, 400), 400, /640×394/],
    [png(), webp(640, 394), 400, /must be a WebP/],
    [webp(1080, 664), null, 400, /640px copy is missing/],
    [webp(1080, 664, 2 * 1024 * 1024), webp(640, 394), 413, /larger than 2 MB/],
  ];
  for (const [full, small, status, message] of cases) {
    const result = await upload(path, full, small);
    assert.equal(result.status, status, JSON.stringify(result.body));
    assert.match(result.body.error, message);
  }
  assert.equal(env.PHOTOS.objects.size, 0);
  assert.equal(env.DB.sqlite.prepare("SELECT COUNT(*) AS n FROM card_thumbnails").get().n, 0);
});

test("only known cards can be changed", async () => {
  for (const path of ["/api/admin/thumbnails/project/not-a-card", "/api/admin/thumbnails/photos/keycloak", "/api/admin/thumbnails/project/Atriveo%20Tracker"]) {
    const result = await upload(path);
    assert.equal(result.status, 404, path);
  }
  assert.equal((await call(resetRoute, "/api/admin/thumbnails/project/nope", { method: "DELETE" })).status, 404);
});

test("the admin routes take the dashboard's service token, refuse other callers and cross-origin writes", async () => {
  const viaMiddleware = await call(apiMiddleware, "/api/admin/thumbnails");
  assert.equal(viaMiddleware.status, 200, "the /api/admin backstop lets the service token through to thumbnails");
  const stranger = await access.token("someone@example.com");
  assert.equal((await call(listRoute, "/api/admin/thumbnails", { token: stranger })).status, 403);
  assert.equal((await upload("/api/admin/thumbnails/project/medscan", undefined, undefined, { origin: "https://evil.example" })).status, 403);
});

test("the homepage only ever uses rows for existing cards with photos-domain URLs", async () => {
  const insert = env.DB.sqlite.prepare("INSERT INTO card_thumbnails (card_id, sha, src, small_src, updated_at, updated_by) VALUES (?, 'x', ?, ?, 'now', 'test')");
  const good = { src: `https://photos.atishaykasliwal.com/cards/${"a".repeat(24)}-1080.webp`, small: `https://photos.atishaykasliwal.com/cards/${"a".repeat(24)}-640.webp` };
  insert.run("volunteer:ai-hot-100", good.src, good.small);
  insert.run("project:gone", good.src, good.small);
  insert.run("project:medscan", 'https://evil.example/x.webp" onerror="alert(1)', good.small);
  assert.deepEqual(await loadChosen(env), { "volunteer:ai-hot-100": good });
});

// HTMLRewriter exists only in the Workers runtime; this stand-in records what would be rewritten.
function recordingRewriter() {
  const calls = [];
  class Recorder {
    on(selector, handlers) {
      calls.push({ selector, handlers });
      return this;
    }
    transform(response) {
      return response;
    }
  }
  return { calls, Recorder };
}
const element = () => {
  const done = { attributes: {}, appended: [], inner: null };
  return {
    done,
    setAttribute: (name, value) => { done.attributes[name] = value; },
    append: (html, options) => done.appended.push([html, options]),
    setInnerContent: (html, options) => { done.inner = [html, options]; },
  };
};

test("the homepage swaps the image of an image card, replaces an HTML card, and inlines the choices", () => {
  const t = id => ({ src: `https://photos.atishaykasliwal.com/cards/${id.repeat(24)}-1080.webp`, small: `https://photos.atishaykasliwal.com/cards/${id.repeat(24)}-640.webp` });
  const { calls, Recorder } = recordingRewriter();
  rewriteHomepage(new Response("<html></html>"), { "project:atriveo-tracker": t("b"), "project:kaggriculture": t("c") }, Recorder);
  assert.deepEqual(calls.map(c => c.selector), ["head", '[data-card="project:atriveo-tracker"] .project-art > img', '[data-card="project:kaggriculture"] .project-art']);

  const head = element();
  calls[0].handlers.element(head);
  const [script, options] = head.done.appended[0];
  assert.equal(options.html, true);
  assert.match(script, /^<script type="application\/json" id="card-thumbnails">\{.*\}<\/script>$/);
  assert.ok(!script.slice(1, -9).includes("</"), "no closing tag can appear inside the JSON");

  const img = element();
  calls[1].handlers.element(img);
  assert.deepEqual(img.done.attributes, { src: t("b").src, srcset: `${t("b").small} 640w, ${t("b").src} 1080w` });

  const art = element();
  calls[2].handlers.element(art);
  assert.match(art.done.inner[0], /^<img loading="lazy" src="https:\/\/photos\.atishaykasliwal\.com\/cards\/c{24}-1080\.webp"/);
});

test("the homepage is the static page untouched when nothing is chosen or D1 fails", async () => {
  const page = new Response("<html>static</html>", { headers: { "Content-Type": "text/html", ETag: '"abc"' } });
  const context = request => ({ request, env, next: async () => page });
  const plain = await homepage(context(new Request(`${SITE}/`)));
  assert.equal(plain, page);
  const broken = await homepage({ request: new Request(`${SITE}/`), env: { ...env, DB: { prepare() { throw new Error("D1 down"); } } }, next: async () => page });
  assert.equal(broken, page);
});

test("with a thumbnail chosen, the homepage fetches the full page and drops validators", async () => {
  await upload("/api/admin/thumbnails/project/medscan");
  forgetChosen();
  const { Recorder } = recordingRewriter();
  globalThis.HTMLRewriter = Recorder;
  try {
    let seen;
    const response = await homepage({
      request: new Request(`${SITE}/`, { headers: { "If-None-Match": '"abc"' } }),
      env,
      next: async request => {
        seen = request;
        return new Response("<html></html>", { headers: { "Content-Type": "text/html; charset=utf-8", ETag: '"abc"' } });
      },
    });
    assert.equal(seen.headers.get("If-None-Match"), null, "a cached copy can't be revalidated past a thumbnail change");
    assert.equal(response.headers.get("ETag"), null);
    assert.equal(response.headers.get("Cache-Control"), "public, max-age=0, must-revalidate");
    assert.equal(response.headers.get("X-Frame-Options"), "DENY");
  } finally {
    delete globalThis.HTMLRewriter;
  }
});

test("the browser's card data takes the inlined choices, and ignores anything off the photos domain", async () => {
  const good = { src: `https://photos.atishaykasliwal.com/cards/${"d".repeat(24)}-1080.webp`, small: `https://photos.atishaykasliwal.com/cards/${"d".repeat(24)}-640.webp` };
  globalThis.document = {
    getElementById: id => (id === "card-thumbnails" ? { textContent: JSON.stringify({ "project:fedtalk": good, "open-source:aura": good, "project:medscan": { src: "https://evil.example/a.webp", small: "x" } }) } : null),
  };
  try {
    const { withThumbnails } = await import(`../../src/card-thumbnails.js?fresh=${Date.now()}`);
    const [fedtalk, medscan] = withThumbnails("project", [{ name: "FedTalk", card: "<img src=\"/old.webp\">", art: "ART" }, { name: "Medscan", card: "OLD" }]);
    assert.equal(fedtalk.id, "project:fedtalk");
    assert.match(fedtalk.card, /dddd.*-1080\.webp/);
    assert.equal(fedtalk.art, "ART", "a project's preview window keeps its real screenshot");
    assert.equal(medscan.card, "OLD");
    const [aura] = withThumbnails("open-source", [{ slug: "aura", name: "Aura", card: "OLD", art: "OLD" }], { art: true });
    assert.match(aura.art, /dddd/, "open source previews show the same picture as the card");
  } finally {
    delete globalThis.document;
  }
});
