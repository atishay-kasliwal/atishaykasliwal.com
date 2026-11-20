import seo from "../../_generated/photography-seo.js";
import { requireAdmin } from "../../_lib/access.js";
import { PRIVATE_HEADERS } from "../../_lib/admin.js";

// The photography admin and its SEO page moved to Admin (admin.atishaykasliwal.com). What is left
// here is the SEO report JSON that Admin's SEO page reads with its service token. Every other
// path, including the old pages, is a 404 after the sign-in check, so nothing is served unsigned.
const NOT_FOUND = { ...PRIVATE_HEADERS, "Content-Type": "text/plain; charset=utf-8" };

export async function onRequestGet({ request, env }) {
  const pathname = new URL(request.url).pathname;
  const report = pathname === "/photography/admin/seo/report.json";
  const admin = await requireAdmin(request, env, { allowService: report });
  if (!admin.ok) return new Response("Sign in through Cloudflare Access.", { status: admin.status, headers: NOT_FOUND });
  if (report) return Response.json(seo.report, { headers: PRIVATE_HEADERS });
  return new Response("This page moved to admin.atishaykasliwal.com.", { status: 404, headers: NOT_FOUND });
}
