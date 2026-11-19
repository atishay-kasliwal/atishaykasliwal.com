import { activeResume } from "../../src/resume-core/store.js";
import { withActiveResume } from "../../src/resume-core/overlay.js";
import { etagMatches, SITE_HEADERS } from "../_lib/public-headers.js";

// /api/profile.json is still generated at build time from the canonical profile
// (scripts/build-profile-page.mjs). This Function serves that file and, once a résumé has been
// published from /admin/resume, replaces only profile.resume (and the matching evidence date) with
// the published version, so the API names the exact PDF the public URL serves without a rebuild.
// If D1 cannot be read the built file is served unchanged.
const HEADERS = {
  ...SITE_HEADERS,
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
  "Access-Control-Allow-Origin": "*",
};

async function etagOf(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return `"${[...new Uint8Array(digest)].slice(0, 16).map(byte => byte.toString(16).padStart(2, "0")).join("")}"`;
}

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, HEAD", "Access-Control-Max-Age": "86400" } });
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD, OPTIONS" } });
  }
  const asset = await env.ASSETS.fetch(new Request(new URL("/api/profile.json", request.url)));
  if (!asset.ok) return asset;
  let text = await asset.text();
  let version = "bundled";
  try {
    const active = env.DB ? await activeResume(env.DB) : null;
    if (active) {
      text = JSON.stringify(withActiveResume(JSON.parse(text), active));
      version = active.sha256.slice(0, 16);
    }
  } catch (error) {
    console.error("profile.json: résumé overlay skipped", error);
  }
  const etag = await etagOf(text);
  const headers = { ...HEADERS, ETag: etag, "X-Resume-Version": version };
  if (etagMatches(request, etag)) return new Response(null, { status: 304, headers });
  return new Response(request.method === "HEAD" ? null : text, { headers });
}
