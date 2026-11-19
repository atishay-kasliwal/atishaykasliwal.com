// Validates the canonical profile against the built site (run after `npm run build`; part of
// `npm test`). Each check is labelled with the extraction method it simulates:
//   A  raw HTML crawler: essential facts are in the initial HTML of / and /profile/
//   C  structured API consumer: /api/profile.json matches its schema, evidence resolves
//   D  consistency: canonical data = JSON = /profile = Person JSON-LD = experience and project
//      pages = llms.txt = homepage cards; known conflicts stay out; the résumé PDF is compared
//   E  discovery: from the homepage, following ordinary links only, an agent reaches everything
// Browser checks (B, JavaScript disabled) are in scripts/test-profile-browser.mjs.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildProfile, personJsonLd, PERSON_ID } from "../src/profile/build.js";
import { UNSUPPORTED_STRENGTHS } from "../src/profile/data.js";
import { reviewItems } from "../src/profile/review.js";
import { experiencePages } from "../src/experience-pages.js";
import contributions from "../src/profile/open-source-contributions.json" with { type: "json" };
import githubActivity from "../src/github-activity.json" with { type: "json" };
import { contains, discover, readPage, validateSchema } from "./lib/profile-checks.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = process.env.PROFILE_DIST ? path.resolve(process.env.PROFILE_DIST) : path.join(root, "dist");
const SITE = "https://atishaykasliwal.com";
const warnings = [];
const warn = message => warnings.push(message);
let checks = 0;
const ok = (value, message) => {
  checks++;
  assert.ok(value, message);
};

assert.ok(fs.existsSync(path.join(dist, "api/profile.json")), "Run npm run build before validating the profile.");
const buildWarnings = [];
const canonical = buildProfile({ onWarning: message => buildWarnings.push(message) });
ok(!buildWarnings.length, `Canonical profile build warnings:\n${buildWarnings.join("\n")}`);
const json = JSON.parse(fs.readFileSync(path.join(dist, "api/profile.json"), "utf8"));
const schema = JSON.parse(fs.readFileSync(path.join(dist, "api/profile.schema.json"), "utf8"));
const home = readPage(path.join(dist, "index.html"));
const profilePage = readPage(path.join(dist, "profile/index.html"));
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const longMonth = ym => (ym.length === 4 ? ym : `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`);
const shortMonth = ym => (ym.length === 4 ? ym : `${MONTHS[Number(ym.slice(5, 7)) - 1].slice(0, 3)} ${ym.slice(0, 4)}`);

// ---------------- C: structured API consumer ----------------
const schemaErrors = validateSchema(schema, json);
ok(!schemaErrors.length, `C: /api/profile.json does not match its schema:\n${schemaErrors.slice(0, 20).join("\n")}`);
assert.deepEqual(json, JSON.parse(JSON.stringify(canonical)), "C/D: /api/profile.json must equal the canonical profile built from source");
checks++;
assert.deepEqual(buildProfile({ onWarning() {} }), canonical, "C: the canonical profile must be deterministic");
checks++;
const evidenceIds = new Set(json.evidence.map(item => item.id));
ok(evidenceIds.size === json.evidence.length, "C: evidence ids must be unique");
const referenced = [
  ...json.skills.flatMap(skill => skill.usedIn.flatMap(use => use.evidence)),
  ...json.professionalStrengths.flatMap(strength => strength.evidence),
  ...json.projects.flatMap(project => [...project.evidence, ...project.metrics.flatMap(m => m.evidence)]),
  ...json.experience.flatMap(role => [...role.evidence, ...role.metrics.flatMap(m => m.evidence)]),
  ...json.education.flatMap(role => role.evidence),
  ...json.achievements.flatMap(item => item.evidence),
  ...json.openSourceContributions.flatMap(item => item.evidence),
];
for (const id of referenced) ok(evidenceIds.has(id), `C: evidence id ${id} is referenced but not defined`);
for (const item of json.evidence) {
  const url = new URL(item.url);
  ok(url.protocol === "https:", `C: evidence ${item.id} must use HTTPS`);
  if (url.origin === SITE) {
    const file = path.join(dist, decodeURIComponent(url.pathname), url.pathname.endsWith("/") ? "index.html" : "");
    ok(fs.existsSync(file), `C: evidence ${item.id} points to a missing page ${url.pathname}`);
  }
}
const skillIds = new Set(json.skills.map(skill => skill.id));
for (const owner of [...json.projects, ...json.experience, ...json.education, ...json.openSourceContributions]) {
  for (const id of owner.skills) ok(skillIds.has(id), `C: ${owner.id} names unknown skill ${id}`);
}
ok(json.lastUpdated <= new Date().toISOString().slice(0, 10), "C: lastUpdated is in the future");

