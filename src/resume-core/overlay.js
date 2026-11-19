// /api/profile.json is generated at build time from the canonical profile and describes the PDF
// bundled with that deploy. When a newer résumé has been published from the admin, the profile
// Function swaps in that version's metadata here. Only the résumé reference changes; no
// professional fact is ever taken from the PDF.
import { RESUME_URL, versionIdOf } from "./constants.js";

export function withActiveResume(profile, active) {
  if (!active) return profile;
  const out = structuredClone(profile);
  const date = active.published_at.slice(0, 10);
  out.profile.resume = {
    ...out.profile.resume,
    url: RESUME_URL,
    format: "application/pdf",
    lastModified: date,
    version: { id: versionIdOf(active.sha256), sha256: active.sha256, publishedAt: active.published_at, source: "published" },
  };
  const evidence = out.evidence?.find(item => item.id === "document:resume");
  if (evidence) evidence.date = date;
  if (!out.lastUpdated || date > out.lastUpdated) out.lastUpdated = date;
  return out;
}
