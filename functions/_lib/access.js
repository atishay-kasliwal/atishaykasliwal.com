import { verifyAccessJwt, constantTimeEqual } from "../../src/photography-core/auth.js";

let cachedKeys = null;
let cachedAt = 0;
let lastRefresh = 0;
const KEY_TTL_MS = 60 * 60 * 1000;
// A token signed with a key we have not seen (Access rotated its keys) triggers one refetch, at
// most once a minute, so forged kids cannot make every request call the certs endpoint.
const REFRESH_MIN_INTERVAL_MS = 60 * 1000;

async function fetchKeys(env) {
  const response = await fetch(`https://${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`);
  if (!response.ok) throw new Error("Access keys unavailable");
  const body = await response.json();
  cachedKeys = Array.isArray(body.keys) ? body.keys : [];
  cachedAt = Date.now();
  lastRefresh = cachedAt;
  return cachedKeys;
}

async function accessKeys(env) {
  if (cachedKeys && Date.now() - cachedAt < KEY_TTL_MS) return cachedKeys;
  return fetchKeys(env);
}

// The admin is protected twice: Cloudflare Access sits in front of the path, and the Function
// verifies the signed Access JWT itself (signature against the team's published keys, RS256 only,
// audience, issuer, expiry, not-before, email allowlist), so a bypassed or misconfigured proxy
// still cannot reach admin code. The token is read only from the header Access sets; a client can
// send that header too, but cannot sign it. Missing configuration fails closed.
//
// `allowService` lets one route also accept the analytics dashboard's Access service token
// (ADMIN_SERVICE_TOKEN_ID is its Client ID; unset means no service token is accepted). Only the
// admin APIs the dashboard proxies opt in, never a page. For those calls the actor recorded in
// audit logs is the dashboard's X-Admin-Actor header, and only when it names an allowed email.
export const SERVICE_ACTOR = "service:analytics-dashboard";
export async function requireAdmin(request, env, { allowService = false } = {}) {
  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token) return { ok: false, status: 401 };
  const allowedEmails = String(env.ADMIN_EMAILS ?? "").split(",").map(item => item.trim()).filter(Boolean);
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD || allowedEmails.length === 0) return { ok: false, status: 503 };
  const serviceTokenId = allowService ? String(env.ADMIN_SERVICE_TOKEN_ID ?? "").trim() : "";
  const options = { audience: env.ACCESS_AUD, issuer: `https://${env.ACCESS_TEAM_DOMAIN}`, allowedEmails, serviceTokenId };
  try {
    let result = await verifyAccessJwt(token, { ...options, keys: await accessKeys(env) });
    if (result.reason === "unknown-key" && Date.now() - lastRefresh > REFRESH_MIN_INTERVAL_MS) {
      result = await verifyAccessJwt(token, { ...options, keys: await fetchKeys(env) });
    }
    if (!result.ok) return { ok: false, status: 403 };
    if (!result.service) return { ok: true, email: result.email };
    const actor = String(request.headers.get("X-Admin-Actor") ?? "").trim().toLowerCase();
    const named = allowedEmails.map(item => item.toLowerCase()).includes(actor);
    return { ok: true, email: named ? actor : SERVICE_ACTOR, service: true };
  } catch {
    return { ok: false, status: 503 };
  }
}

export function requireIngestSecret(request, env) {
  const header = request.headers.get("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!env.INGEST_SECRET || !constantTimeEqual(token, env.INGEST_SECRET)) return { ok: false, status: 401 };
  return { ok: true };
}
