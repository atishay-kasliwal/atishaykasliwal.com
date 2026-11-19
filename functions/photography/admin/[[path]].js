import pages from "../../_generated/admin-pages.js";
import seo from "../../_generated/photography-seo.js";
import { requireAdmin } from "../../_lib/access.js";
import { PRIVATE_HEADERS } from "../../_lib/admin.js";

const headers = {
  ...PRIVATE_HEADERS,
  "Content-Type": "text/html; charset=utf-8",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'wasm-unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https: blob: data:",
    "font-src 'self'",
    "connect-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join("; "),
};

// No static copy exists, so encoded spellings cannot bypass the verified page route.
export async function onRequestGet({ request, env }) {
  const admin = await requireAdmin(request, env);
  if (!admin.ok) return new Response("Sign in through Cloudflare Access to open the admin.", { status: admin.status, headers });
  const pathname = new URL(request.url).pathname;
  if (pathname === "/photography/admin/seo/report.json") return Response.json(seo.report, { headers: PRIVATE_HEADERS });
  if (/^\/photography\/admin\/seo(?:\/|\/index\.html)?$/.test(pathname)) {
    if (pathname !== "/photography/admin/seo/") return new Response(null, { status: 308, headers: { ...headers, Location: "/photography/admin/seo/" } });
    const policy = headers["Content-Security-Policy"].replace("script-src 'self' 'wasm-unsafe-eval'", `script-src 'self' ${seo.scriptHashes.map(hash => `'${hash}'`).join(" ")}`);
    return new Response(seo.html, { headers: { ...headers, "Content-Security-Policy": policy } });
  }
  const match = /^\/photography\/admin(\/|\/index\.html)?$/.exec(pathname);
  if (!match || !pages.photography) return new Response("Not found", { status: 404, headers });
  if (match[1] !== "/") return new Response(null, { status: 308, headers: { ...headers, Location: "/photography/admin/" } });
  return new Response(pages.photography, { headers });
}