// "verified" is reserved for facts machine-checked against GitHub.
const verifiedTypes = new Set(["pull_request", "merged_pull_requests", "pull_request_reviews"]);
const evidenceById = new Map(json.evidence.map(item => [item.id, item]));
for (const item of json.evidence.filter(item => item.verificationStatus === "verified")) {
  ok(verifiedTypes.has(item.type), `C: evidence ${item.id} is marked verified but is a ${item.type}`);
}
for (const item of json.achievements.filter(item => item.verificationStatus === "verified")) {
  ok(item.evidence.every(id => verifiedTypes.has(evidenceById.get(id).type)), `C: achievement ${item.id} is verified without GitHub evidence`);
}
for (const skill of json.skills) {
  ok(skill.verificationStatus !== "verified", `C: skill ${skill.id} must not be "verified"; skills are at most publicly_verifiable`);
  const best = skill.usedIn.some(use => use.verificationStatus === "publicly_verifiable") ? "publicly_verifiable" : "self_reported";
  ok(skill.verificationStatus === best, `C: skill ${skill.id} status ${skill.verificationStatus} does not follow from its evidence`);
}
for (const project of json.projects) {
  for (const metric of project.metrics) {
    if (metric.verificationStatus === "publicly_verifiable") ok(project.links.repository, `C: ${project.id} metric ${metric.value} is public evidence without a public repository`);
  }
}
for (const role of [...json.experience, ...json.education]) {
  for (const metric of role.metrics) ok(metric.verificationStatus === "self_reported", `C: employer metric ${role.id} ${metric.value} must be self_reported`);
}

// ---------------- Professional strengths: no unsupported claims ----------------
ok(json.professionalStrengths.length > 0, "Strengths: none published");
for (const strength of json.professionalStrengths) {
  ok(strength.examples.length > 0 && strength.evidence.length > 0, `Strengths: ${strength.id} has no evidence`);
  ok(!UNSUPPORTED_STRENGTHS.some(name => name.toLowerCase() === strength.name.toLowerCase()), `Strengths: ${strength.name} is listed as unsupported`);
  if (/mentor/i.test(strength.id + strength.name)) {
    ok(strength.examples.some(ex => ex.type === "experience"), `Strengths: ${strength.id} must rest on documented experience, not code`);
  }
  if (strength.category === "Leadership" && strength.examples.every(ex => ex.type === "project")) {
    ok(/not people leadership/i.test(strength.description), `Strengths: ${strength.id} rests only on personal projects; say it is not people leadership`);
  }
}
const requiredStrengthCategories = ["Communication", "Leadership", "Mentoring", "Collaboration", "Problem solving", "Professional skills"];
for (const category of requiredStrengthCategories) {
  ok(json.professionalStrengths.some(s => s.category === category), `Strengths: no evidenced strength in ${category}`);
}

// ---------------- A: raw HTML crawler ----------------
const homeText = home.text;
for (const fact of [json.profile.name, "Software", "New York", "Open to work", "Selected work", "Experience", "Open source"]) {
  ok(contains(homeText, fact), `A: homepage HTML is missing "${fact}"`);
}
ok(home.links.some(link => link.href === "/profile/"), "A: homepage must link to /profile/ with an ordinary link");
ok(home.alternates.some(link => link.href === "/api/profile.json" && link.type === "application/json"), "A: homepage must declare the JSON profile as an alternate");
ok(home.links.some(link => link.href === "/Atishay-Kasliwal-Resume.pdf"), "A: homepage must link to the résumé");
for (const project of json.projects) ok(home.links.some(link => link.href === `/projects/${project.id}/`), `A: homepage does not link to ${project.name}`);
for (const repo of json.openSourceSummary.mergedRepositories.filter(r => contains(homeText, r.projectName))) {
  // Homepage cards show "<repo> · <n> merged"; the count must match the verified snapshot.
  const shown = homeText.match(new RegExp(`${repo.repository.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")} · (\\d+) merged`, "i"));
  if (shown) ok(Number(shown[1]) === repo.merged, `D: homepage says ${repo.repository} has ${shown[1]} merged, GitHub says ${repo.merged}`);
}

