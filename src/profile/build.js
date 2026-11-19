// Builds the canonical public professional profile: one object, generated from the site's
// existing content modules, that /profile, /api/profile.json, the Person structured data and the
// llms.txt open source section are all rendered from. Nothing in here is a second copy of a fact:
// projects come from src/case-studies/data.js and src/projects.js, work and education from
// src/experience.js and src/experience-pages.js, open source from the verified GitHub snapshot,
// and the rest from ./data.js. See docs/profile-architecture.md.
//
// Pure and deterministic: the same sources always give the same JSON (no build timestamps).
import { caseStudies, staticPageLastModified } from "../case-studies/data.js";
import { projects as projectCards } from "../projects.js";
import { experience as experienceCards } from "../experience.js";
import { experiencePages } from "../experience-pages.js";
import { openSource as openSourceCards } from "../open-source.js";
import { volunteer, events } from "../volunteer.js";
import { profileLinks } from "../profile-links.js";
import contributions from "./open-source-contributions.json" with { type: "json" };
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { RESUME_URL, versionIdOf } from "../resume-core/constants.js";
import {
  PROFILE_LAST_MODIFIED,
  PROFILE_SCHEMA_VERSION,
  contributionSkills,
  experienceDetails,
  identity,
  professionalStrengths,
  repositories,
  repositoryCheckableStats,
  skillCategories,
  skills as skillDefinitions,
  specializations as specializationDefinitions,
  strengthCategories,
} from "./data.js";

export const SITE = "https://atishaykasliwal.com";
export const PERSON_ID = `${SITE}/#person`;
export const PROFILE_PAGE = `${SITE}/profile/`;
export const PROFILE_API = `${SITE}/api/profile.json`;
export const PROFILE_SCHEMA = `${SITE}/api/profile.schema.json`;
export { RESUME_URL };

// The résumé bundled with this build (public/Atishay-Kasliwal-Resume.pdf). A version published
// later from /admin/resume replaces this reference at request time (src/resume-core/overlay.js).
function bundledResumeVersion() {
  const sha256 = createHash("sha256").update(readFileSync(new URL("../../public/Atishay-Kasliwal-Resume.pdf", import.meta.url))).digest("hex");
  return { id: versionIdOf(sha256), sha256, publishedAt: null, source: "bundled" };
}

export const VERIFICATION_STATUSES = {
  verified:
    "Checked against the primary public source when the data was generated, e.g. GitHub reporting a pull request as merged.",
  publicly_verifiable:
    "Linked to a public artifact (source repository, merged pull request, public review or live product) where a third party can inspect it. Not an audit of quality or proficiency.",
  self_reported:
    "Stated by the candidate on this site or the résumé, with no public artifact a third party can inspect (e.g. employer work).",
  needs_review:
    "Sources disagree or the value is unconfirmed; not presented as an established fact.",
};

