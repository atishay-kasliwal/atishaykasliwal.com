import { adminRoute, PRIVATE_HEADERS } from "../../../../../_lib/admin.js";
import { getVersion, ResumeRequestError } from "../../../../../../src/resume-core/store.js";

// GET: the stored PDF of any version, published or not, for the admin preview. Framable only by
// this site's own pages; ?download=1 saves it instead.
export const onRequestGet = adminRoute(async ({ request, env, params }) => {
  const { row } = await getVersion(env.DB, params.id);
  const object = await env.RESUMES?.get(row.r2_key);
  if (!object) throw new ResumeRequestError("the stored file is missing", 404);
  const download = new URL(request.url).searchParams.get("download") === "1";
  return new Response(object.body, {
    headers: {
      ...PRIVATE_HEADERS,
      "Content-Type": "application/pdf",
      "Content-Length": String(row.size_bytes),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="resume-${row.id}.pdf"`,
      "X-Frame-Options": "SAMEORIGIN",
      "Content-Security-Policy": "frame-ancestors 'self'",
    },
  });
});