const page = profilePage.text;
ok(profilePage.headings.filter(h => h.level === 1).length === 1, "A: /profile must have exactly one H1");
for (let i = 1; i < profilePage.headings.length; i++) {
  ok(profilePage.headings[i].level <= profilePage.headings[i - 1].level + 1, `A: /profile skips a heading level before "${profilePage.headings[i].text}"`);
}
for (const fact of [json.profile.name, json.profile.headline, json.profile.contact.email, ...json.profile.summary]) {
  ok(contains(page, fact), `A: /profile is missing "${fact}"`);
}
for (const role of json.experience) {
  for (const fact of [role.title, role.organization.name, shortMonth(role.startDate), role.summary, ...role.metrics.map(m => m.value), ...role.highlights.map(h => h.detail)]) {
    ok(contains(page, fact), `A: /profile experience ${role.id} is missing "${fact}"`);
  }
  if (role.endDate) ok(contains(page, shortMonth(role.endDate)), `A: /profile ${role.id} is missing its end date`);
}
for (const item of json.education) {
  for (const fact of [item.credential, item.institution.name, item.startDate.slice(0, 4), item.endDate.slice(0, 4), ...item.highlights.map(h => h.detail)]) {
    ok(contains(page, fact), `A: /profile education ${item.id} is missing "${fact}"`);
  }
}
for (const project of json.projects) {
  for (const fact of [project.name, project.summary, ...project.metrics.map(m => m.value), ...project.technologies]) {
    ok(contains(page, fact), `A: /profile project ${project.id} is missing "${fact}"`);
  }
  ok(profilePage.links.some(link => link.href === `/projects/${project.id}/`), `A: /profile does not link to ${project.name}'s case study`);
  if (project.links.repository) ok(profilePage.links.some(link => link.href === project.links.repository), `A: /profile does not link to ${project.name}'s repository`);
}
for (const skill of json.skills) {
  ok(profilePage.ids.has(`skill-${skill.id}`) && contains(page, skill.name), `A: /profile is missing skill ${skill.name}`);
  for (const use of skill.usedIn) ok(contains(page, use.implementation), `A: /profile skill ${skill.id} is missing "${use.implementation}"`);
}
for (const strength of json.professionalStrengths) {
  ok(profilePage.ids.has(`strength-${strength.id}`) && contains(page, strength.name), `A: /profile is missing strength ${strength.name}`);
  for (const example of strength.examples) ok(contains(page, example.example), `A: /profile strength ${strength.id} is missing "${example.example}"`);
}
ok(contains(page, "Professional strengths"), "A: /profile needs a Professional strengths section");
for (const pr of json.openSourceContributions.filter(c => c.status === "merged")) {
  ok(profilePage.links.some(link => link.href === pr.url), `A: /profile does not link to merged ${pr.id}`);
}
for (const item of [...json.achievements, ...json.community]) ok(contains(page, item.title ?? item.description), `A: /profile is missing "${item.title ?? item.name}"`);
ok(profilePage.links.some(link => link.href === "/api/profile.json"), "A: /profile must link to /api/profile.json");
ok(profilePage.alternates.some(link => link.href === "/api/profile.json"), "A: /profile must declare the JSON alternate");
ok(!/<details/i.test(profilePage.source), "A: /profile must not hide content in <details>");

// ---------------- D: consistency across representations ----------------
const strip = node => {
  const { mainEntityOfPage, ...rest } = node;
  return rest;
};
const expectedPerson = strip(personJsonLd(canonical));
for (const [label, record] of [["homepage", home], ["/profile", profilePage]]) {
  const person = record.graph.find(node => node["@id"] === PERSON_ID && node["@type"] === "Person");
  ok(person, `D: ${label} has no Person entity`);
  assert.deepEqual(strip(person), expectedPerson, `D: ${label} Person JSON-LD differs from the canonical profile`);
  checks++;
}
const profileNode = profilePage.graph.find(node => node["@type"] === "ProfilePage");
ok(profileNode?.mainEntity?.["@id"] === PERSON_ID && profileNode.dateModified === json.lastUpdated, "D: /profile ProfilePage must point at the Person and carry lastUpdated");

