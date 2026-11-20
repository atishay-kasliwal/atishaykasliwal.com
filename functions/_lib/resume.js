import bundled from "../_generated/bundled-resume.js";
import { ResumeRequestError } from "../../src/resume-core/store.js";
import { LIMITS } from "../../src/resume-core/constants.js";

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
// be. Checked against the canonical profile at build time (scripts/build-resume-report.mjs), so
// the dashboard can say whether the fallback is outdated without parsing a PDF per request.
export function bundledResume({ withReport = false } = {}) {
  const { report, ...info } = bundled;
  return withReport ? { ...info, report } : info;
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

// ---------- Reports computed in the admin's browser ----------
// The browser runs the full check (src/resume-core/report.js); the server screened the bytes
// itself and accepts the rest only in this shape. Counts are recomputed here, never trusted.

const SEVERITIES = ["conflict", "unverified", "info"];
const MAX_REPORT_CHARS = 1024 * 1024;
const isText = (value, max) => typeof value === "string" && value.length <= max;
const isCount = (value, min = 0, max = Number.MAX_SAFE_INTEGER) => Number.isInteger(value) && value >= min && value <= max;
const invalid = what => new ResumeRequestError(`The browser's check is malformed (${what}). Reload the page and upload again.`);

export function acceptedConsistency(consistency) {
  if (!consistency || typeof consistency !== "object" || !Array.isArray(consistency.items) || consistency.items.length > 1000) throw invalid("consistency");
  for (const item of consistency.items) {
    if (!item || !isText(item.id, 200) || !SEVERITIES.includes(item.severity) || !isText(item.message, 4000)) throw invalid("consistency item");
  }
  const summary = Object.fromEntries(SEVERITIES.map(severity => [severity, consistency.items.filter(item => item.severity === severity).length]));
  return { profileVersion: consistency.profileVersion ?? null, summary, items: consistency.items };
}

export function parseBrowserReport(raw, { sha256, sizeBytes, screened, at }) {
  if (!isText(raw, MAX_REPORT_CHARS)) throw invalid(raw ? "too large" : "missing; the page that uploaded it is out of date");
  let report;
  try {
    report = JSON.parse(raw);
  } catch {
    throw invalid("not JSON");
  }
  if (report?.ok !== true) throw invalid("not a passing check");
  if (report.sha256 !== sha256) throw invalid("it describes a different file");
  const { validation, text } = report;
  const info = validation?.info;
  if (validation?.ok !== true || !Array.isArray(validation.errors) || validation.errors.length) throw invalid("validation");
  if (!info || info.sizeBytes !== sizeBytes || !isCount(info.pages, 1, LIMITS.maxPages) || !isCount(info.textChars, LIMITS.minTextChars)) throw invalid("file details");
  if (!Array.isArray(validation.checks) || validation.checks.length > 40 || !validation.checks.every(check => check && isText(check.id, 60) && isText(check.label, 200) && typeof check.ok === "boolean" && isText(check.detail, 2000))) throw invalid("checks");
  if (!Array.isArray(validation.warnings) || validation.warnings.length > 20 || !validation.warnings.every(warning => isText(warning, 2000))) throw invalid("warnings");
  if (!Array.isArray(text) || text.length > LIMITS.keptLines || !text.every(line => isText(line, 4000))) throw invalid("text");
  const keep = value => (isText(value, 500) ? value : null);
  return {
    ok: true,
    validation: {
      ok: true,
      errors: [],
      warnings: validation.warnings,
      checks: validation.checks,
      info: {
        sizeBytes,
        pages: info.pages,
        textChars: info.textChars,
        pdfVersion: screened.info.pdfVersion,
        title: keep(info.title),
        author: keep(info.author),
        producer: keep(info.producer),
        creator: keep(info.creator),
      },
      // What this server verified itself, independently of the browser.
      serverChecks: screened.checks,
      checkedIn: "browser",
    },
    consistency: acceptedConsistency(report.consistency),
    text,
    checkedAt: at,
  };
}
