// Measures what a non-JavaScript agent can extract from a built site, so two builds can be compared
// (the before/after table in docs/audits/). Starts at the homepage, follows ordinary links only,
// and scores how much of the canonical profile it can find, and how fast.
//
//   node scripts/extraction-report.mjs [dist-dir] [--json]
import fs from "node:fs";
import path from "node:path";
import { buildProfile } from "../src/profile/build.js";
import { contains, discover, readPage } from "./lib/profile-checks.mjs";

const dist = path.resolve(process.argv[2] ?? "dist");
const asJson = process.argv.includes("--json");
const canonical = buildProfile({ onWarning() {} });
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
// Either "Nov 2024" or "November 2024" counts.
const hasMonth = (text, ym) =>
  ym.length === 4 ? contains(text, ym) : [MONTHS[Number(ym.slice(5, 7)) - 1], MONTHS[Number(ym.slice(5, 7)) - 1].slice(0, 3)].some(m => contains(text, `${m} ${ym.slice(0, 4)}`));

const { internal, external } = discover(dist);
const reachable = [...internal.keys()];
const texts = new Map();
for (const pathname of reachable) {
  let file = path.join(dist, decodeURIComponent(pathname));
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file)) continue;
  if (file.endsWith(".html")) texts.set(pathname, readPage(file).text);
  else if (/\.(txt|json)$/.test(file)) texts.set(pathname, fs.readFileSync(file, "utf8"));
}
const corpus = [...texts.values()].join("\n");
const home = readPage(path.join(dist, "index.html"));
const person = home.graph.find(node => node["@type"] === "Person") ?? {};
const ratio = (found, total) => ({ found, total, percent: total ? Math.round((found / total) * 100) : 0 });
const count = (items, test) => ratio(items.filter(test).length, items.length);

const mergedPrs = canonical.openSourceContributions.filter(pr => pr.status === "merged");
const homepageOssCounts = canonical.openSourceSummary.mergedRepositories
  .map(repo => {
    const shown = home.text.match(new RegExp(`${repo.repository.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")} · (\\d+) merged`, "i"));
    return shown ? { repo: repo.repository, shown: Number(shown[1]), verified: repo.merged } : null;
  })
  .filter(Boolean);
const symbiosis = fs.readFileSync(path.join(dist, "experience/symbiosis-university/index.html"), "utf8");
const counter = home.source.match(/id="total-count" data-carousel-total>(\d+)</)?.[1];

const report = {
  dist,
  crawl: {
    pagesReachableByLinks: reachable.length,
    clicksToProfilePage: internal.get("/profile/") ?? null,
    clicksToJsonApi: internal.get("/api/profile.json") ?? null,
    clicksToResume: internal.get("/Atishay-Kasliwal-Resume.pdf") ?? null,
    clicksToLlmsTxt: internal.get("/llms.txt") ?? null,
    structuredProfileApi: fs.existsSync(path.join(dist, "api/profile.json")),
  },
  homepageRawHtml: {
    profileLink: home.links.some(link => link.href === "/profile/"),
    jsonAlternate: home.alternates.some(link => link.type === "application/json"),
    // Repositories with merged work whose project name is in the homepage's text (cards or captions).
    openSourceProjectsInHtml: count(canonical.openSourceSummary.mergedRepositories, repo => contains(home.text, repo.projectName)),
    workCounterShows: counter,
    projectsListed: canonical.projects.length,
    personAlumniOf: [].concat(person.alumniOf ?? []).length,
    personCredentials: [].concat(person.hasCredential ?? []).length,
    personKnowsAbout: (person.knowsAbout ?? []).length,
  },
  coverage: {
    experienceTitleAndDates: count(canonical.experience, role => contains(corpus, role.title) && hasMonth(corpus, role.startDate) && (!role.endDate || hasMonth(corpus, role.endDate))),
    educationDegrees: count(canonical.education, item => contains(corpus, item.credential)),
    // The name plus either the card summary or the case study's opening paragraph.
    projectNamesAndSummaries: count(canonical.projects, project => contains(corpus, project.name) && (contains(corpus, project.summary) || contains(corpus, project.description))),
    projectMetrics: count(canonical.projects.flatMap(p => p.metrics), metric => contains(corpus, metric.value)),
    skillsWithEvidenceLinks: ratio(texts.has("/api/profile.json") || texts.has("/profile/") ? canonical.skills.length : 0, canonical.skills.length),
    professionalStrengthsWithEvidence: ratio(texts.has("/profile/") ? canonical.professionalStrengths.length : 0, canonical.professionalStrengths.length),
    mergedPullRequestLinks: count(mergedPrs, pr => external.has(pr.url)),
    verificationStatusExposed: corpus.includes("self_reported") || corpus.includes("Self-reported"),
  },
  consistency: {
    homepageOpenSourceCountsMatchingGitHub: ratio(homepageOssCounts.filter(c => c.shown === c.verified).length, homepageOssCounts.length),
    homepageOpenSourceCountMismatches: homepageOssCounts.filter(c => c.shown !== c.verified),
    workCounterCorrect: counter === String(canonical.projects.length),
    symbiosisChronologyContradiction: /before the first engineering internship/.test(symbiosis),
    llmsOpenSourceSectionGenerated: fs.readFileSync(path.join(dist, "llms.txt"), "utf8").includes("profile:open-source:start"),
  },
};

if (asJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`Extraction report for ${dist}`);
  for (const [group, values] of Object.entries(report)) {
    if (typeof values !== "object") continue;
    console.log(`\n${group}`);
    for (const [key, value] of Object.entries(values)) {
      const shown = value && typeof value === "object" && "percent" in value ? `${value.found}/${value.total} (${value.percent}%)` : JSON.stringify(value);
      console.log(`  ${key}: ${shown}`);
    }
  }
}