for (const role of [...json.experience, ...json.education]) {
  const record = readPage(path.join(dist, "experience", role.id, "index.html"));
  const name = role.title ?? role.credential;
  ok(contains(record.text, name), `D: experience page ${role.id} does not show "${name}"`);
  ok(contains(record.text, longMonth(role.endDate ?? "")) || !role.endDate, `D: experience page ${role.id} does not show end ${longMonth(role.endDate)}`);
  if (role.startDate.length > 4) ok(contains(record.text, longMonth(role.startDate)), `D: experience page ${role.id} does not show start ${longMonth(role.startDate)}`);
  for (const metric of role.metrics) ok(contains(record.text, metric.value), `D: experience page ${role.id} does not show ${metric.value}`);
}
for (const project of json.projects) {
  const record = readPage(path.join(dist, "projects", project.id, "index.html"));
  ok(contains(record.text, project.name), `D: project page ${project.id} does not show its name`);
  for (const metric of project.metrics) ok(contains(record.text, metric.value), `D: project page ${project.id} does not show ${metric.value}`);
}

// llms.txt: the generated open source block, and the hand-written experience and education lines.
const llms = fs.readFileSync(path.join(dist, "llms.txt"), "utf8");
ok(llms.includes("https://atishaykasliwal.com/profile/") && llms.includes("https://atishaykasliwal.com/api/profile.json"), "D: llms.txt must point to /profile/ and /api/profile.json");
ok(llms.includes(`${json.openSourceSummary.pullRequests.merged} merged across ${json.openSourceSummary.mergedRepositories.length} repositories`), "D: llms.txt open source block is stale; rebuild");
for (const role of json.experience) {
  const line = llms.split("\n").find(l => l.includes(`/experience/${role.id}/`));
  ok(line, `D: llms.txt has no line for ${role.id}`);
  ok(contains(line, `${role.title}, ${role.organization.name}`), `D: llms.txt title for ${role.id} differs from "${role.title}, ${role.organization.name}"`);
  ok(contains(line, `${shortMonth(role.startDate)} to ${role.endDate ? shortMonth(role.endDate) : "Present"}`), `D: llms.txt dates for ${role.id} differ from the canonical profile`);
}
for (const item of json.education) {
  const line = llms.split("\n").find(l => l.includes(`/experience/${item.id}/`));
  ok(line && line.includes(`(${item.startDate.slice(0, 4)} to ${item.endDate.slice(0, 4)})`), `D: llms.txt years for ${item.id} differ`);
}

// Known conflicts stay out of the canonical profile until a person resolves them.
const canonicalText = `${JSON.stringify(json)}\n${page}`;
for (const item of reviewItems) {
  for (const phrase of item.mustNotAppear ?? []) {
    ok(!contains(canonicalText, phrase), `D: "${phrase}" appears in the canonical profile, but review item ${item.id} is ${item.status}`);
  }
  if (item.status === "needs_review") warn(`review: ${item.id} needs a decision. ${item.action ?? ""}`.trim());
}
ok(!/before the first engineering internship/i.test(fs.readFileSync(path.join(dist, "experience/symbiosis-university/index.html"), "utf8")), "D: the Symbiosis page still claims graduation before Shriffle");

// The homepage GitHub block and the contributions snapshot are refreshed separately.
if (githubActivity.mergedUpstream?.pullRequests !== json.openSourceSummary.pullRequests.merged) {
  warn(`open source: homepage GitHub block says ${githubActivity.mergedUpstream?.pullRequests} merged (fetched ${githubActivity.fetchedAt}), the profile snapshot says ${json.openSourceSummary.pullRequests.merged} (verified ${contributions.verifiedAt}); refresh both.`);
}

