import { activeResume } from "../src/resume-core/store.js";
import { versionIdOf } from "../src/resume-core/constants.js";
import { etagMatches, SITE_HEADERS } from "./_lib/public-headers.js";

// The public résumé URL. It never changes: once a version is published from /admin/resume, this
// serves that PDF from the private R2 bucket; until then, or if D1 or R2 cannot be read, it serves
// the PDF bundled with the deploy, so the link never breaks.
//
// Caching: Function responses are not cached at Cloudflare's edge, and browsers must revalidate
// (max-age=0) against the content-hash ETag, so a new version reaches every visitor on their next
// request while an unchanged one costs a 304.
export async function onRequest({ request, env }) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  }
  let active = null;
  try {
    if (env.DB && env.RESUMES) active = await activeResume(env.DB);
  } catch (error) {
    console.error("résumé: active version unavailable, serving the bundled PDF", error);
  }
  if (!active) return env.ASSETS.fetch(request);

  const etag = `"${active.sha256}"`;
  const headers = {
    ...SITE_HEADERS,
    "Content-Type": "application/pdf",
    "Content-Disposition": 'inline; filename="Atishay-Kasliwal-Resume.pdf"',
    "Cache-Control": "public, max-age=0, must-revalidate",
    ETag: etag,
    "Last-Modified": new Date(active.published_at).toUTCString(),
    "Accept-Ranges": "bytes",
    "X-Resume-Version": versionIdOf(active.sha256),
  };
  if (etagMatches(request, etag)) return new Response(null, { status: 304, headers });
  if (request.method === "HEAD") return new Response(null, { headers: { ...headers, "Content-Length": String(active.size_bytes) } });

  let object;
  try {
    object = await env.RESUMES.get(active.r2_key, request.headers.has("Range") ? { range: request.headers } : undefined);
  } catch (error) {
    console.error("résumé: R2 read failed, serving the bundled PDF", error);
  }
  if (!object) return env.ASSETS.fetch(request);
  if (object.range && request.headers.has("Range")) {
    const offset = object.range.offset ?? 0;
    const length = object.range.length ?? active.size_bytes - offset;
    return new Response(object.body, {
      status: 206,
      headers: { ...headers, "Content-Length": String(length), "Content-Range": `bytes ${offset}-${offset + length - 1}/${active.size_bytes}` },
    });
  }
  return new Response(object.body, { headers: { ...headers, "Content-Length": String(active.size_bytes) } });
}
