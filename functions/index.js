// The homepage, with any card thumbnails chosen in Admin swapped in (functions/_lib/card-thumbnails.js,
// docs/card-thumbnails.md). With none chosen, or if D1 can't be read, it is the static page untouched.
import { loadChosen, rewriteHomepage } from "./_lib/card-thumbnails.js";
import { SITE_HEADERS } from "./_lib/public-headers.js";

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== "GET" && request.method !== "HEAD") return context.next();
  let chosen = {};
  try {
    chosen = await loadChosen(env);
  } catch (error) {
    console.error("Card thumbnails unavailable; serving the built homepage.", error);
  }
  if (!Object.keys(chosen).length) return context.next();

  // Fetch the full page even for a conditional request: a browser's cached copy may predate the
  // current thumbnails, and the asset's ETag alone can't tell.
  const headers = new Headers(request.headers);
  headers.delete("If-None-Match");
  headers.delete("If-Modified-Since");
  const page = await context.next(new Request(request, { headers }));
  if (page.status !== 200 || !(page.headers.get("Content-Type") ?? "").includes("text/html")) return page;

  const rewritten = rewriteHomepage(page, chosen);
  const response = new Response(rewritten.body, rewritten);
  for (const [name, value] of Object.entries(SITE_HEADERS)) response.headers.set(name, value);
  response.headers.delete("ETag");
  response.headers.delete("Last-Modified");
  response.headers.delete("Content-Length");
  response.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  return response;
}