// The résumé PDF is maintained outside this repository. Every disagreement with the canonical
// profile must be a registered review item; an unregistered one fails.
function pdfText() {
  try {
    return execFileSync("pdftotext", ["-layout", path.join(dist, "Atishay-Kasliwal-Resume.pdf"), "-"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return null;
  }
}
const resume = pdfText();
if (!resume) {
  warn("résumé: pdftotext is not installed, so the PDF was not compared");
} else {
  const known = new Set(reviewItems.map(item => item.id));
  const mismatch = (id, message) => {
    if (known.has(id)) warn(`résumé: ${message} (review item ${id})`);
    else assert.fail(`D: résumé PDF disagrees with the canonical profile and no review item covers it: ${message}`);
  };
  const longOrShort = ym => [longMonth(ym), shortMonth(ym), `${shortMonth(ym).replace(" ", ". ")}`];
  // Compare each part of the profile with the matching résumé section only.
  const lines = resume.split("\n");
  const heading = name => lines.findIndex(line => line.trim() === name);
  const section = (from, to) => lines.slice(heading(from), heading(to) === -1 ? undefined : heading(to));
  const experienceLines = section("Experience", "Projects");
  const educationLines = section("Education", "Experience");
  for (const role of json.experience) {
    // The PDF prints names its own way ("Wake Forest - CAIR", "Accolite Digital"): match on the leading words.
    const key = role.organization.name.split(/\s+/).slice(0, 2).join(" ");
    const block = experienceLines.findIndex(line => contains(line, key));
    if (block === -1) {
      if (role.employmentType !== "internship") warn(`résumé: ${role.organization.name} is not on the résumé`);
      continue;
    }
    const near = experienceLines.slice(block, block + 2).join(" ");
    if (!longOrShort(role.startDate).some(v => contains(near, v))) mismatch(`${role.id}-start-date`, `${role.id} start ${role.startDate}`);
    if (role.endDate && !longOrShort(role.endDate).some(v => contains(near, v))) mismatch(`${role.id}-end-date`, `${role.id} ends ${role.endDate}; the PDF says otherwise`);
    if (!contains(near, role.title.split(",")[0])) mismatch(`${role.id}-title`, `${role.id} title "${role.title}"`);
    else if (/intern/i.test(near) && role.employmentType !== "internship") mismatch(`${role.id}-title`, `${role.id} is an internship on the PDF only`);
  }
  for (const item of json.education) {
    const block = educationLines.findIndex(line => contains(line, item.institution.alternateNames?.[0] ?? item.institution.name));
    if (block === -1) {
      mismatch(`${item.id}-missing`, `${item.institution.name} is not on the résumé`);
      continue;
    }
    const near = educationLines.slice(block, block + 2).join(" ");
    if (!contains(near, item.endDate.slice(0, 4))) mismatch(`${item.id}-end-date`, `${item.id} end year`);
    if (item.startDate.length === 4) warn(`résumé: ${item.id} start month is unconfirmed; PDF shows "${near.match(/[A-Z][a-z]{2}\.? \d{4}/)?.[0]}" (review item symbiosis-start-month)`);
    else if (!longOrShort(item.startDate).some(v => contains(near, v))) mismatch(`${item.id}-start-date`, `${item.id} start ${item.startDate}`);
  }
  if (!contains(resume, json.profile.contact.email)) mismatch("resume-email", "email differs");
}

// ---------------- E: discovery from the homepage ----------------
const { internal, external } = discover(dist);
const at = pathname => internal.get(pathname);
ok(at("/profile/") === 1, `E: /profile/ should be one click from the homepage (found at ${at("/profile/")})`);
ok(at("/api/profile.json") !== undefined && at("/api/profile.json") <= 2, `E: /api/profile.json should be reachable within two links (found at ${at("/api/profile.json")})`);
ok(at("/Atishay-Kasliwal-Resume.pdf") === 1, "E: the résumé should be one click from the homepage");
ok(at("/llms.txt") !== undefined, "E: llms.txt should be reachable by links");
for (const project of json.projects) ok(at(`/projects/${project.id}/`) === 1, `E: ${project.name} should be one click from the homepage`);
for (const role of [...json.experience, ...json.education]) ok(at(`/experience/${role.id}/`) === 1, `E: ${role.id} should be one click from the homepage`);
for (const pr of json.openSourceContributions.filter(c => c.status === "merged")) {
  ok(external.has(pr.url) && external.get(pr.url) <= 2, `E: merged ${pr.id} should be reachable within two links`);
}
for (const project of json.projects.filter(p => p.links.repository)) ok(external.has(project.links.repository), `E: ${project.name}'s repository is not linked anywhere`);

console.log(`Profile validation passed: ${checks} checks. ${json.skills.length} skills, ${json.professionalStrengths.length} strengths, ${json.projects.length} projects, ${json.experience.length} roles, ${json.education.length} degrees, ${json.openSourceSummary.pullRequests.merged} verified merged pull requests; /profile/ 1 click and /api/profile.json ${at("/api/profile.json")} from the homepage.`);
if (warnings.length) console.log(`\n${warnings.length} item(s) for manual review:\n- ${warnings.join("\n- ")}`);
