import { verifyAccessJwt, constantTimeEqual } from "../../src/photography-core/auth.js";

let cachedKeys = null;
let cachedAt = 0;
const KEY_TTL_MS = 60 * 60 * 1000;

async function accessKeys(env) {
  if (cachedKeys && Date.now() - cachedAt < KEY_TTL_MS) return cachedKeys;
  const response = await fetch(`https://${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`);
  if (!response.ok) throw new Error("Access keys unavailable");
  const body = await response.json();
  cachedKeys = body.keys ?? [];
  cachedAt = Date.now();
  return cachedKeys;
}

// The admin is protected twice: Cloudflare Access sits in front of the path, and the Function
// verifies the signed Access JWT itself so a bypassed proxy still cannot reach upload code.
export async function requireAdmin(request, env) {
  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token) return { ok: false, status: 401 };
  const allowedEmails = String(env.ADMIN_EMAILS ?? "").split(",").map(item => item.trim()).filter(Boolean);
  let keys;
  try {
    keys = await accessKeys(env);
  } catch {
    return { ok: false, status: 503 };
  }
  const result = await verifyAccessJwt(token, { audience: env.ACCESS_AUD, allowedEmails, keys });
  return result.ok ? { ok: true, email: result.email } : { ok: false, status: 403 };
}

export function requireIngestSecret(request, env) {
  const header = request.headers.get("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!env.INGEST_SECRET || !constantTimeEqual(token, env.INGEST_SECRET)) return { ok: false, status: 401 };
  return { ok: true };
}
