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

// Every check fails closed: any malformed part, unexpected algorithm, unknown key, bad signature,
// wrong audience or issuer, expired or not-yet-valid token, or email outside the allowlist is a
// refusal, never an exception. `issuer` is required by functions/_lib/access.js.
const CLOCK_SKEW_MS = 60 * 1000;

export async function verifyAccessJwt(token, { audience, issuer = null, allowedEmails, keys, now = Date.now() }) {
  const parts = String(token ?? "").split(".");
  if (parts.length !== 3 || !parts[0] || !parts[1] || parts.some(part => !/^[A-Za-z0-9_-]*$/.test(part))) return { ok: false, reason: "malformed" };
  const [headerPart, payloadPart, signaturePart] = parts;
  let header;
  let payload;
  try {
    header = decodeJson(headerPart);
    payload = decodeJson(payloadPart);
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (!header || typeof header !== "object" || !payload || typeof payload !== "object") return { ok: false, reason: "malformed" };
  if (header.alg !== "RS256") return { ok: false, reason: "algorithm" };
  const jwk = typeof header.kid === "string" ? keys.find(key => key.kid === header.kid) ?? null : null;
  if (!jwk) return { ok: false, reason: "unknown-key" };
  let valid = false;
  try {
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, base64UrlDecode(signaturePart), encoder.encode(`${headerPart}.${payloadPart}`));
  } catch {
    return { ok: false, reason: "signature" };
  }
  if (!valid) return { ok: false, reason: "signature" };
  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audience || !audiences.includes(audience)) return { ok: false, reason: "audience" };
  if (issuer !== null && payload.iss !== issuer) return { ok: false, reason: "issuer" };
  if (typeof payload.exp !== "number" || payload.exp * 1000 <= now) return { ok: false, reason: "expired" };
  if (payload.nbf !== undefined && (typeof payload.nbf !== "number" || payload.nbf * 1000 > now + CLOCK_SKEW_MS)) return { ok: false, reason: "not-yet-valid" };
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const allowed = (allowedEmails ?? []).map(item => String(item).trim().toLowerCase()).filter(Boolean);
  if (!email || !allowed.includes(email)) return { ok: false, reason: "not-allowed" };
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
