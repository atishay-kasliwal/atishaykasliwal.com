import { serviceAdminRoute, PRIVATE_HEADERS } from "../../../_lib/admin.js";
import { ResumeRequestError } from "../../../../src/resume-core/store.js";
import { reviewItems } from "../../../../src/profile/review.js";

// GET: what the browser checks an upload against: this deploy's canonical profile (the static
// file, never the live overlaid response) and the internal review register, which only ever
// leaves through admin routes. The profile is passed through as text, not parsed, to keep this
// Function's CPU time small.
export const onRequestGet = serviceAdminRoute(async ({ request, env }) => {
  const response = await env.ASSETS.fetch(new Request(new URL("/api/profile.json", request.url)));
  if (!response.ok) throw new ResumeRequestError("the canonical profile is unavailable", 503);
  const body = `{"reviewItems":${JSON.stringify(reviewItems)},"profile":${await response.text()}}`;
  return new Response(body, { headers: { ...PRIVATE_HEADERS, "Content-Type": "application/json; charset=utf-8" } });
});
