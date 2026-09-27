// Case studies, one per carousel project, rendered to projects/<slug>/index.html by
// scripts/build-case-studies.mjs. Every claim here should trace back to the project's repo,
// README or git history; comments note the source of numbers that aren't obvious.
// Fields marked "html" may contain <b>, <a> and <span class="soft">; everything else is plain text.

export const caseStudies = [
  {
    slug: "atriveo-tracker",
    name: "Atriveo Tracker",
    live: true,
    started: "2026-02-22", // first tracker commit: "Add dashboard page with owner login"
    seo: {
      title: "Atriveo Tracker — Job Application Tracker · Atishay Kasliwal",
      description:
        "How Atishay Kasliwal built Atriveo Tracker: a Chrome extension that saves job applications from 60 job sites in one click, and the dashboard behind it.",
      category: "BusinessApplication",
      platforms: "Web, Chrome",
      language: "TypeScript",
    },
    // h1: white, then grey.
    headline: "Save a job application in one click, from 60 job sites.",
    headlineSoft: "Track everything after it in one place.",
    lede:
      "It started in February 2026 as an owner-only dashboard on my personal website, built for my own job search. Within two weeks it had public sign-up and a Chrome extension, and it now runs on its own at tracker.atriveo.com.",
    spec: [
      { label: "Stack", html: "<b>React · Hono · Postgres</b> · Cloudflare Workers · Neon · R2 · Chrome MV3" },
      {
        label: "Status",
        html: '<b>Live</b> since March 2026 · <a href="https://tracker.atriveo.com">tracker.atriveo.com <span class="arrow">↗︎</span></a> · <a href="https://github.com/atishay-kasliwal/Atriveo">GitHub <span class="arrow">↗︎</span></a>',
      },
    ],
    stats: [
      { value: "1,000+", label: "applications tracked" }, // README "Results"
      { value: "60", label: "job sites recognised" }, // detector.js: 25 platforms + 35 company career sites
      { value: "7", label: "extension releases" }, // release/atriveo-job-assistant-v1.0.1 … v1.0.7
    ],
    windowStack: "React · Hono · Postgres",
    links: [
      { label: "Open site", href: "https://tracker.atriveo.com" },
      { label: "Code", href: "https://github.com/atishay-kasliwal/Atriveo" },
    ],
    media: {
      video: "/projects/video/tracker.mp4",
      items: [
        {
          label: "Live site",
          src: "/projects/cards/tracker.webp",
          thumb: "/projects/media/atriveo-tracker/live-thumb.webp",
          alt: "Atriveo Tracker's landing page on a tablet: “Your job search, organized.”",
          video: true,
        },
        {
          label: "Landing",
          src: "/projects/media/atriveo-tracker/landing.webp",
          thumb: "/projects/media/atriveo-tracker/landing-thumb.webp",
          alt: "Atriveo Tracker landing page above the applications table, with follow-up and interview cards",
        },
        {
          label: "Analytics",
          src: "/projects/media/atriveo-tracker/analytics.webp",
          thumb: "/projects/media/atriveo-tracker/analytics-thumb.webp",
          alt: "Analytics dashboard: applications this month, week and today, with daily targets and a trend chart",
        },
        {
          label: "Active jobs",
          src: "/projects/media/atriveo-tracker/active-jobs.webp",
          thumb: "/projects/media/atriveo-tracker/active-jobs-thumb.webp",
          alt: "Active jobs view with the application momentum chart and the jobs table",
        },
      ],
    },
    problem: {
      title: "Every job site is built differently.",
      body: "Applications lived in spreadsheets, notes and email. Workday, Greenhouse, Lever and Ashby lay out the same job differently, so logging one meant copying every field by hand.",
    },
    solution: {
      title: "Save it in one click, then track all of it.",
      body: "A Chrome extension reads the job off the page and saves it to your account. The dashboard follows it through online assessments, referrals, notes and follow-ups, with a daily digest email.",
    },
    engineering: {
      nodes: [
        [
          { name: "Chrome", detail: "extension · MV3" },
          { name: "Hono", detail: "on Workers" },
          { name: "Postgres", detail: "Neon" },
        ],
        [
          { name: "React", detail: "dashboard · Pages" },
          { name: "R2 · Email", detail: "Resend · Brevo" },
        ],
      ],
      note: "Four cron triggers send the daily digest; a per-day idempotency key makes a retried or overlapping run a no-op.",
    },
    decisions: [
      "<b>Duplicates blocked twice</b>: extension, then API",
      "<b>PBKDF2, 100,000 iterations</b> on the Worker",
      "<b>Named-domain permissions</b> for store review",
      "<b>Field-level sharing</b> with friends",
      "<b>36 ordered SQL migrations</b>",
    ],
    note: {
      strong: "The database was the easy part.",
      soft: "Reading 60 differently built job pages the same way was not.",
      body: "Ten sites have their own extractor, from Workday to Ashby, and any other careers page goes through a generic reader. Before it saves, the extension checks your existing applications by link, or by job ID, company and title, so a second click never makes a second row.",
    },
  },
  {
    slug: "atriveo-cortex",
    name: "Atriveo Cortex",
    live: true,
    started: "2026-06-16", // first commit: "Initial commit: Atriveo Cortex extraction inspector"
    seo: {
      title: "Atriveo Cortex — AI Working Memory · Atishay Kasliwal",
      description:
        "How Atishay Kasliwal built Atriveo Cortex: local screen history turned into work sessions, projects and commitments, published to a private web dashboard.",
      category: "ProductivityApplication",
      platforms: "macOS, Web",
      language: "TypeScript",
    },
    headline: "My screen history, turned into what I actually worked on.",
    headlineSoft: "Its one question: what am I forgetting?",
    lede:
      "ScreenPipe records the text on my screen and my audio all day on a Mac Mini. Cortex turns that into sessions, focus, idle time and open loops, shown on a private dashboard at cortex.atriveo.com.",
    spec: [
      { label: "Stack", html: "<b>TypeScript · Hono · Postgres</b> · ScreenPipe · SQLite · Ollama · Cloudflare" },
      {
        label: "Status",
        html: '<b>Live</b>, private, since June 2026 · <a href="https://cortex.atriveo.com/login">cortex.atriveo.com <span class="arrow">↗︎</span></a> · <a href="https://github.com/atishay-kasliwal/atriveo-cortex">GitHub <span class="arrow">↗︎</span></a>',
      },
    ],
    stats: [
      { value: "222", label: "commits in 16 days" }, // 2026-06-16 → 2026-07-01
      { value: "62", label: "engineering reports" }, // docs/reports
      { value: "71", label: "test files" }, // *.test.* / *.spec.* in the repo
    ],
    windowStack: "ScreenPipe · TypeScript · Hono",
    links: [
      { label: "Open site", href: "https://cortex.atriveo.com/login" },
      { label: "Code", href: "https://github.com/atishay-kasliwal/atriveo-cortex" },
    ],
    media: {
      video: "/projects/video/cortex.mp4",
      // The dashboard shows my own activity, so the gallery only uses the card and the sign-in page.
      note: "The dashboard is private: it shows my own activity, so it isn't pictured here.",
      items: [
        {
          label: "Overview",
          src: "/projects/cards/cortex.webp",
          thumb: "/projects/media/atriveo-cortex/card-thumb.webp",
          alt: "Atriveo Cortex's “Your work, remembered.” screen at the front of a ribbon of past screens",
          video: true,
        },
        {
          label: "Sign-in",
          src: "/projects/screens/cortex.webp",
          thumb: "/projects/media/atriveo-cortex/signin-thumb.webp",
          alt: "Atriveo Cortex sign-in page: “The memory layer for your work. Your work, remembered.”",
        },
      ],
    },
    problem: {
      title: "Most of a workday is never written down.",
      body: "Time trackers only know what you remember to tell them. The tabs, calls and half-finished ideas in between never get logged, so commitments and ideas quietly slip.",
    },
    solution: {
      title: "Record everything, then pull out what mattered.",
      body: "Cortex groups raw capture into sessions and scores presence in five states, from focused to asleep. A local model (Gemma on Ollama) proposes projects, commitments and ideas, which I rate good, okay or bad in an inspector.",
    },
    engineering: {
      nodes: [
        [
          { name: "ScreenPipe", detail: "Mac Mini" },
          { name: "SQLite", detail: "local knowledge" },
          { name: "Builders", detail: "deterministic" },
        ],
        [
          { name: "Hono · Postgres", detail: "Worker · Neon" },
          { name: "React", detail: "private · Pages" },
        ],
      ],
      note: "A launchd agent syncs every five minutes from a watermark. Every published model must rebuild from the local store alone, with no network or LLM calls.",
    },
    decisions: [
      "<b>Local-first sync</b>: one daily JSON, not raw frames",
      "<b>Five presence states</b>, not frame gaps, for idle",
      "<b>Deterministic builders</b>, written up as ADRs",
      "<b>Fail-closed auth</b>, tokens cut from 90 to 7 days",
      "<b>Accuracy measured</b> from my own reviews",
    ],
    note: {
      strong: "The hardest part was naming a session.",
      soft: "“Research” and “GitHub” said where I was, not what I was doing.",
      body: "Titles now come from competing signals, each with its own confidence: URL structure, window title, project match, OCR, domain and category. OCR was switched off after a backfill of a real day produced titles like “Software Engineerhetnat”.",
    },
  },
  {
    slug: "atriveo-bio",
    name: "Atriveo Bio",
    live: true,
    started: "2026-06-19", // first commit: "Initial public release of Cortex Bio."
    seo: {
      title: "Atriveo Bio — Wearable Readiness API · Atishay Kasliwal",
      description:
        "How Atishay Kasliwal built Atriveo Bio: an API that turns Apple Health data into an explainable readiness score, personal baselines and deep-work forecasts.",
      category: "HealthApplication",
      platforms: "iOS, Web",
      language: "TypeScript",
    },
    headline: "Apple Watch data in, one readiness score out.",
    headlineSoft: "With every reason behind it listed.",
    lede:
      "An iPhone app syncs HealthKit data to an API that builds a personal feature store: sleep, HRV, resting heart rate and activity, each against your own 30-day baseline. From that it scores readiness, estimates your chronotype and forecasts the day's best deep-work window.",
    spec: [
      { label: "Stack", html: "<b>TypeScript · Hono · Postgres</b> · Prisma · SwiftUI · HealthKit · XGBoost" },
      {
        label: "Status",
        html: '<b>Live</b>, public beta, since June 2026 · <a href="https://bio.atriveo.com">bio.atriveo.com <span class="arrow">↗︎</span></a> · <a href="https://github.com/atishay-kasliwal/cortex-bio">GitHub <span class="arrow">↗︎</span></a>',
      },
    ],
    stats: [
      { value: "6", label: "layers, samples to forecasts" }, // ARCHITECTURE.md layer model
      { value: "3", label: "baselines a model must beat" }, // ml/train.py: yesterday, 7-day rolling, rules
      { value: "30-day", label: "personal baselines" }, // feature-engine.ts rolling means
    ],
    windowStack: "TypeScript · Hono · Postgres",
    links: [
      { label: "Open site", href: "https://bio.atriveo.com" },
      { label: "Code", href: "https://github.com/atishay-kasliwal/cortex-bio" },
    ],
    media: {
      video: "/projects/video/bio.mp4",
      items: [
        {
          label: "Live site",
          src: "/projects/cards/bio.webp",
          thumb: "/projects/media/atriveo-bio/card-thumb.webp",
          alt: "Atriveo Bio's landing page split into floating layers: navigation, “Know when you'll perform at your best”, and the readiness card",
          video: true,
        },
        {
          label: "Features",
          src: "/projects/media/atriveo-bio/features.webp",
          thumb: "/projects/media/atriveo-bio/features-thumb.webp",
          alt: "Atriveo Bio features: cognitive readiness, deep work forecasting, chronotype analysis, recovery, performance analytics and a developer API",
        },
        {
          label: "Pipeline",
          src: "/projects/media/atriveo-bio/pipeline.webp",
          thumb: "/projects/media/atriveo-bio/pipeline-thumb.webp",
          alt: "Atriveo Bio pipeline: connect wearables, generate biometrics, predict performance, optimize work",
        },
        {
          label: "API docs",
          src: "/projects/media/atriveo-bio/docs.webp",
          thumb: "/projects/media/atriveo-bio/docs-thumb.webp",
          alt: "Atriveo Bio API reference, v1 public beta, with authentication and a readiness request example",
        },
      ],
    },
    problem: {
      title: "Wearables report numbers, not what to do.",
      body: "An Apple Watch records sleep, heart-rate variability, resting heart rate and steps, but raw numbers don't say whether today is a day for deep work, or when in the day to do it.",
    },
    solution: {
      title: "Compare you with you, then explain the score.",
      body: "Samples land append-only, roll up into daily and hourly features, and are compared with 30-day personal baselines. Readiness is a rules-based score that returns its reasons, such as “Strong sleep +12” or “Short sleep −15”.",
    },
    engineering: {
      nodes: [
        [
          { name: "HealthKit", detail: "SwiftUI app" },
          { name: "Hono API", detail: "Fly.io" },
          { name: "Postgres", detail: "Neon · Prisma" },
        ],
        [
          { name: "Feature store", detail: "daily · hourly" },
          { name: "XGBoost", detail: "trained offline" },
        ],
      ],
      note: "Each sync recomputes features for the days it touched. Sleep uses the night's longest session, so naps don't count twice.",
    },
    decisions: [
      "<b>Explainability before ML</b>: rules first",
      "<b>Append-only raw samples</b>, always recomputable",
      "<b>Baseline-gated models</b>: beat yesterday first",
      "<b>Re-sync safe</b>: samples de-duplicated",
      "<b>Open engine</b> (MIT), hosted API separate",
    ],
    note: {
      strong: "Machine learning had to earn its place.",
      soft: "Every model is scored against yesterday, a 7-day average and the rules.",
      body: "The training script fits XGBoost on sleep, HRV, activity, chronotype and weekday, then records whether it beat all three baselines. Until a model does, the explainable rules-based score stays the default.",
    },
  },
  {
    slug: "atriveo-job-search",
    name: "Atriveo Job Search",
    live: true,
    started: "2026-03-25", // job-pipeline's first commit; open-sourced as Atriveo-JD-Extractor on 2026-06-24
    seo: {
      title: "Atriveo Job Search — Self-Hosted Pipeline · Atishay Kasliwal",
      description:
        "How Atishay Kasliwal built Atriveo Job Search: hourly job scraping, a 0–10 fit score, and one-page résumés tailored by a local LLM on your own machine.",
      category: "BusinessApplication",
      platforms: "macOS, Linux, Web",
      language: "TypeScript",
    },
    headline: "Job postings in, one-⁠page tailored résumés out.",
    headlineSoft: "On your own machine, with a local model.",
    lede:
      "It started in March 2026 as a scraper for my own job search and grew into a résumé compiler. I open-sourced it in June: a Python scraper, an Express server, and a Node sidecar that runs Gemma locally and compiles LaTeX.",
    spec: [
      { label: "Stack", html: "<b>Python · TypeScript · Ollama</b> · Express · React · Tectonic · SQLite / Postgres" },
      {
        label: "Status",
        html: '<b>Live</b>, open source since June 2026 · <a href="https://application.atriveo.com">application.atriveo.com <span class="arrow">↗︎</span></a> · <a href="https://github.com/atishay-kasliwal/Atriveo-JD-Extractor">GitHub <span class="arrow">↗︎</span></a>',
      },
    ],
    stats: [
      { value: "3,774", label: "commits across 3 repos" }, // job-pipeline 294 + atriveo-app 3,467 + Atriveo-JD-Extractor 13
      { value: "0–10", label: "fit score per posting" }, // scraper/scorer.py
      { value: "1 page", label: "per tailored résumé" }, // compiled with Tectonic
    ],
    windowStack: "Python · TypeScript · Ollama",
    links: [
      { label: "Open site", href: "https://application.atriveo.com" },
      { label: "Code", href: "https://github.com/atishay-kasliwal/Atriveo-JD-Extractor" },
    ],
    media: {
      video: "/projects/video/jobs.mp4",
      items: [
        {
          label: "Live site",
          src: "/projects/cards/jobs.webp",
          thumb: "/projects/media/atriveo-job-search/card-thumb.webp",
          alt: "Atriveo Job Search pipeline drawn as a blueprint: scrape, score, review, tailor, compile, apply",
          video: true,
        },
        {
          label: "Features",
          src: "/projects/media/atriveo-job-search/features.webp",
          thumb: "/projects/media/atriveo-job-search/features-thumb.webp",
          alt: "Atriveo features: multi-source job scraper, ranked live feed, LLM résumé tailoring, truth-first bullet bank, recon and pipeline tracking",
        },
        {
          label: "Pipeline",
          src: "/projects/media/atriveo-job-search/pipeline.webp",
          thumb: "/projects/media/atriveo-job-search/pipeline-thumb.webp",
          alt: "From job posting to PDF résumé: four steps beside a terminal showing the pipeline status and scraper output",
        },
        {
          label: "Deploy",
          src: "/projects/media/atriveo-job-search/run.webp",
          thumb: "/projects/media/atriveo-job-search/run-thumb.webp",
          alt: "Three ways to run Atriveo: Cloudflare Pages, Docker Compose, or OpenShift and Kubernetes",
        },
      ],
    },
    problem: {
      title: "The good roles disappear within hours.",
      body: "Job boards return hundreds of postings, most of them wrong: senior roles, clearance jobs, no sponsorship. Checking by hand doesn't scale, and every application still needs its own résumé.",
    },
    solution: {
      title: "Scrape, score, tailor, compile.",
      body: "Every hour a scraper pulls LinkedIn, Greenhouse and Lever postings and scores each 0–10 on keywords, location, recency and source. For jobs I pick, a local model chooses my strongest real bullets for a one-page PDF.",
    },
    engineering: {
      nodes: [
        [
          { name: "Scraper", detail: "Python · hourly" },
          { name: "Express", detail: "API · SQLite" },
          { name: "Sidecar", detail: "Node · queue" },
        ],
        [
          { name: "Ollama", detail: "Gemma · local" },
          { name: "Tectonic", detail: "LaTeX → PDF" },
        ],
      ],
      note: "The hosted UI reaches your backend by URL and API key: the UI lives on Atriveo's servers, your postings and résumés stay on yours.",
    },
    decisions: [
      "<b>Truth rules</b>: no invented tools or metrics",
      "<b>Your own bullets</b>, selected per job",
      "<b>Hard caps</b> on the model's JSON output",
      "<b>Local model</b>: no API costs, no data sent",
      "<b>Three ways to run</b>: Pages, Docker, OpenShift",
    ],
    note: {
      strong: "A 12B model will fill every field you give it.",
      soft: "Mine kept writing until it cut off its own JSON.",
      body: "Under a JSON schema, Gemma padded keyword lists and rewrote every bullet until the output was truncated. Every list is now capped in both the prompt and the schema, and each Ollama call retries with a larger token budget only when it needs one.",
    },
  },
];
