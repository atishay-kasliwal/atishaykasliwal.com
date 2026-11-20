// Unit tests for the canonical profile (src/profile/). The build-level checks against dist/ are in
// scripts/validate-profile.mjs; the last group here proves that script catches contradictions by
// running it against tampered copies of the build.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildProfile, personJsonLd, VERIFICATION_STATUSES } from "../../src/profile/build.js";
import { UNSUPPORTED_STRENGTHS, professionalStrengths, skills as skillDefinitions } from "../../src/profile/data.js";
import { reviewItems } from "../../src/profile/review.js";
import { caseStudies } from "../../src/case-studies/data.js";
import { experiencePages } from "../../src/experience-pages.js";
import snapshot from "../../src/profile/open-source-contributions.json" with { type: "json" };
import { validateSchema } from "../../scripts/lib/profile-checks.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const schema = JSON.parse(fs.readFileSync(path.join(root, "src/profile/profile.schema.json"), "utf8"));
const quiet = { onWarning() {} };
const profile = buildProfile(quiet);
const json = JSON.parse(JSON.stringify(profile));

test("the canonical profile is deterministic and matches its published schema", () => {
  assert.deepEqual(buildProfile(quiet), profile);
  assert.deepEqual(validateSchema(schema, json), []);
  assert.equal(json.schemaVersion, "1.1");
  assert.match(json.lastUpdated, /^\d{4}-\d{2}-\d{2}$/);
});

test("the schema checker rejects malformed profiles", () => {
  const missing = structuredClone(json);
  delete missing.profile.name;
  assert.ok(validateSchema(schema, missing).some(e => e.includes("missing name")));
  const badStatus = structuredClone(json);
  badStatus.skills[0].verificationStatus = "expert";
  assert.ok(validateSchema(schema, badStatus).some(e => e.includes("not in")));
  const extra = structuredClone(json);
  extra.skills[0].proficiency = "advanced";
  assert.ok(validateSchema(schema, extra).some(e => e.includes("unexpected property proficiency")));
  const badPr = structuredClone(json);
  badPr.openSourceContributions[0].status = "accepted";
  assert.ok(validateSchema(schema, badPr).length > 0);
});

test("every project, role and degree on the site is in the profile, and nothing else", () => {
  assert.deepEqual(new Set(json.projects.map(p => p.id)), new Set(caseStudies.map(s => s.slug)));
  assert.deepEqual(
    new Set([...json.experience, ...json.education].map(r => r.id)),
    new Set(experiencePages.map(p => p.slug)),
  );
  for (const role of json.experience) {
    assert.match(role.startDate, /^\d{4}-\d{2}$/);
    assert.ok(role.endDate === null || role.endDate >= role.startDate, `${role.id} ends before it starts`);
  }
  // The undergraduate start month is unconfirmed, so only the year is published.
  assert.equal(json.education.find(e => e.id === "symbiosis-university").startDate, "2018");
});

test("skills: every one has evidence, and its status follows from that evidence", () => {
  assert.equal(json.skills.length, skillDefinitions.length);
  for (const skill of json.skills) {
    assert.ok(skill.usedIn.length > 0, skill.id);
    for (const use of skill.usedIn) {
      assert.ok(use.implementation.length > 10, `${skill.id}: implementation note is too thin`);
      assert.ok(use.evidence.length > 0, `${skill.id}: ${use.id} has no evidence`);
    }
    assert.notEqual(skill.verificationStatus, "verified", "skills are never machine-verified");
    const hasPublic = skill.usedIn.some(u => u.verificationStatus === "publicly_verifiable");
    assert.equal(skill.verificationStatus, hasPublic ? "publicly_verifiable" : "self_reported", skill.id);
  }
  // Employer work alone is self-reported; a private or unlinked repository is not public evidence.
  const fromEmployerOnly = json.skills.filter(s => s.usedIn.every(u => ["experience", "education", "document"].includes(u.type)));
  assert.ok(fromEmployerOnly.length > 0);
  for (const skill of fromEmployerOnly) assert.equal(skill.verificationStatus, "self_reported", skill.id);
  const neo4j = json.skills.find(s => s.id === "neo4j");
  assert.equal(neo4j.verificationStatus, "self_reported", "Medscan's repository is private");
});

