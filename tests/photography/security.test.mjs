import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyAccessJwt, constantTimeEqual } from "../../src/photography-core/auth.js";
import { sniffImageType, readDimensions, validateUpload, MAX_ORIGINAL_BYTES } from "../../src/photography-core/upload.js";

const encoder = new TextEncoder();
const b64 = bytes => Buffer.from(bytes).toString("base64url");
const b64json = value => b64(encoder.encode(JSON.stringify(value)));

async function signingKey() {
  const pair = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  );
  const jwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  return { privateKey: pair.privateKey, keys: [{ ...jwk, kid: "test-kid" }] };
}

async function token(privateKey, claims, header = { alg: "RS256", kid: "test-kid" }) {
  const signingInput = `${b64json(header)}.${b64json(claims)}`;
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, encoder.encode(signingInput));
  return `${signingInput}.${b64(new Uint8Array(signature))}`;
}

const AUD = "test-audience";
const future = () => Math.floor(Date.now() / 1000) + 600;

test("admin: a valid Access token for an allowed email is accepted", async () => {
  const { privateKey, keys } = await signingKey();
  const jwt = await token(privateKey, { aud: [AUD], email: "owner@example.com", exp: future() });
  const result = await verifyAccessJwt(jwt, { audience: AUD, allowedEmails: ["owner@example.com"], keys });
  assert.deepEqual(result, { ok: true, email: "owner@example.com" });
});

test("admin: an email outside the allowlist is rejected", async () => {
  const { privateKey, keys } = await signingKey();
  const jwt = await token(privateKey, { aud: [AUD], email: "stranger@example.com", exp: future() });
  assert.equal((await verifyAccessJwt(jwt, { audience: AUD, allowedEmails: ["owner@example.com"], keys })).reason, "not-allowed");
});

test("admin: a token for a different audience is rejected", async () => {
  const { privateKey, keys } = await signingKey();
  const jwt = await token(privateKey, { aud: ["other"], email: "owner@example.com", exp: future() });
  assert.equal((await verifyAccessJwt(jwt, { audience: AUD, allowedEmails: ["owner@example.com"], keys })).reason, "audience");
});

test("admin: expired tokens are rejected", async () => {
  const { privateKey, keys } = await signingKey();
  const jwt = await token(privateKey, { aud: [AUD], email: "owner@example.com", exp: 1000 });
  assert.equal((await verifyAccessJwt(jwt, { audience: AUD, allowedEmails: ["owner@example.com"], keys })).reason, "expired");
});

test("admin: a tampered payload fails the signature check", async () => {
  const { privateKey, keys } = await signingKey();
  const jwt = await token(privateKey, { aud: [AUD], email: "owner@example.com", exp: future() });
  const [header, , signature] = jwt.split(".");
  const forged = `${header}.${b64json({ aud: [AUD], email: "owner@example.com", exp: future() })}.${signature}`;
  const other = await token(privateKey, { aud: [AUD], email: "stranger@example.com", exp: future() });
  const tampered = `${header}.${other.split(".")[1]}.${signature}`;
  assert.equal((await verifyAccessJwt(tampered, { audience: AUD, allowedEmails: ["owner@example.com"], keys })).reason, "signature");
  assert.ok(forged.length > 0);
});

test("admin: unsigned or algorithm-swapped tokens are rejected", async () => {
  const { keys } = await signingKey();
  const none = `${b64json({ alg: "none" })}.${b64json({ aud: [AUD], email: "owner@example.com", exp: future() })}.`;
  assert.equal((await verifyAccessJwt(none, { audience: AUD, allowedEmails: ["owner@example.com"], keys })).reason, "algorithm");
  assert.equal((await verifyAccessJwt("not-a-jwt", { audience: AUD, allowedEmails: [], keys })).reason, "malformed");
});

test("ingest secret comparison is constant-time-safe and exact", () => {
  assert.equal(constantTimeEqual("abc123", "abc123"), true);
  assert.equal(constantTimeEqual("abc123", "abc124"), false);
  assert.equal(constantTimeEqual("abc", "abcd"), false);
  assert.equal(constantTimeEqual("", "x"), false);
});

// Minimal valid headers: PNG IHDR with dimensions, JPEG SOF0, WebP VP8X.
const pngHeader = (width, height) => {
  const bytes = new Uint8Array(32);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
};
const jpegHeader = (width, height) => {
  const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0, 0, 0, 0, 0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const view = new DataView(bytes.buffer);
  view.setUint16(7, height);
  view.setUint16(9, width);
  return bytes;
};
const webpHeader = (width, height) => {
  const bytes = new Uint8Array(32);
  bytes.set(encoder.encode("RIFF"), 0);
  bytes.set(encoder.encode("WEBP"), 8);
  bytes.set(encoder.encode("VP8X"), 12);
  const w = width - 1;
  const h = height - 1;
  bytes.set([w & 0xff, (w >> 8) & 0xff, (w >> 16) & 0xff, h & 0xff, (h >> 8) & 0xff, (h >> 16) & 0xff], 24);
  return bytes;
};

test("upload type is decided by file bytes, not the declared MIME type", () => {
  assert.equal(sniffImageType(pngHeader(10, 10)), "png");
  assert.equal(sniffImageType(jpegHeader(10, 10)), "jpeg");
  assert.equal(sniffImageType(webpHeader(10, 10)), "webp");
  assert.equal(sniffImageType(encoder.encode("<html>not an image</html>")), null);
});

test("dimensions are read from headers for PNG, JPEG and WebP", () => {
  assert.deepEqual(readDimensions(pngHeader(640, 480), "png"), { width: 640, height: 480 });
  assert.deepEqual(readDimensions(jpegHeader(800, 600), "jpeg"), { width: 800, height: 600 });
  assert.deepEqual(readDimensions(webpHeader(1024, 768), "webp"), { width: 1024, height: 768 });
});

test("upload validation rejects non-images, oversize files and overlong alt text", () => {
  const good = { original: pngHeader(640, 480), display: jpegHeader(640, 480), metadata: { colors: [], alt: "A test" } };
  assert.equal(validateUpload(good).ok, true);
  assert.equal(validateUpload({ ...good, original: encoder.encode("<script>x</script>") }).ok, false);
  assert.equal(validateUpload({ ...good, display: pngHeader(640, 480) }).ok, false);
  assert.equal(validateUpload({ ...good, metadata: { colors: [], alt: "x".repeat(301) } }).ok, false);
  assert.equal(validateUpload({ ...good, metadata: { colors: [], alt: "" } }).ok, true);
  const big = new Uint8Array(MAX_ORIGINAL_BYTES + 1);
  big.set(pngHeader(640, 480).subarray(0, 24));
  assert.equal(validateUpload({ ...good, original: big }).ok, false);
});
