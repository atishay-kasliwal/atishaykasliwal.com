// Facts that disagree between public representations (site pages, the résumé PDF, llms.txt,
// structured data, project READMEs). Internal: used by scripts/validate-profile.mjs and
// docs/profile-architecture.md, never published in /api/profile.json.
//
// mustNotAppear: phrases the canonical profile (JSON and /profile) must never contain while the
// item stands; scripts/validate-profile.mjs enforces them.
//
// status:
//   resolved      Evidence settles it; the canonical profile uses the settled value.
//   needs_review  Evidence does not settle it. The canonical profile publishes only what every
//                 source agrees on (or leaves the value out), and a person must decide.
//
// "Achievement bank" is the user-confirmed fact file Atishay maintains for résumé generation
// (atriveo-app data/ac-bank/AUTHORITATIVE-FACTS.yaml and the role files beside it). The site's
// experience pages were aligned with it on 2026-11-12 (commit aeef323).

export const reviewItems = [
  {
    id: "stony-brook-research-end-date",
    field: "experience.stony-brook-research.endDate",
    values: { site: "May 2026", resumePdf: "Present", achievementBank: "November 2024 -- May 2026", user: "May 2026 (final, confirmed 2026-11-19)" },
    status: "resolved",
    canonical: "2026-05",
    resolution: "Atishay confirmed May 2026 as the final end date on 2026-11-19, matching the achievement bank and every site page. The public résumé PDF is older and still says Present; /admin/resume flags it on any upload that does.",
    action: "Publish a regenerated résumé that says November 2024 – May 2026 from /admin/resume.",
  },
  {
    id: "wake-forest-cair-title",
    field: "experience.wake-forest-cair.title",
    values: { site: "AI/ML Engineer", resumePdf: "Software Engineer Intern", achievementBank: "Software Engineer (before 2026-11-19)", user: "AI/ML Engineer (final, confirmed 2026-11-19)" },
    status: "resolved",
    canonical: "AI/ML Engineer",
    resolution: "Atishay set the title to AI/ML Engineer on 2026-11-19, replacing both the achievement bank's 'Software Engineer' and the PDF's 'Software Engineer Intern'. No employment type is recorded.",
    action: "Publish a regenerated résumé that says AI/ML Engineer from /admin/resume.",
  },
  {
    id: "symbiosis-start-month",
    field: "education.symbiosis-university.startDate",
    values: { site: "May 2018", resumePdf: "Aug. 2018", resumeEngine: "Aug. 2018" },
    status: "needs_review",
    canonical: "2018",
    resolution: "No user-confirmed source. The profile publishes the year only.",
    action: "Confirm the start month, then update src/experience.js, src/experience-pages.js and the résumé to match.",
  },
  {
    id: "symbiosis-graduated-before-shriffle",
    field: "experience-pages.symbiosis-university.sections[Finished first]",
    values: { site: "Graduated in 2022, before the first engineering internship at Shriffle even started.", dates: "Shriffle Aug 2020 – May 2021; degree to May 2022 (site and résumé agree)" },
    status: "resolved",
    canonical: "The Shriffle internship ran during the degree.",
    resolution: "Every published date contradicts the sentence, so the section now states the overlap instead.",
    mustNotAppear: ["before the first engineering internship"],
    action: null,
  },
  {
    id: "experience-duration",
    field: "profile.headline years",
    values: { site: "5+ years in production", computed: "≈63 months from Aug 2020 counting the Shriffle internship and treating the Wake Forest overlap once; ≈54 months without the internship" },
    status: "needs_review",
    canonical: null,
    resolution: "'5+ years' holds only if the 2020–21 internship counts. The canonical profile publishes dated roles and no year count; the homepage wording is unchanged.",
    action: "Decide whether to keep '5+ years' or say 'since 2020'.",
    mustNotAppear: ["5+ years", "five years"],
  },
  {
    id: "accolite-merger-year",
    field: "experience.accolite.organization",
    values: { site: "became part of Bounteous in 2021; lede says 'partway through'", achievementBank: "Bounteous x Accolite branding following the merger (no year)" },
    status: "needs_review",
    canonical: "Accolite, alternate names Accolite Digital and Bounteous x Accolite; no merger year",
    resolution: "The merger year is not confirmed by any source in the repository or the bank.",
    action: "Confirm the year Accolite joined Bounteous and fix the Accolite page spec line if 2021 is wrong.",
    mustNotAppear: ["Bounteous in 2021"],
  },
  {
    id: "accolite-p99-mechanism",
    field: "experience.accolite P99 latency 40%",
    values: { site: "tuning TCP connection handling, adding circuit breakers and rate limiting", resumePdf: "rearchitecting Redis caching and Elasticsearch layers" },
    status: "needs_review",
    canonical: "Site wording, which the profile reads from src/experience-pages.js",
    resolution: "Same metric, two different mechanisms. Both may be true; neither source says so.",
    action: "Confirm which change produced the 40% P99 reduction.",
  },
  {
    id: "stony-brook-users",
    field: "experience.stony-brook-research users",
    values: { site: "~1,000 daily platform users (earlier 200+)", resumePdf: "2,000+ users of the FOMC platform", achievementBank: "approximately 1,000 current daily users (USER_CONFIRMED)" },
    status: "resolved",
    canonical: "~1,000 daily platform users",
    resolution: "User-confirmed in the achievement bank. The PDF's 2,000+ is not repeated.",
    action: "Regenerate the résumé PDF.",
    mustNotAppear: ["2,000+ users"],
  },
  {
    id: "wake-forest-scale",
    field: "experience.wake-forest-cair scale",
    values: { site: "10K+ MRI studies; 20-person physician-research team", resumePdf: "10,000+ patient cases; 8 radiologists; 50K+ scans" },
    status: "resolved",
    canonical: "10K+ MRI studies; 20-person physician-research team",
    resolution: "50K+ scans was dropped as unconfirmed (commit aeef323). '8 radiologists' may describe dashboard users rather than the team; it is not repeated.",
    action: "Regenerate the résumé PDF.",
    mustNotAppear: ["50K+", "8 radiologists"],
  },
  {
    id: "atriveo-usage-metrics",
    field: "projects.atriveo-tracker usage",
    values: {
      caseStudy: "1,000+ applications tracked (README)",
      llmsTxt: "1,000+ active users and 2K+ daily queries at 99.9% uptime; 5.0-star extension; 20+ ATS platforms; 1K+ postings a day, 75% filtered",
      resumePdf: "1,000+ active users at 2K+ daily queries",
      achievementBank: "1K users over a year (the older '1K+ daily' is superseded); 50K+ applications tracked in a year; 2K+ daily queries; 5.0 stars",
      user: "Keep the résumé and llms.txt figures (confirmed 2026-11-19)",
    },
    status: "resolved",
    canonical: "1,000+ active users, 2K+ daily queries, 5.0-star Chrome Web Store rating (case study lede, self-reported)",
    resolution: "Atishay confirmed on 2026-11-19 that the published figures stand. The achievement bank backs each one: 1K users over a year, 2K+ daily queries and a 5.0-star rating (ATRIVEO.yaml), and ~75% of listings filtered (JOB-PIPELINE.yaml). The case study's 1,000+ applications tracked is a separate quantity and stays as its own stat.",
    action: null,
  },
  {
    id: "tracker-site-count",
    field: "projects.atriveo-tracker job sites",
    values: { caseStudy: "60 job sites (detector.js: 25 platforms + 35 career sites); 7 extension releases", llmsTxt: "20+ ATS platforms", readme: "20+ ATS; 6 releases" },
    status: "needs_review",
    canonical: "Case study value (60), traced to detector.js",
    resolution: "Different counting units (ATS platforms vs all recognised sites). Kept the case study's code-traced figure.",
    action: "Align the README and llms.txt wording.",
  },
  {
    id: "shriffle-volume",
    field: "experience.shriffle volume",
    values: { experiencePage: "$50,000 in daily revenue", beyondTheResume: "10,000+ daily transactions" },
    status: "needs_review",
    canonical: "$50K daily revenue (experience page)",
    resolution: "Different quantities; 10,000+ daily transactions appears nowhere else.",
    action: "Confirm or remove the 10,000+ figure on /projects/developer-profile/.",
    mustNotAppear: ["10,000+ daily transactions"],
  },
  {
    id: "fedtalk-accuracy-scopes",
    field: "projects.fedtalk accuracy",
    values: { caseStudy: "58.7% directional accuracy (repository labeled positive set)", experiencePage: "~68% directional accuracy, 13 FOMC sessions (earlier evaluation); 80.8% sentiment on 1,159 intervals" },
    status: "resolved",
    canonical: "Each number kept with its own evaluation",
    resolution: "Different evaluations, as the achievement bank records; not a conflict once scoped. The profile never merges them.",
    action: null,
  },
  {
    id: "open-source-counts",
    field: "open source merged counts",
    values: { homepageCards: "hand-written counts (e.g. Aura 9, Numaflow 4, NVKR 5)", llmsTxt: "same hand-written counts", github: "verified snapshot in src/profile/open-source-contributions.json" },
    status: "resolved",
    canonical: "Counts derived from the verified GitHub snapshot",
    resolution: "src/open-source.js and the llms.txt open source section now read the snapshot, so they cannot drift.",
    action: null,
  },
  {
    id: "atriveo-employment",
    field: "Person.worksFor Atriveo",
    values: { homepageSchema: "worksFor Atriveo", visibleText: "Now building Atriveo" },
    status: "needs_review",
    canonical: "currentFocus: Building Atriveo; Person schema keeps worksFor",
    resolution: "The audit noted worksFor can read as formal employment. Kept as published; the visible wording is 'building'.",
    action: "Decide whether Atriveo should stay as worksFor in structured data.",
  },
];
