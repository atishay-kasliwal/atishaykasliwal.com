// Server-side PDF validation and the consistency report (src/resume-core/).
import assert from "node:assert/strict";
import test from "node:test";
import { inspectPdf } from "../../src/resume-core/pdf.js";
import { compareWithProfile, parseRange } from "../../src/resume-core/consistency.js";
import { withActiveResume } from "../../src/resume-core/overlay.js";
import { validateSchema } from "../../src/profile/schema-check.js";
import { reviewItems } from "../../src/profile/review.js";
import { bundledPdf, canonicalProfile, consistentResumeLines, makePdf, profileSchema } from "./helpers.mjs";

const profile = canonicalProfile();
const accepts = (bytes, options = { filename: "resume.pdf", contentType: "application/pdf" }) => inspectPdf(bytes, options);

test("the bundled résumé passes validation and yields its text", async () => {
  const result = await accepts(bundledPdf());
  assert.deepEqual(result.errors, []);
  assert.ok(result.ok);
  assert.equal(result.info.pages, 1);
  assert.ok(result.info.textChars > 1000);
  assert.ok(result.lines.some(line => line.includes("Stony Brook University")));
});

test("invalid uploads are rejected with a reason", async () => {
  const valid = makePdf(consistentResumeLines());
  const cases = [
    ["executable", Uint8Array.from([0x4d, 0x5a, ...new Uint8Array(4096)]), /Windows executable/],
    ["zip", Uint8Array.from([0x50, 0x4b, 0x03, 0x04, ...new Uint8Array(4096)]), /ZIP archive/],
    ["not a pdf", new TextEncoder().encode("<html>".padEnd(4096, " ")), /PDF header/],
    ["too small", new TextEncoder().encode("%PDF-1.4\n%%EOF"), /too small/],
    ["too large", Uint8Array.from([...new TextEncoder().encode("%PDF-1.4\n"), ...new Uint8Array(5 * 1024 * 1024)]), /limit is 5 MB/],
    ["truncated", bundledPdf().slice(0, 60000), /truncated/],
    ["encrypted", makePdf(consistentResumeLines(), { trailerExtra: "/Encrypt << /Filter /Standard >> " }), /Encrypted/],
    ["javascript", makePdf(consistentResumeLines(), { catalogExtra: "/OpenAction 6 0 R ", extraObjects: ["<< /S /JavaScript /JS (app.alert(1)) >>"] }), /JavaScript/],
    ["hex-escaped javascript", makePdf(consistentResumeLines(), { catalogExtra: "/OpenAction 6 0 R ", extraObjects: ["<< /S /J#61vaScript /J#53 (app.alert(1)) >>"] }), /JavaScript/],
    ["launch action", makePdf(consistentResumeLines(), { catalogExtra: "/OpenAction 6 0 R ", extraObjects: ["<< /S /Launch /F (calc.exe) >>"] }), /launch action/],
    ["embedded file", makePdf(consistentResumeLines(), { catalogExtra: "/Names << /EmbeddedFiles 6 0 R >> ", extraObjects: ["<< /Names [] >>"] }), /embedded file/],
    ["no text", makePdf([], { pageContent: "0 0 1 rg 0 0 100 100 re f", pad: 1200 }), /characters of text/],
  ];
  for (const [label, bytes, reason] of cases) {
    const result = await accepts(bytes);
    assert.equal(result.ok, false, `${label} should be rejected`);
    assert.match(result.errors.join(" "), reason, label);
  }
  assert.equal((await accepts(valid, { filename: "resume.exe", contentType: "application/pdf" })).ok, false, "wrong extension");
  assert.equal((await accepts(valid, { filename: "resume.pdf", contentType: "application/x-msdownload" })).ok, false, "wrong declared type");
  assert.ok((await accepts(valid)).ok, "the well-formed fixture is accepted");
});

test("date ranges parse in the forms résumés use", () => {
  assert.deepEqual(parseRange("November 2024 – Present"), { text: "November 2024 – Present", start: "2024-11", end: null, present: true });
  assert.equal(parseRange("Aug. 2024 – May 2026").end, "2026-05");
  assert.equal(parseRange("Sept 2019 - Jan 2020").start, "2019-09");
  assert.equal(parseRange("no dates here"), null);
});

