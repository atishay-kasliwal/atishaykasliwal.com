import { requireAdmin } from "../../_lib/access.js";
import { json, PRIVATE_HEADERS } from "../../_lib/admin.js";

// Backstop for every route under /api/admin/: each handler also checks through adminRoute, but a
// route added later without it still cannot answer an unauthenticated request.
export async function onRequest(context) {
  const admin = await requireAdmin(context.request, context.env);
  if (!admin.ok) return json({ error: admin.status === 401 ? "sign in through Cloudflare Access" : "forbidden" }, admin.status);
  const response = await context.next();
  const out = new Response(response.body, response);
  for (const [name, value] of Object.entries(PRIVATE_HEADERS)) out.headers.set(name, value);
  return out;
}