const strip = html => String(html ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const MONTHS = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" };
const month = text => {
  const match = /^([A-Za-z]{3})[a-z]*\.?\s+(\d{4})$/.exec(String(text).trim());
  if (!match) return null;
  return `${match[2]}-${MONTHS[match[1].toLowerCase()]}`;
};
const host = url => new URL(url).hostname;
const isGithub = url => host(url) === "github.com";
const repoOf = url => new URL(url).pathname.replace(/^\/|\/$/g, "");
const latest = dates => dates.filter(Boolean).map(d => d.slice(0, 10)).sort().at(-1);
const PROFILE_LABELS = {
  "github.com": "GitHub",
  "www.linkedin.com": "LinkedIn",
  "www.instagram.com": "Instagram",
  "x.com": "X",
  "www.threads.net": "Threads",
  "www.facebook.com": "Facebook",
};
const RANK = { verified: 3, publicly_verifiable: 2, self_reported: 1, needs_review: 0 };
const best = statuses => statuses.reduce((a, b) => (RANK[b] > RANK[a] ? b : a), "needs_review");

function changeKind(title) {
  const prefix = /^(feat|fix|docs?|test|TST|ci|chore|refactor|perf|example)\b/i.exec(title)?.[1]?.toLowerCase();
  return { feat: "feature", fix: "fix", doc: "documentation", docs: "documentation", test: "test", tst: "test", ci: "ci", chore: "maintenance", refactor: "refactor", perf: "performance", example: "documentation" }[prefix] ?? null;
}

// `onWarning` receives problems that must not block a deploy (the deploy refreshes the open source
// snapshot, so new upstream work can arrive before data.js knows about it). npm test fails on them.
export function buildProfile({ onWarning = message => console.warn(`[profile] ${message}`) } = {}) {
  const evidence = new Map();
  const addEvidence = item => {
    if (!evidence.has(item.id)) evidence.set(item.id, item);
    return item.id;
  };

  // ---------- Open source (verified snapshot) ----------
  const prs = contributions.pullRequests;
  const merged = prs.filter(pr => pr.state === "merged");
  const mergedByRepo = new Map();
  for (const pr of merged) {
    if (!mergedByRepo.has(pr.repository)) mergedByRepo.set(pr.repository, []);
    mergedByRepo.get(pr.repository).push(pr);
    addEvidence({
      id: `pr:${pr.repository}#${pr.number}`,
      type: "pull_request",
      title: `${pr.repository}#${pr.number}: ${pr.title}`,
      url: pr.url,
      publiclyAccessible: true,
      verificationStatus: "verified",
      date: pr.mergedAt.slice(0, 10),
    });
  }
  const searchUrl = repo =>
    `https://github.com/${repo}/pulls?q=${encodeURIComponent(`is:pr is:merged author:${contributions.login}`)}`;
  addEvidence({
    id: "reviews:github",
    type: "pull_request_reviews",
    title: `${contributions.reviews.length} reviews of other contributors' pull requests`,
    url: `https://github.com/pulls?q=${encodeURIComponent(`is:pr reviewed-by:${contributions.login} -author:${contributions.login}`)}`,
    publiclyAccessible: true,
    verificationStatus: "verified",
  });
  addEvidence({
    id: "document:resume",
    type: "document",
    title: "Résumé (PDF)",
    url: RESUME_URL,
    publiclyAccessible: true,
    verificationStatus: "self_reported",
    date: staticPageLastModified.resume,
  });
  for (const [id, repo] of Object.entries(repositories)) {
    addEvidence({ id: `repository:${id}`, type: "repository", title: repo.title, url: repo.url, publiclyAccessible: true, verificationStatus: "publicly_verifiable" });
  }

  // ---------- Projects ----------
  const cardsByName = new Map(projectCards.map(card => [card.name, card]));
  const projectRecords = caseStudies
    .slice()
    .sort((a, b) => projectCards.findIndex(c => c.name === a.name) - projectCards.findIndex(c => c.name === b.name))
    .map(study => {
      const card = cardsByName.get(study.name);
      if (!card) throw new Error(`Profile: no homepage card for project ${study.name}`);
      const caseStudyUrl = `${SITE}/projects/${study.slug}/`;
      const repository = study.links.find(link => isGithub(link.href))?.href ?? null;
      const liveSite = study.live ? study.links.find(link => !isGithub(link.href))?.href ?? null : null;
      const status = card.tag === "LIVE" ? "live" : card.tag === "POC" ? "proof_of_concept" : card.tag === "PROFILE" ? "profile" : "open_source";
      const ids = [
        addEvidence({ id: `case-study:${study.slug}`, type: "case_study", title: `${study.name} case study`, url: caseStudyUrl, publiclyAccessible: true, verificationStatus: "self_reported", date: study.lastModified }),
      ];
      if (repository) ids.push(addEvidence({ id: `repo:${repoOf(repository)}`, type: "repository", title: `${repoOf(repository)} source code`, url: repository, publiclyAccessible: true, verificationStatus: "publicly_verifiable" }));
      if (liveSite) ids.push(addEvidence({ id: `live:${host(liveSite)}`, type: "live_product", title: `${study.name}, live`, url: liveSite, publiclyAccessible: true, verificationStatus: "publicly_verifiable" }));
      const checkable = new Set(repository ? repositoryCheckableStats[study.slug] ?? [] : []);
      const stack = study.spec.find(row => row.label === "Stack");
      const technologies = (stack ? strip(stack.html) : card.stack).split("·").map(item => item.trim()).filter(Boolean);
      return {
        id: study.slug,
        name: study.name,
        status,
        category: card.category,
        startedOn: study.started ?? null,
        summary: card.description,
        description: study.lede,
        problem: study.problem ? { title: study.problem.title, detail: study.problem.body } : null,
        solution: study.solution ? { title: study.solution.title, detail: study.solution.body } : null,
        architecture: study.engineering
          ? { components: study.engineering.nodes.flat().map(node => ({ name: node.name, detail: node.detail })), note: study.engineering.note ?? null }
          : null,
        technicalDecisions: (study.decisions ?? []).map(strip),
        engineeringChallenge: study.note ? { title: `${study.note.strong} ${study.note.soft}`, detail: study.note.body } : null,
        // A personal profile page (Beyond the Resume) restates the experience section in prose, and
        // its Shriffle figure is under review (src/profile/review.js: shriffle-volume), so only its
        // summary enters the canonical profile.
        highlights: status === "profile" ? [] : (study.sections ?? []).map(section => ({ title: section.title, detail: section.body })),
        technologies,
        metrics: study.stats.map(stat => {
          const publicStat = checkable.has(stat.value);
          return {
            value: stat.value,
            label: stat.label,
            verificationStatus: publicStat ? "publicly_verifiable" : "self_reported",
            evidence: publicStat ? [`repo:${repoOf(repository)}`] : [`case-study:${study.slug}`],
          };
        }),
        links: { caseStudy: caseStudyUrl, repository, liveSite },
        repositoryVisibility: repository ? "public" : study.slug === "medscan" ? "private" : "not_linked",
        skills: [],
        evidence: ids,
        dateModified: study.lastModified,
      };
    });
  const projectsById = new Map(projectRecords.map(project => [project.id, project]));

  // ---------- Experience and education ----------
  const pagesBySlug = new Map(experiencePages.map(page => [page.slug, page]));
  const work = [];
  const education = [];
  for (const card of experienceCards) {
    const page = pagesBySlug.get(card.slug);
    if (!page) throw new Error(`Profile: no experience page for ${card.slug}`);
    const details = experienceDetails[card.slug] ?? {};
    const startDate = month(card.start);
    const endDate = /present/i.test(card.end) ? null : month(card.end);
    if (!startDate || (!endDate && !/present/i.test(card.end))) throw new Error(`Profile: unreadable dates for ${card.slug}`);
    const isEducation = card.tag === "EDU";
    const url = `${SITE}/experience/${card.slug}/`;
    const evidenceId = addEvidence({
      id: `${isEducation ? "education" : "experience"}:${card.slug}`,
      type: isEducation ? "education_page" : "experience_page",
      title: `${card.role}, ${card.place}`,
      url,
      publiclyAccessible: true,
      verificationStatus: "self_reported",
      date: page.lastModified,
    });
    const common = {
      id: card.slug,
      // The name the site shows; a fuller formal name and other names it is known by follow it.
      organization: (() => {
        const alternateNames = [...new Set([details.organization, ...(details.alternateNames ?? [])].filter(name => name && name !== card.place))];
        return { name: card.place, ...(alternateNames.length ? { alternateNames } : {}), ...(details.organizationUrl ? { url: details.organizationUrl } : {}) };
      })(),
      location: details.location ?? null,
      startDate,
      endDate,
      current: endDate === null,
      summary: card.description,
      description: page.lede,
      highlights: page.sections.map(section => ({ title: section.title, detail: section.body })),
      metrics: page.stats.map(stat => ({ value: stat.value, label: stat.label, verificationStatus: "self_reported", evidence: [evidenceId] })),
      url,
      skills: [],
      evidence: [evidenceId],
      dateModified: page.lastModified,
    };
    if (isEducation) {
      education.push({ ...common, institution: common.organization, degree: details.degree ?? card.role, field: details.field ?? null, credential: card.role });
    } else {
      work.push({ ...common, title: card.role, ...(details.employmentType ? { employmentType: details.employmentType } : {}) });
    }
  }
  // Undergraduate start month is unconfirmed (src/profile/review.js: symbiosis-start-month).
  const symbiosis = education.find(item => item.id === "symbiosis-university");
  if (symbiosis) symbiosis.startDate = symbiosis.startDate.slice(0, 4);
  for (const item of education) {
    delete item.organization;
  }
  const experienceById = new Map([...work, ...education].map(item => [item.id, item]));

  // ---------- Evidence references: "<kind>:<id>" -> subject + evidence ids + status ----------
  function resolve(ref) {
    const [kind, ...rest] = ref.split(":");
    const id = rest.join(":");
    if (kind === "project") {
      const project = projectsById.get(id);
      if (!project) throw new Error(`Profile: unknown project ${ref}`);
      const hasPublicSource = Boolean(project.links.repository);
      return {
        subject: { type: "project", id, name: project.name, url: project.links.caseStudy },
        evidence: project.evidence,
        status: hasPublicSource ? "publicly_verifiable" : "self_reported",
      };
    }
    if (kind === "experience" || kind === "education") {
      const item = experienceById.get(id);
      if (!item) throw new Error(`Profile: unknown ${kind} ${ref}`);
      const name = kind === "education" ? `${item.credential}, ${item.institution.name}` : `${item.title}, ${item.organization.name}`;
      return { subject: { type: kind, id, name, url: item.url }, evidence: [`${kind}:${id}`], status: "self_reported" };
    }
    if (kind === "contributions") {
      const list = mergedByRepo.get(id);
      if (!list?.length) throw new Error(`Profile: ${ref} has no merged pull requests in the verified snapshot`);
      const evidenceId = addEvidence({
        id: `contributions:${id}`,
        type: "merged_pull_requests",
        title: `${list.length} merged pull request${list.length === 1 ? "" : "s"} in ${id}`,
        url: searchUrl(id),
        publiclyAccessible: true,
        verificationStatus: "verified",
        pullRequests: list.map(pr => `pr:${pr.repository}#${pr.number}`),
      });
      return {
        subject: { type: "open_source_repository", id, name: id, url: searchUrl(id) },
        evidence: [evidenceId],
        status: "publicly_verifiable",
      };
    }
    if (kind === "reviews") return { subject: { type: "code_reviews", id: "github", name: "Public code reviews on GitHub", url: evidence.get("reviews:github").url }, evidence: ["reviews:github"], status: "publicly_verifiable" };
    if (kind === "resume") return { subject: { type: "document", id: "resume", name: "Résumé", url: RESUME_URL }, evidence: ["document:resume"], status: "self_reported" };
    if (kind === "repository") {
      if (!repositories[id]) throw new Error(`Profile: unknown repository ${ref}`);
      return { subject: { type: "repository", id, name: repositories[id].title, url: repositories[id].url }, evidence: [`repository:${id}`], status: "publicly_verifiable" };
    }
    throw new Error(`Profile: unknown evidence ref ${ref}`);
  }

  // ---------- Skills: Skill -> project/experience -> implementation -> evidence ----------
  const categoryIds = new Set(skillCategories.map(category => category.id));
  const skillIds = new Set();
  const skillRecords = skillDefinitions.map(skill => {
    if (skillIds.has(skill.id)) throw new Error(`Profile: duplicate skill id ${skill.id}`);
    skillIds.add(skill.id);
    if (!categoryIds.has(skill.category)) throw new Error(`Profile: ${skill.id} has unknown category ${skill.category}`);
    if (!skill.evidence.length) throw new Error(`Profile: skill ${skill.id} has no evidence`);
    const usedIn = skill.evidence.map(({ ref, note }) => {
      const resolved = resolve(ref);
      return { ...resolved.subject, implementation: note, evidence: resolved.evidence, verificationStatus: resolved.status };
    });
    return { id: skill.id, name: skill.name, category: skill.category, verificationStatus: best(usedIn.map(use => use.verificationStatus)), usedIn };
  });
  for (const skill of skillRecords) {
    for (const use of skill.usedIn) {
      const target = use.type === "project" ? projectsById.get(use.id) : ["experience", "education"].includes(use.type) ? experienceById.get(use.id) : null;
      if (target && !target.skills.includes(skill.id)) target.skills.push(skill.id);
    }
  }
  for (const [repo, ids] of Object.entries(contributionSkills)) {
    for (const id of ids) if (!skillIds.has(id)) throw new Error(`Profile: contributionSkills ${repo} names unknown skill ${id}`);
  }
  for (const repo of mergedByRepo.keys()) {
    if (!(repo in contributionSkills)) onWarning(`merged work in ${repo} has no entry in contributionSkills (src/profile/data.js)`);
  }

  // ---------- Professional strengths ----------
  const strengthRecords = professionalStrengths.map(strength => {
    if (!strengthCategories.includes(strength.category)) throw new Error(`Profile: strength ${strength.id} has unknown category`);
    if (!strength.examples.length) throw new Error(`Profile: strength ${strength.id} has no evidence; list it in UNSUPPORTED_STRENGTHS instead`);
    const examples = strength.examples.map(({ ref, note }) => {
      const resolved = resolve(ref);
      return { ...resolved.subject, example: note, evidence: resolved.evidence, verificationStatus: resolved.status };
    });
    return {
      id: strength.id,
      name: strength.name,
      category: strength.category,
      description: strength.description,
      verificationStatus: best(examples.map(example => example.verificationStatus)),
      examples,
      evidence: [...new Set(examples.flatMap(example => example.evidence))],
    };
  });

  // ---------- Open source records ----------
  const cardsByRepo = new Map(openSourceCards.map(card => [new URL(card.url).pathname.split("/").slice(1, 3).join("/"), card]));
  const openSourceContributions = prs.map(pr => ({
    id: `${pr.repository}#${pr.number}`,
    type: "pull_request",
    organization: pr.repository.split("/")[0],
    repository: pr.repository,
    repositoryUrl: `https://github.com/${pr.repository}`,
    number: pr.number,
    title: pr.title,
    url: pr.url,
    status: pr.state === "closed" ? "closed_unmerged" : pr.state,
    draft: pr.draft,
    changeKind: changeKind(pr.title),
    openedAt: pr.createdAt,
    mergedAt: pr.mergedAt,
    closedAt: pr.closedAt,
    skills: pr.state === "merged" ? contributionSkills[pr.repository] ?? [] : [],
    verificationStatus: "verified",
    evidence: pr.state === "merged" ? [`pr:${pr.repository}#${pr.number}`] : [],
  }));
  const repositorySummaries = [...mergedByRepo.entries()]
    .map(([repo, list]) => ({
      repository: repo,
      projectName: cardsByRepo.get(repo)?.name ?? repo.split("/")[1],
      projectDescription: cardsByRepo.get(repo)?.description.replace(/ Featured: .*$/, "") ?? null,
      merged: list.length,
      mergedPullRequestsUrl: searchUrl(repo),
      latestMergedAt: latest(list.map(pr => pr.mergedAt)),
      skills: contributionSkills[repo] ?? [],
    }))
    .sort((a, b) => b.merged - a.merged || a.repository.localeCompare(b.repository));
  const count = state => prs.filter(pr => pr.state === state).length;
  const openSourceSummary = {
    verifiedAt: contributions.verifiedAt,
    source: contributions.source,
    pullRequests: { total: prs.length, merged: count("merged"), open: count("open"), closedUnmerged: count("closed") },
    mergedRepositories: repositorySummaries,
    reviewsGiven: contributions.reviews.length,
    note: "Open source work is contribution to projects run by other teams, not employment by those organizations.",
  };
  const openSourceReviews = contributions.reviews.map(review => ({
    id: `${review.repository}#${review.number}`,
    repository: review.repository,
    number: review.number,
    title: review.title,
    url: review.url,
    pullRequestAuthor: review.author,
    pullRequestStatus: review.state === "closed" ? "closed_unmerged" : review.state,
    verificationStatus: "verified",
  }));

  // ---------- Specializations ----------
  const specializationRecords = specializationDefinitions.map(item => {
    const resolved = item.evidence.map(resolve);
    return {
      id: item.id,
      name: item.name,
      summary: item.summary,
      verificationStatus: best(resolved.map(r => r.status)),
      supportedBy: resolved.map(r => r.subject),
    };
  });

  // ---------- Achievements and community ----------
  const liveProjects = projectRecords.filter(project => project.status === "live");
  const msDegree = education.find(item => item.id === "stony-brook-university");
  const achievements = [
    {
      id: "open-source-merged-pull-requests",
      title: `${openSourceSummary.pullRequests.merged} pull requests merged into ${mergedByRepo.size} open source repositories run by other teams`,
      date: latest(merged.map(pr => pr.mergedAt)),
      verificationStatus: "verified",
      evidence: merged.map(pr => `pr:${pr.repository}#${pr.number}`),
    },
    {
      id: "live-products",
      title: `${liveProjects.length} live products: ${liveProjects.map(project => project.name).join(", ")}`,
      date: null,
      verificationStatus: "publicly_verifiable",
      evidence: liveProjects.flatMap(project => project.evidence.filter(id => id.startsWith("live:"))),
    },
    msDegree && {
      id: "ms-data-science",
      title: `M.S. in Data Science, Stony Brook University (${msDegree.endDate.slice(0, 4)})`,
      date: msDegree.endDate,
      verificationStatus: "self_reported",
      evidence: msDegree.evidence,
    },
  ].filter(Boolean);
  const community = [...volunteer, ...events].map(item => ({
    name: item.name,
    role: item.tag.charAt(0) + item.tag.slice(1).toLowerCase(),
    context: item.category,
    year: item.year ?? null,
    description: item.description,
    verificationStatus: "self_reported",
  }));

  // ---------- Profile ----------
  const profile = {
    id: identity.id,
    name: identity.name,
    givenName: identity.givenName,
    familyName: identity.familyName,
    headline: identity.headline,
    tagline: identity.tagline,
    description: identity.description,
    summary: identity.summary,
    location: identity.location,
    openToWork: identity.openToWork,
    currentFocus: identity.currentFocus,
    contact: identity.contact,
    profiles: profileLinks.map(url => ({ network: PROFILE_LABELS[host(url)] ?? host(url), url })),
    resume: { url: RESUME_URL, format: "application/pdf", lastModified: staticPageLastModified.resume, version: bundledResumeVersion() },
    specializations: specializationRecords,
    urls: { homepage: `${SITE}/`, profilePage: PROFILE_PAGE, api: PROFILE_API, schema: PROFILE_SCHEMA, llmsTxt: `${SITE}/llms.txt` },
  };

  const lastUpdated = latest([
    PROFILE_LAST_MODIFIED,
    staticPageLastModified.resume,
    ...caseStudies.map(study => study.lastModified),
    ...experiencePages.map(page => page.lastModified),
    ...prs.flatMap(pr => [pr.createdAt, pr.mergedAt, pr.closedAt]),
  ]);

  return {
    $schema: PROFILE_SCHEMA,
    schemaVersion: PROFILE_SCHEMA_VERSION,
    lastUpdated,
    canonicalUrl: PROFILE_API,
    humanReadableUrl: PROFILE_PAGE,
    verificationStatuses: VERIFICATION_STATUSES,
    // Most useful first: tools that truncate long responses still get the core profile.
    profile,
    experience: work,
    education,
    skillCategories,
    skills: skillRecords,
    professionalStrengths: strengthRecords,
    projects: projectRecords,
    achievements,
    openSourceSummary,
    community,
    openSourceContributions,
    openSourceReviews,
    evidence: [...evidence.values()].sort((a, b) => a.id.localeCompare(b.id)),
  };
}

// schema.org Person for the homepage, /profile and the Beyond the Resume page, from the same data.
export function personJsonLd(profile, { mainEntityOfPage } = {}) {
  const education = profile.education;
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: profile.profile.name,
    givenName: profile.profile.givenName,
    familyName: profile.profile.familyName,
    url: `${SITE}/`,
    ...(mainEntityOfPage ? { mainEntityOfPage: { "@id": mainEntityOfPage } } : {}),
    image: [`${SITE}/atishay-kasliwal-1x1.jpg`, `${SITE}/atishay-kasliwal-4x3.jpg`, `${SITE}/atishay-kasliwal-16x9.jpg`],
    jobTitle: profile.profile.headline,
    description: profile.profile.description,
    email: `mailto:${profile.profile.contact.email}`,
    address: { "@type": "PostalAddress", addressLocality: profile.profile.location.locality, addressRegion: profile.profile.location.region, addressCountry: profile.profile.location.country },
    alumniOf: education.map(item => ({
      "@type": "CollegeOrUniversity",
      name: item.institution.alternateNames?.[0] ?? item.institution.name,
      ...(item.institution.alternateNames ? { alternateName: item.institution.name } : {}),
      ...(item.institution.url ? { url: item.institution.url } : {}),
    })),
    hasCredential: education.map(item => ({
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "degree",
      name: `${item.degree} in ${item.field}`,
      recognizedBy: { "@type": "CollegeOrUniversity", name: item.institution.alternateNames?.[0] ?? item.institution.name },
    })),
    worksFor: { "@type": "Organization", name: "Atriveo", url: "https://atriveo.com" },
    knowsAbout: [...specializationsNames(profile), ...profile.skills.map(skill => skill.name)],
    sameAs: profile.profile.profiles.map(link => link.url),
    subjectOf: { "@type": "WebPage", url: PROFILE_PAGE, name: "Full professional profile" },
  };
}

function specializationsNames(profile) {
  return profile.profile.specializations.map(item => item.name);
}