test("the outdated 'Present' on the bundled PDF is flagged against the confirmed May 2026 end date", async () => {
  const { lines } = await accepts(bundledPdf());
  const report = compareWithProfile(lines, profile, reviewItems);
  const endDate = report.items.find(item => item.id === "stony-brook-research-end-date");
  assert.ok(endDate, "Stony Brook end date discrepancy is reported");
  assert.equal(endDate.severity, "conflict");
  assert.equal(endDate.canonical, "May 2026");
  assert.match(endDate.resume, /Present/);
  assert.equal(endDate.reviewItem.id, "stony-brook-research-end-date");
  assert.equal(profile.experience.find(role => role.id === "stony-brook-research").endDate, "2026-05");
});

test("the consistency report covers dates, titles, skills, education and accomplishments", async () => {
  const { lines } = await accepts(bundledPdf());
  const { items, summary } = compareWithProfile(lines, profile, reviewItems);
  const ids = new Set(items.map(item => item.id));
  assert.ok(ids.has("wake-forest-cair-title"), "internship only on the PDF");
  assert.ok(items.some(item => item.category === "skills" && item.severity === "unverified"), "skills without evidence");
  assert.ok(items.some(item => item.category === "accomplishments" && item.reviewItem?.id === "stony-brook-users"), "2,000+ users vs the settled ~1,000");
  assert.ok(items.some(item => item.category === "accomplishments" && item.severity === "unverified"), "metrics with no canonical counterpart");
  assert.ok(items.some(item => item.category === "education" && item.reviewItem?.id === "symbiosis-start-month"), "unconfirmed start month");
  assert.equal(summary.conflict, items.filter(item => item.severity === "conflict").length);
});

test("a résumé that agrees with the profile reports nothing, and changed facts are caught", async () => {
  const clean = await accepts(makePdf(consistentResumeLines()));
  assert.deepEqual(compareWithProfile(clean.lines, profile, reviewItems).items, []);

  const changed = consistentResumeLines().map(line =>
    line
      .replace("Accolite August 2021 - August 2024", "Accolite August 2021 - Present")
      .replace("Master of Science in Data Science Aug. 2024 - May 2026", "Master of Science in Data Science Aug. 2024 - May 2025")
      .replace("Languages: Java, Python, TypeScript, SQL", "Languages: Java, Python, COBOL")
      .replace("Shipped production microservices", "Cut costs 75% shipping production microservices"),
  );
  const report = compareWithProfile((await accepts(makePdf(changed))).lines, profile, reviewItems);
  const ids = report.items.map(item => item.id);
  assert.ok(ids.includes("accolite-end-date"));
  assert.ok(ids.includes("stony-brook-university-end-date"));
  assert.ok(ids.includes("skill-cobol"));
  assert.ok(report.items.some(item => item.category === "accomplishments" && /75%/.test(item.message)));
});

test("consistency checks never modify the canonical profile", async () => {
  const before = JSON.stringify(profile);
  const { lines } = await accepts(bundledPdf());
  compareWithProfile(lines, profile, reviewItems);
  assert.equal(JSON.stringify(profile), before);
});

test("the published-résumé overlay changes only the résumé reference and stays schema-valid", () => {
  const active = { sha256: "a".repeat(64), published_at: "2026-12-01T10:00:00.000Z" };
  const overlaid = withActiveResume(profile, active);
  assert.deepEqual(validateSchema(profileSchema(), overlaid), []);
  assert.deepEqual(overlaid.profile.resume.version, { id: "a".repeat(16), sha256: "a".repeat(64), publishedAt: active.published_at, source: "published" });
  assert.equal(overlaid.profile.resume.url, profile.profile.resume.url);
  assert.equal(overlaid.lastUpdated, "2026-12-01");
  assert.equal(overlaid.evidence.find(item => item.id === "document:resume").date, "2026-12-01");
  const strip = value => {
    const copy = structuredClone(value);
    delete copy.profile.resume;
    delete copy.lastUpdated;
    copy.evidence = copy.evidence.filter(item => item.id !== "document:resume");
    return copy;
  };
  assert.deepEqual(strip(overlaid), strip(profile));
  assert.equal(profile.profile.resume.version.source, "bundled");
});
