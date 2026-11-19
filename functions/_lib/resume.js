import { inspectPdf } from "../../src/resume-core/pdf.js";
import { compareWithProfile } from "../../src/resume-core/consistency.js";
import { ResumeRequestError } from "../../src/resume-core/store.js";
import { RESUME_PATH, sha256Hex, versionIdOf } from "../../src/resume-core/constants.js";
import { reviewItems } from "../../src/profile/review.js";

export const r2KeyFor = sha256 => `versions/${sha256}.pdf`;

export function cleanFilename(name) {
  const base = String(name ?? "").split(/[\\/]/).pop().normalize("NFKC");
  const safe = base.replace(/[^\w.\- ()]+/g, "_").replace(/\s+/g, " ").trim().slice(0, 120);
  return safe || "resume.pdf";
}

// The canonical profile as built for this deploy: the static /api/profile.json, read from the
// asset store directly so it never includes a runtime résumé overlay.
export async function canonicalProfile(env, request) {
  const response = await env.ASSETS.fetch(new Request(new URL("/api/profile.json", request.url)));
  if (!response.ok) throw new ResumeRequestError("the canonical profile is unavailable", 503);
  return response.json();
}

// The PDF bundled with the deploy, which the public URL serves whenever no published version can
// be. With `withReport`, it is also checked against the canonical profile so the dashboard can say
// whether the fallback is outdated.
export async function bundledResume(env, request, { withReport = false } = {}) {
  const response = await env.ASSETS.fetch(new Request(new URL(RESUME_PATH, request.url)));
  if (!response.ok) return null;
  const bytes = new Uint8Array(await response.arrayBuffer());
  const sha256 = await sha256Hex(bytes);
  const info = { id: versionIdOf(sha256), sha256, sizeBytes: bytes.length };
  if (!withReport) return info;
  const report = await buildReport(bytes, { filename: "Atishay-Kasliwal-Resume.pdf", contentType: "application/pdf", profile: await canonicalProfile(env, request), at: new Date().toISOString() });
  return { ...info, report: report.ok ? { consistency: report.consistency, checkedAt: report.checkedAt } : { errors: report.validation.errors } };
}

// What the public URL is actually serving right now, by the same rules as
// functions/Atishay-Kasliwal-Resume.pdf.js: the published version only if its file is in R2.
export async function servingState(env, active) {
  if (!active) return { source: "bundled", reason: "nothing-published" };
  if (!env.RESUMES) return { source: "bundled", reason: "storage-missing" };
  try {
    if (!(await env.RESUMES.head(active.r2Key ?? active.r2_key))) return { source: "bundled", reason: "published-file-missing" };
  } catch {
    return { source: "bundled", reason: "storage-error" };
  }
  return { source: "published", reason: null };
}

// Validation and consistency for one PDF. The extracted lines are kept so the admin can see what
// crawlers and applicant tracking systems will read.
export async function buildReport(bytes, { filename, contentType, profile, at }) {
  const validation = await inspectPdf(bytes, { filename, contentType });
  const { lines, ...rest } = validation;
  if (!validation.ok) return { ok: false, validation: rest };
  return {
    ok: true,
    validation: rest,
    consistency: compareWithProfile(lines, profile, reviewItems),
    text: lines.slice(0, 600),
    checkedAt: at,
  };
}
