import { requireAdmin } from "./access.js";
import { FeedbackRequestError } from "../../src/github-feedback-core/store.js";

const NO_STORE = { "Cache-Control": "no-store" };

export const json = (body, status = 200) => Response.json(body, { status, headers: NO_STORE });

// Wraps a GitHub feedback admin handler: Cloudflare Access sign-in is required (see access.js),
// and request validation errors become JSON 4xx responses. The analytics dashboard's service token
// is accepted here too: every feedback admin route is one it proxies.
export function adminRoute(handler) {
  return async context => {
    const admin = await requireAdmin(context.request, context.env, { allowService: true });
    if (!admin.ok) return json({ error: "forbidden" }, admin.status);
    try {
      return await handler(context, admin);
    } catch (error) {
      if (error instanceof FeedbackRequestError) return json({ error: error.message }, error.status);
      throw error;
    }
  };
}
