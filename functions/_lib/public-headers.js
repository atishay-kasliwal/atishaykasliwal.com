// public/_headers does not apply to responses a Function builds itself, so the public Functions
// that replace a static file repeat the site-wide headers from its /* block.
export const SITE_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Strict-Transport-Security": "max-age=31536000",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export const etagMatches = (request, etag) =>
  (request.headers.get("If-None-Match") ?? "")
    .split(",")
    .map(tag => tag.trim().replace(/^W\//, ""))
    .some(tag => tag === etag || tag === "*");
