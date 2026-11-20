// Smaller WebP copies of uploaded photos: validation, the admin endpoint, and the gallery markup.
import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { validateVariants, parseVariants, variantWidthsFor } from "../../src/photography-core/variants.js";
import { publicView } from "../../src/photography-core/library.js";
import { photoMarkup } from "../../src/photography.js";
import { rowToPhoto } from "../../functions/_lib/store.js";
import { onRequestPost as variantsRoute } from "../../functions/api/photography/admin/photos/[id]/variants.js";
import { accessFixture, memoryR2 } from "../resume/helpers.mjs";

const webp = (width, height) => sharp({ create: { width, height, channels: 3, background: "#356" } }).webp().toBuffer().then(b => new Uint8Array(b));
const jpeg = (width, height) => sharp({ create: { width, height, channels: 3, background: "#356" } }).jpeg().toBuffer().then(b => new Uint8Array(b));
const display = { width: 2400, height: 1600 };
const copies = async (overrides = {}) => new Map(await Promise.all(variantWidthsFor(display.width).map(async w => [w, overrides[w] ?? (await webp(w, Math.round((display.height * w) / display.width)))])));

test("copies must be WebP, at every expected width, with the display's aspect ratio", async () => {
  assert.deepEqual(variantWidthsFor(2400), [640, 1280, 1920]);
  assert.deepEqual(variantWidthsFor(1000), [640]);
  assert.ok(validateVariants(await copies(), display).ok);
  const missing = await copies(); missing.delete(1280);
  assert.match(validateVariants(missing, display).errors.join(" "), /1280px copy is missing/);
  assert.match(validateVariants(await copies({ 640: await jpeg(640, 427) }), display).errors.join(" "), /640px copy is not WebP/);
  assert.match(validateVariants(await copies({ 640: await webp(640, 640) }), display).errors.join(" "), /should be 640x427/);
  const extra = await copies(); extra.set(320, await webp(320, 213));
  assert.match(validateVariants(extra, display).errors.join(" "), /Unexpected 320px/);
  assert.deepEqual(parseVariants('[{"src":"javascript:x","width":640},{"src":"https://p/a.webp","width":640},{"src":"https://p/b.webp","width":999}]'), [{ src: "https://p/a.webp", width: 640 }]);
  assert.deepEqual(parseVariants("not json"), []);
});

test("the gallery uses an uploaded photo's copies, never its 2400px display JPEG", () => {
  const row = { id: "a".repeat(24), origin: "r2", status: "ready", hidden: 0, deleted_at: null, alt: "Lake", caption: null, src: "https://photos.example/display/a.jpg", original_key: "originals/a.jpg", width: 2400, height: 1600, orientation: "landscape", colors_json: "[]", uploaded_at: "2026-11-19", variants_json: JSON.stringify([1920, 640, 1280].map(width => ({ src: `https://photos.example/variants/a/t/${width}.webp`, width }))) };
  const view = publicView(rowToPhoto(row));
  assert.deepEqual(view.variants.map(v => v.width), [640, 1280, 1920]);
  const html = photoMarkup(view, { preview: true });
  assert.match(html, /^<img src="https:\/\/photos\.example\/variants\/a\/t\/1920\.webp"/);
  assert.match(html, /640\.webp 640w, .*1280\.webp 1280w, .*1920\.webp 1920w/);
  assert.match(html, /width="1920" height="1280"/);
  assert.doesNotMatch(html, /display\/a\.jpg/);
  // Before the migration, or before copies exist, the display JPEG is used as before.
  assert.match(photoMarkup(publicView(rowToPhoto({ ...row, variants_json: undefined }))), /display\/a\.jpg/);
});

test("the admin endpoint stores valid copies for the current photo only", async () => {
  const access = await accessFixture();
  const realFetch = globalThis.fetch;
  globalThis.fetch = async input => (String(input) === "https://team.example/cdn-cgi/access/certs" ? Response.json(access.certs) : realFetch(input));
  const id = "b".repeat(24);
  let row = { src: "https://photos.example/display/b.jpg", origin: "r2", width: 2400, height: 1600 };
  const updates = [];
  const DB = { prepare: sql => ({ bind: (...args) => ({ first: async () => row, run: async () => { updates.push({ sql, args }); return { meta: { changes: args[3] === row.src ? 1 : 0 } }; } }) }) };
  const env = { DB, PHOTOS: memoryR2(), PHOTO_PUBLIC_BASE: "https://photos.example", ACCESS_TEAM_DOMAIN: "team.example", ACCESS_AUD: "aud-1", ADMIN_EMAILS: "owner@example.com" };
  const send = async (form, email = "owner@example.com") => variantsRoute({ request: new Request(`https://x.test/api/photography/admin/photos/${id}/variants`, { method: "POST", body: form, headers: email ? { "Cf-Access-Jwt-Assertion": await access.token(email) } : {} }), env, params: { id } });
  const form = async (src = row.src) => { const f = new FormData(); f.append("src", src); for (const [w, bytes] of await copies()) f.append(`w${w}`, new File([bytes], `${w}.webp`, { type: "image/webp" })); return f; };
  try {
    assert.equal((await send(await form(), null)).status, 401, "signed out");
    assert.equal((await send(await form("https://photos.example/display/old.jpg"))).status, 409, "the photo was rotated meanwhile");
    const ok = await send(await form());
    assert.equal(ok.status, 201);
    const { variants } = await ok.json();
    assert.deepEqual(variants.map(v => v.width), [640, 1280, 1920]);
    assert.equal(env.PHOTOS.objects.size, 3);
    const stored = [...env.PHOTOS.objects.values()][0];
    assert.equal(stored.options.httpMetadata.cacheControl, "public, max-age=31536000, immutable");
    assert.match(updates.at(-1).sql, /variants_json = \?/);
    row = { ...row, origin: "external" };
    assert.equal((await send(await form())).status, 400, "external photos have no copies");
  } finally {
    globalThis.fetch = realFetch;
  }
});
