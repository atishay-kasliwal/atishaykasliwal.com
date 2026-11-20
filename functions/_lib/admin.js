import { requireAdmin } from "./access.js";
import { ResumeRequestError } from "../../src/resume-core/store.js";

export const PRIVATE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "same-origin",
};

export const json = (body, status = 200, headers = {}) => Response.json(body, { status, headers: { ...PRIVATE_HEADERS, ...headers } });

const SAFE_METHODS = new Set(["GET", "HEAD"]);

// Wraps an admin API handler (/api/admin/*). Every call needs a verified Cloudflare Access JWT
// from an email in ADMIN_EMAILS (see access.js). Calls that change state must also come from this
// site's own pages: browsers always send Origin on POST, so a cross-site form or script cannot
// publish even if the Access cookie were sent along.
export function adminRoute(handler, { allowService = false } = {}) {
  return async context => {
    const admin = await requireAdmin(context.request, context.env, { allowService });
    if (!admin.ok) return json({ error: admin.status === 401 ? "sign in through Cloudflare Access" : "forbidden" }, admin.status);
    if (!SAFE_METHODS.has(context.request.method)) {
      const origin = context.request.headers.get("Origin");
      if (origin !== new URL(context.request.url).origin) return json({ error: "cross-origin request refused" }, 403);
    }
    try {
      return await handler(context, admin);
    } catch (error) {
      if (error instanceof ResumeRequestError) return json({ error: error.message, ...error.extra }, error.status);
      console.error(error);
      return json({ error: "internal error" }, 500);
    }
  };
}

// The résumé API, which the analytics dashboard also calls with its service token (access.js).
export const serviceAdminRoute = handler => adminRoute(handler, { allowService: true });
