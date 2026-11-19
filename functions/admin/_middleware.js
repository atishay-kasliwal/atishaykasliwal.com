import { requireAdmin } from "../_lib/access.js";
import { PRIVATE_HEADERS } from "../_lib/admin.js";

// Admin HTML lives in the Functions bundle and is served only after JWT verification.
// This also keeps pages private if the Access application in front is misconfigured.
const PAGE_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join("; ");

export async function onRequest(context) {
  const admin = await requireAdmin(context.request, context.env);
  if (!admin.ok) {
    const message = admin.status === 401 ? "Sign in through Cloudflare Access to open the admin." : "This account is not an administrator.";
    return new Response(message, { status: admin.status, headers: { ...PRIVATE_HEADERS, "Content-Type": "text/plain; charset=utf-8" } });
  }
  const url = new URL(context.request.url);
  if (url.pathname === "/admin" || url.pathname === "/admin/") {
    return new Response(null, { status: 302, headers: { ...PRIVATE_HEADERS, Location: "/admin/resume/" } });
  }
  const response = await context.next();
  const out = new Response(response.body, response);
  for (const [name, value] of Object.entries(PRIVATE_HEADERS)) out.headers.set(name, value);
  out.headers.set("Content-Security-Policy", PAGE_POLICY);
  out.headers.set("X-Frame-Options", "DENY");
  return out;
}
