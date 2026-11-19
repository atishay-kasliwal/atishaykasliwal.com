// The response inspector's checks (src/admin/responses/checks.js), against the built pages when a
// build exists (npm test builds first).
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { checkHtml, checkProfileJson, extractHtml } from "../../src/admin/responses/checks.js";
import { withActiveResume } from "../../src/resume-core/overlay.js";
import { reviewItems } from "../../src/profile/review.js";
import { canonicalProfile, profileSchema } from "./helpers.mjs";

const canonical = canonicalProfile();
const schema = profileSchema();
const bundled = { ...canonical.profile.resume.version };
const context = (expected = bundled) => ({ canonical, schema, reviewItems, resume: { expected } });
const dist = new URL("../../dist/", import.meta.url);
const built = file => (fs.existsSync(new URL(file, dist)) ? fs.readFileSync(new URL(file, dist), "utf8") : null);

test("the built profile JSON passes every check", () => {
  const result = checkProfileJson(JSON.stringify(canonical), context());
  assert.deepEqual(result.schemaErrors, []);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.inconsistent, []);
  assert.deepEqual(result.unexpected, []);
  assert.deepEqual(result.forbidden, []);
  assert.equal(result.resume.matches, true);
  assert.equal(result.version.schemaVersion, "1.1");
});

test("a published résumé is expected in the live JSON, not reported as drift", () => {
  const published = { id: "b".repeat(16), sha256: "b".repeat(64), publishedAt: "2026-12-02T09:00:00.000Z", source: "published" };
  const live = withActiveResume(canonical, { sha256: published.sha256, published_at: published.publishedAt });
  const ok = checkProfileJson(JSON.stringify(live), context(published));
  assert.deepEqual([...ok.missing, ...ok.inconsistent, ...ok.unexpected], []);
  assert.equal(ok.resume.matches, true);
  // A stale response still naming the bundled PDF is caught.
  const stale = checkProfileJson(JSON.stringify(canonical), context(published));
  assert.equal(stale.resume.matches, false);
  assert.ok(stale.inconsistent.some(item => item.path === "$.profile.resume.version.sha256"));
});

test("missing fields, changed facts, schema errors and kept-out phrases are reported", () => {
  const live = structuredClone(canonical);
  delete live.profile.headline;
  live.experience.find(role => role.id === "stony-brook-research").endDate = null;
  live.skills = live.skills.filter(skill => skill.id !== "python");
  live.profile.summary = `${live.profile.summary} 2,000+ users`;
  live.extra = true;
  const result = checkProfileJson(JSON.stringify(live), context());
  assert.ok(result.schemaErrors.some(error => error.includes("missing headline")));
  assert.ok(result.schemaErrors.some(error => error.includes("unexpected property extra")));
  assert.ok(result.missing.some(item => item.path === "$.profile.headline"));
  assert.ok(result.missing.some(item => item.path === "$.skills[id=python]"));
  assert.ok(result.inconsistent.some(item => item.path === "$.experience[id=stony-brook-research].endDate" && item.expected === '"2026-05"'));
  assert.ok(result.unexpected.some(item => item.path === "$.extra"));
  assert.ok(result.forbidden.some(item => item.reviewItem === "stony-brook-users"));
  assert.ok(checkProfileJson("{not json", context()).parseError);
});

test("HTML extraction reads what a crawler without JavaScript reads", () => {
  const page = extractHtml(`<html><head><title>A &amp; B</title><meta name="description" content="d"><link rel="canonical" href="https://atishaykasliwal.com/"><script type="application/ld+json">{"@type":"Person","name":"X"}</script><script>var hidden = "no";</script></head><body><h1>Hi <b>there</b></h1><a href="/profile/">p</a></body></html>`);
  assert.equal(page.title, "A & B");
  assert.equal(page.canonical, "https://atishaykasliwal.com/");
  assert.deepEqual(page.h1, ["Hi there"]);
  assert.deepEqual(page.links, ["/profile/"]);
  assert.equal(page.jsonLd[0].name, "X");
  assert.ok(!page.text.includes("hidden"));
});

test("the built homepage and /profile/ pass the inspector's HTML checks", t => {
  const home = built("index.html");
  const profile = built("profile/index.html");
  if (!home || !profile) return t.skip("no build in dist/");
  const homeResult = checkHtml(home, "home", { canonical, reviewItems });
  assert.deepEqual(homeResult.issues.filter(issue => issue.severity === "error"), []);
  const profileResult = checkHtml(profile, "profile", { canonical, reviewItems });
  assert.deepEqual(profileResult.issues.filter(issue => issue.severity === "error"), []);
  assert.match(profileResult.extracted.text, /Nov 2024 – May 2026|Nov 2024 - May 2026/);
  const tampered = profile.replace('<time datetime="2024-11">Nov 2024</time> – <time datetime="2026-05">May 2026</time>', '<time datetime="2024-11">Nov 2024</time> – Present');
  assert.notEqual(tampered, profile, "the Stony Brook research dates are in the built page");
  assert.ok(checkHtml(tampered, "profile", { canonical, reviewItems }).issues.some(issue => issue.message.includes("Stony Brook University")));
});
