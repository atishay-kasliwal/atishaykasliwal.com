import { adminRoute, json } from "../../../_lib/admin.js";
import { bundledResume, canonicalProfile } from "../../../_lib/resume.js";
import { activeResume } from "../../../../src/resume-core/store.js";
import { versionIdOf } from "../../../../src/resume-core/constants.js";
import { reviewItems } from "../../../../src/profile/review.js";

// GET: what the live responses are checked against. The canonical profile is the build output of
// this deploy, read from the asset store (never the live, overlaid response); the schema comes the
// same way; the review register is internal and only ever leaves through this admin route.
export const onRequestGet = adminRoute(async ({ request, env }) => {
  const schemaResponse = await env.ASSETS.fetch(new Request(new URL("/api/profile.schema.json", request.url)));
  const [canonical, schema, active, bundled] = await Promise.all([
    canonicalProfile(env, request),
    schemaResponse.ok ? schemaResponse.json() : null,
    activeResume(env.DB).catch(() => null),
    bundledResume(env, request),
  ]);
  return json({
    checkedAt: new Date().toISOString(),
    canonical,
    schema,
    reviewItems: reviewItems.map(({ id, field, status, canonical: value, mustNotAppear = [] }) => ({ id, field, status, canonical: value, mustNotAppear })),
    resume: {
      expected: active
        ? { id: versionIdOf(active.sha256), sha256: active.sha256, publishedAt: active.published_at, publishedBy: active.published_by, source: "published" }
        : bundled && { ...bundled, publishedAt: null, source: "bundled" },
      bundled,
    },
  });
});