test("skill evidence chain: skill -> project or role -> implementation -> evidence that resolves", () => {
  const evidence = new Set(json.evidence.map(e => e.id));
  for (const skill of json.skills) {
    for (const use of skill.usedIn) {
      for (const id of use.evidence) assert.ok(evidence.has(id), `${skill.id} -> ${id}`);
      if (use.type === "project") assert.ok(json.projects.find(p => p.id === use.id).skills.includes(skill.id));
    }
  }
});

test("professional strengths: only evidenced ones are published, with honest status", () => {
  assert.equal(json.professionalStrengths.length, professionalStrengths.length);
  const published = new Set(json.professionalStrengths.map(s => s.name.toLowerCase()));
  for (const name of UNSUPPORTED_STRENGTHS) assert.ok(!published.has(name.toLowerCase()), `${name} has no evidence`);
  for (const strength of json.professionalStrengths) {
    assert.ok(strength.examples.length > 0 && strength.evidence.length > 0, strength.id);
    assert.ok(["publicly_verifiable", "self_reported"].includes(strength.verificationStatus), strength.id);
  }
  // Mentoring rests on documented experience, never on code contributions.
  const mentoring = json.professionalStrengths.find(s => s.id === "mentoring");
  assert.ok(mentoring.examples.every(ex => ex.type === "experience"));
  assert.equal(mentoring.verificationStatus, "self_reported");
  // Ownership of personal projects is not presented as people leadership.
  const ownership = json.professionalStrengths.find(s => s.id === "project-ownership");
  assert.match(ownership.description, /not people leadership/i);
});

test("open source: statuses come from GitHub and merged is never inferred", () => {
  assert.equal(json.openSourceContributions.length, snapshot.pullRequests.length);
  for (const item of json.openSourceContributions) {
    const source = snapshot.pullRequests.find(pr => pr.url === item.url);
    if (item.status === "merged") {
      assert.equal(source.state, "merged");
      assert.ok(source.mergedAt, `${item.id} is merged without a merge date`);
      assert.deepEqual(item.evidence, [`pr:${item.id}`]);
    } else {
      assert.equal(item.mergedAt, null);
      assert.deepEqual(item.evidence, [], `${item.id} is not merged, so it is not evidence`);
      assert.deepEqual(item.skills, []);
    }
  }
  const s = json.openSourceSummary.pullRequests;
  assert.equal(s.merged + s.open + s.closedUnmerged, s.total);
  assert.equal(json.openSourceSummary.mergedRepositories.reduce((n, r) => n + r.merged, 0), s.merged);
});

test("metrics: employer numbers are self-reported; public evidence needs a public repository", () => {
  for (const role of [...json.experience, ...json.education]) {
    for (const metric of role.metrics) assert.equal(metric.verificationStatus, "self_reported");
  }
  for (const project of json.projects) {
    for (const metric of project.metrics) {
      if (metric.verificationStatus === "publicly_verifiable") assert.ok(project.links.repository, `${project.id} ${metric.value}`);
    }
  }
  const tracker = json.projects.find(p => p.id === "atriveo-tracker");
  assert.equal(tracker.metrics.find(m => m.value === "1,000+").verificationStatus, "self_reported");
});

test("review ledger: unresolved conflicts stay out of the canonical profile", () => {
  const text = JSON.stringify(json).toLowerCase();
  for (const item of reviewItems) {
    assert.ok(["resolved", "needs_review"].includes(item.status), item.id);
    if (item.status === "needs_review") assert.ok(item.action, `${item.id} needs an action for the reviewer`);
    for (const phrase of item.mustNotAppear ?? []) assert.ok(!text.includes(phrase.toLowerCase()), `${item.id}: "${phrase}"`);
  }
  // No years-of-experience claim is generated.
  assert.ok(!/\d\+? years/i.test(JSON.stringify(json.profile)));
});

