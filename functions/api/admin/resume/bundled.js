import { adminRoute, PRIVATE_HEADERS } from "../../../_lib/admin.js";
import { RESUME_PATH } from "../../../../src/resume-core/constants.js";

// GET: the PDF bundled with this deploy, straight from the asset store. The public URL cannot be
// used to preview it once a version is published, because the Function serves that instead.
export const onRequestGet = adminRoute(async ({ request, env }) => {
  const asset = await env.ASSETS.fetch(new Request(new URL(RESUME_PATH, request.url)));
  if (!asset.ok) return new Response("Not found", { status: 404, headers: PRIVATE_HEADERS });
  return new Response(asset.body, { headers: { ...PRIVATE_HEADERS, "Content-Type": "application/pdf", "Content-Disposition": 'inline; filename="bundled-resume.pdf"' } });
});
