// Verifies Cloudflare Access JWTs (RS256) against the team's signing keys, plus the audience
// and the admin email allowlist. Keys are injected so tests can supply their own.
const encoder = new TextEncoder();

export function base64UrlDecode(text) {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(text.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), char => char.charCodeAt(0));
}

export function decodeJson(part) {
  return JSON.parse(new TextDecoder().decode(base64UrlDecode(part)));
}

export async function verifyAccessJwt(token, { audience, allowedEmails, keys, now = Date.now() }) {
  const parts = String(token ?? "").split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed" };
  const [headerPart, payloadPart, signaturePart] = parts;
  let header;
  let payload;
  try {
    header = decodeJson(headerPart);
    payload = decodeJson(payloadPart);
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (header.alg !== "RS256") return { ok: false, reason: "algorithm" };
  const jwk = keys.find(key => key.kid === header.kid) ?? null;
  if (!jwk) return { ok: false, reason: "unknown-key" };
  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    base64UrlDecode(signaturePart),
    encoder.encode(`${headerPart}.${payloadPart}`),
  );
  if (!valid) return { ok: false, reason: "signature" };
  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audience || !audiences.includes(audience)) return { ok: false, reason: "audience" };
  if (typeof payload.exp !== "number" || payload.exp * 1000 <= now) return { ok: false, reason: "expired" };
  const email = String(payload.email ?? "").toLowerCase();
  if (!email || !allowedEmails.map(item => item.toLowerCase()).includes(email)) {
    return { ok: false, reason: "not-allowed" };
  }
  return { ok: true, email };
}

// Compares two secrets without leaking the position of the first difference.
export function constantTimeEqual(a, b) {
  const left = encoder.encode(String(a ?? ""));
  const right = encoder.encode(String(b ?? ""));
  let difference = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i += 1) {
    difference |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return difference === 0;
}