test("Person structured data comes from the canonical profile", () => {
  const person = personJsonLd(profile);
  assert.equal(person.name, json.profile.name);
  assert.equal(person.jobTitle, json.profile.headline);
  assert.equal(person.alumniOf.length, json.education.length);
  assert.ok(person.knowsAbout.includes("Go") && person.knowsAbout.includes("Rust"));
  assert.ok(!("description" in person) || !/5\+ years/.test(person.description));
  assert.deepEqual(Object.keys(VERIFICATION_STATUSES), ["verified", "publicly_verifiable", "self_reported", "needs_review"]);
});

// ---------- The validator catches contradictions ----------
const dist = path.join(root, "dist");
const built = fs.existsSync(path.join(dist, "api/profile.json"));

function tamperedCopy(edit) {
  const copy = fs.mkdtempSync(path.join(os.tmpdir(), "profile-dist-"));
  const keep = /\.(html|json|txt|pdf|xml)$/;
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const from = path.join(dir, entry.name);
      const to = path.join(copy, path.relative(dist, from));
      if (entry.isDirectory()) walk(from);
      else if (keep.test(entry.name)) {
        fs.mkdirSync(path.dirname(to), { recursive: true });
        fs.copyFileSync(from, to);
      }
    }
  })(dist);
  edit(copy);
  return copy;
}
function validatorFails(copy) {
  try {
    execFileSync(process.execPath, [path.join(root, "scripts/validate-profile.mjs")], { env: { ...process.env, PROFILE_DIST: copy }, stdio: "pipe" });
    return null;
  } catch (error) {
    return String(error.stderr);
  } finally {
    fs.rmSync(copy, { recursive: true, force: true });
  }
}
const replaceIn = (file, from, to) => {
  const text = fs.readFileSync(file, "utf8");
  assert.ok(text.includes(from), `fixture text not found in ${file}: ${from}`);
  fs.writeFileSync(file, text.replace(from, to));
};

test("validator: passes on the real build", { skip: !built && "run npm run build first" }, () => {
  assert.equal(validatorFails(tamperedCopy(() => {})), null);
});

test("validator: catches a JSON value that differs from the source", { skip: !built && "run npm run build first" }, () => {
  const error = validatorFails(tamperedCopy(copy => replaceIn(path.join(copy, "api/profile.json"), '"value":"20+"', '"value":"40+"')));
  assert.match(error, /must equal the canonical profile/);
});

test("validator: catches conflicting dates in llms.txt", { skip: !built && "run npm run build first" }, () => {
  const error = validatorFails(tamperedCopy(copy => replaceIn(path.join(copy, "llms.txt"), "(Aug 2021 to Aug 2024)", "(Aug 2021 to Aug 2025)")));
  assert.match(error, /llms\.txt dates for accolite differ/);
});

test("validator: catches an experience page that disagrees with the profile", { skip: !built && "run npm run build first" }, () => {
  const error = validatorFails(tamperedCopy(copy => {
    const file = path.join(copy, "experience/wake-forest-cair/index.html");
    const text = fs.readFileSync(file, "utf8").replaceAll("August 2025", "December 2025");
    fs.writeFileSync(file, text);
  }));
  assert.match(error, /wake-forest-cair does not show end August 2025/);
});

test("validator: catches a missing project on /profile and a lost homepage link", { skip: !built && "run npm run build first" }, () => {
  const missing = validatorFails(tamperedCopy(copy => replaceIn(path.join(copy, "profile/index.html"), "leader election, idempotent commands, ", "")));
  assert.match(missing, /project insureraft is missing/);
  const unlinked = validatorFails(tamperedCopy(copy => {
    const file = path.join(copy, "index.html");
    fs.writeFileSync(file, fs.readFileSync(file, "utf8").replaceAll('href="/profile/"', 'href="#"'));
  }));
  assert.match(unlinked, /homepage must link to \/profile\//);
});

test("validator: catches an unsupported claim entering the profile", { skip: !built && "run npm run build first" }, () => {
  const error = validatorFails(tamperedCopy(copy => replaceIn(path.join(copy, "profile/index.html"), "Open to work</p>", "Open to work · 2,000+ users</p>")));
  assert.match(error, /2,000\+ users/);
});
