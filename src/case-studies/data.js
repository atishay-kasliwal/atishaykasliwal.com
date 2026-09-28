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
    lastModified: "2026-09-27",
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
    lastModified: "2026-09-27",
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
    lastModified: "2026-09-27",
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
    lastModified: "2026-09-27",
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
  {
    slug: "insurance-platform",
    name: "Insurance Platform",
    live: false,
    started: "2024-05-07", // first commit: "first microservice: twitter to kafka service"
    seo: {
      title: "Insurance Platform — Event-Driven Kafka Microservices · Atishay Kasliwal",
      description:
        "How Atishay Kasliwal turned a Kafka streaming exercise into an event-driven insurance platform: CQRS, Elasticsearch, and a JWT-secured, rate-limited gateway.",
      language: "Java",
    },
    headline: "Every policy change becomes an event.",
    headlineSoft: "Kafka carries it to search, analytics and a secured gateway.",
    lede:
      "It began in 2024 as a Kafka streaming exercise: a service literally called twitter-to-kafka-service. In 2026 I rebuilt the top of the stack around insurance policies and claims, adding service discovery, a JWT-secured gateway, and Prometheus and Grafana.",
    spec: [
      { label: "Stack", html: "<b>Java · Spring Boot · Kafka</b> · Elasticsearch · Eureka · Redis" },
      {
        label: "Status",
        html: '<b>Open source</b> · <a href="https://github.com/atishay-kasliwal/insurance-microservices-platform">GitHub <span class="arrow">↗︎</span></a>',
      },
    ],
    stats: [
      { value: "8", label: "microservices" }, // config, discovery, gateway, ingest, kafka→elastic, streams, query, web-client
      { value: "3", label: "Kafka brokers" },
      { value: "54", label: "commits since 2024" },
    ],
    windowStack: "Java · Spring Boot · Kafka",
    links: [{ label: "View code", href: "https://github.com/atishay-kasliwal/insurance-microservices-platform" }],
    media: {
      video: "/projects/video/insurance.mp4",
      items: [
        {
          label: "Overview",
          src: "/projects/video/insurance-poster.webp",
          thumb: "/projects/video/insurance-poster.webp",
          alt: "Insurance Platform: policy data moving from providers through Kafka and Elasticsearch to a gateway",
          video: true,
        },
      ],
    },
    problem: {
      title: "A course project isn't a platform.",
      body: "The original pipeline could stream and index events, but nothing secured a route, discovered a service, or rate-limited a client — what a real system in front of insurers actually needs.",
    },
    solution: {
      title: "Keep the pipeline, build the platform around it.",
      body: "Ingestion, streaming and indexing stayed as they were. Eureka now gives services a registry instead of hard-coded URLs, a gateway checks a JWT and rate-limits each route through Redis, and Prometheus, Grafana and ELK watch all of it.",
    },
    engineering: {
      nodes: [
        [
          { name: "Ingestion", detail: "Avro · Kafka" },
          { name: "Kafka", detail: "3 brokers" },
          { name: "Elasticsearch", detail: "indexed reads" },
        ],
        [
          { name: "Streams", detail: "state store" },
          { name: "Gateway", detail: "JWT · Redis" },
        ],
      ],
      note: "Writes go to Kafka and reads come from Elasticsearch, so the query side never blocks on the write side, or on the insurer feed behind it.",
    },
    decisions: [
      "<b>CQRS split</b>: Kafka writes, Elasticsearch reads",
      "<b>Eureka discovery</b>, not static service URLs",
      "<b>Redis rate limits</b>: 5–10 req/s per route",
      "<b>JWT at the gateway</b>, not in every service",
      "<b>Prometheus, Grafana, ELK</b> across all 8 services",
    ],
    note: {
      strong: "Every service still says \u201ctwitter.\u201d",
      soft: "The events are insurance policies now; the class names never caught up.",
      body: "The write path began as a Kafka course project on tweet streams: the ingestion service is still called twitter-to-kafka-service, and its schema still has a userId field. When I rebuilt the top of the stack in 2026 (Eureka, JWT, Redis limits, Prometheus, Grafana) I left that name alone on purpose.",
    },
  },
  {
    slug: "fedtalk",
    name: "FedTalk",
    live: false,
    started: "2026-07-02", // repo history squashed to one commit: "FedTalk: FOMC statement sentiment analysis..."
    seo: {
      title: "FedTalk — Can an LLM Read the Fed? · Atishay Kasliwal",
      description:
        "A research project by Atishay Kasliwal testing whether GPT-4o-mini can predict how markets react to FOMC statements, using transcripts, retrieved news and minute-level prices.",
      language: "Python",
    },
    headline: "Can a language model read the Fed before the market does?",
    headlineSoft: "Tested on 33 press conferences, not a hunch.",
    lede:
      "Every FOMC press conference gets transcribed, matched against the official statement and same-day news by embedding search, then handed to GPT-4o-mini to call the next few minutes of SPY: up or down. Scored against what actually happened, not against its own guess.",
    spec: [
      { label: "Stack", html: "<b>Python · Whisper · Pinecone</b> · GPT-4o-mini · sentence-transformers" },
      {
        label: "Status",
        html: '<b>Research, 2021–2024</b> · <a href="https://github.com/atishay-kasliwal/fedtalk-openai-analysis-main">GitHub <span class="arrow">↗︎</span></a>',
      },
    ],
    stats: [
      { value: "33", label: "FOMC conferences" },
      { value: "58.7%", label: "directional accuracy" }, // metrics_positive.csv: Accuracy 0.5874125874125874
      { value: "0.74", label: "weighted F1 score" }, // metrics_positive.csv: F1_Score 0.7400881057268722
    ],
    windowStack: "Python · Whisper · Pinecone",
    links: [{ label: "View code", href: "https://github.com/atishay-kasliwal/fedtalk-openai-analysis-main" }],
    media: {
      video: "/projects/video/fedtalk.mp4",
      items: [
        {
          label: "Overview",
          src: "/projects/video/fedtalk-poster.webp",
          thumb: "/projects/video/fedtalk-poster.webp",
          alt: "FedTalk: the market's reaction to the 2:00 PM ET statement, charted against transcription, retrieval and prediction",
          video: true,
        },
      ],
    },
    problem: {
      title: "Fed statements move markets in minutes.",
      body: "Every FOMC statement nudges prices within minutes, but the reaction depends on how the language shifted, not just what was said, and that's hard to score by eye across dozens of conferences.",
    },
    solution: {
      title: "Transcribe it, ground it, then ask the model to call it.",
      body: "Whisper transcribes each conference; embedding search pulls the closest statement and news sentences from Pinecone; GPT-4o-mini reads the transcript against that context and calls SPY up or down over the next 1, 5 or 10 minutes.",
    },
    engineering: {
      nodes: [
        [
          { name: "Whisper", detail: "transcribe" },
          { name: "Embeddings", detail: "mpnet · Pinecone" },
          { name: "GPT-4o-mini", detail: "predict" },
        ],
        [
          { name: "Alpaca", detail: "SPY prices" },
          { name: "Scoring", detail: "acc · F1" },
        ],
      ],
      note: "Statement and news sentences sit in two separate Pinecone indexes, so a prediction can point to which one it actually leaned on.",
    },
    decisions: [
      "<b>GPT-3.5</b> filters, <b>GPT-4o-mini</b> predicts",
      "<b>Three window sizes</b>: 1, 5 and 10 minutes",
      "<b>Scored on realized price</b>, not its own features",
      "<b>Two Pinecone indexes</b>: statement text, news text",
      "<b>Stratified split</b> across 2023–2024",
    ],
    note: {
      strong: "The model that shipped isn't the one I reached for first.",
      soft: "GPT-4o-mini won on cost without losing accuracy; a DeepSeek-R1 swap stayed commented out.",
      body: "Every prediction call pins gpt-4o-mini-2024-07-18, with GPT-3.5-turbo doing the cheaper news-rating pass beneath it. A second version of the same function, wired for DeepSeek-R1, still sits in the file commented out, from the point where I tried it and kept the mini model instead.",
    },
  },
  {
    slug: "developer-profile",
    name: "Beyond the Resume",
    kicker: "Profile",
    schemaType: "CreativeWork",
    isProfilePage: true,
    live: false,
    started: "2026-05-01", // first commit: "Add profile README"
    seo: {
      title: "Atishay Kasliwal | Beyond the Resume",
      description:
        "A closer look at Atishay Kasliwal's experience, the projects he's built, what he's working on now, and a few things outside of code, including photography.",
      language: "Markdown",
    },
    headline: "More than a README.",
    headlineSoft: "The page I'd actually want someone to read.",
    lede:
      "Most people meet my work through a live product or a write-up like this one. This is the other way in, the page that shows up when someone just searches my name. Not a resume. Closer to an answer to “so what have you actually been doing.”",
    spec: [
      { label: "Where", html: "<b>github.com/atishay-kasliwal</b>" },
      {
        label: "Status",
        html: '<b>Open source</b> · <a href="https://github.com/atishay-kasliwal/atishay-kasliwal">GitHub <span class="arrow">↗︎</span></a>',
      },
    ],
    stats: [],
    windowStack: "Markdown · GitHub",
    links: [{ label: "View profile", href: "https://github.com/atishay-kasliwal/atishay-kasliwal" }],
    media: {
      items: [
        {
          label: "Overview",
          src: "/projects/media/developer-profile/card.webp",
          thumb: "/projects/media/developer-profile/card-thumb.webp",
          alt: "The homepage card for this project: Atishay Kasliwal's portrait, name, role, and a route through what he builds, ships, and cares about",
        },
        {
          label: "The journey",
          src: "/projects/media/developer-profile/journey.webp",
          thumb: "/projects/media/developer-profile/journey-thumb.webp",
          alt: "An abstract path through a few waypoints, standing in for the four roles behind the profile",
        },
        {
          label: "Outside the code",
          src: "/projects/media/developer-profile/light.webp",
          thumb: "/projects/media/developer-profile/light-thumb.webp",
          alt: "Soft light across a dark plane, standing in for the photography section of the profile",
        },
        {
          label: "Toolkit",
          src: "/projects/media/developer-profile/toolkit.webp",
          thumb: "/projects/media/developer-profile/toolkit-thumb.webp",
          alt: "The real toolkit table from the README, laid out as tags: languages, product, AI and data, infrastructure",
        },
      ],
    },
    sections: [
      {
        title: "A place that isn't just job titles",
        body: "Most of what's out there about me online is a resume line or a LinkedIn headline. Neither says much. I wanted one page where someone could see the actual work, and a couple of things that have nothing to do with a paycheck, so I built it into the one spot every developer already has and most leave nearly empty: their own GitHub profile.",
      },
      {
        title: "Four jobs, and what I actually did in them",
        body: "I've built research infrastructure at Stony Brook University, medical-imaging pipelines across 50,000+ scans at Wake Forest CAIR, and production microservices serving 100,000+ monthly users at Bounteous, plus billing systems handling 10,000+ daily transactions as an intern at Shriffle. I'd rather someone read that than a job title.",
      },
      {
        title: "What I've actually built",
        body: "Ten projects, from a Chrome extension that tracks job applications to a Raft-based event log written in C++. Six get a screenshot and their real stack; four more get one line each. I'd rather someone click through and look at the code than take my word for any of it.",
      },
      {
        title: "The camera, and how I work",
        body: "I keep coming back to photography, noticing light across a building or a quiet moment between people has sharpened how I think about spacing and interfaces. And near the bottom of the page there are four lines on how I actually approach the job: evidence over theatre, privacy by architecture, boring reliability, interfaces that explain themselves. Not a skills list, just what I keep coming back to.",
      },
    ],
  },
  {
    slug: "atriveo-reel",
    name: "Atriveo Reel",
    live: false,
    started: "2026-08-10", // first commit: "Atriveo Reel: vertical comparison reels, self-hosted"
    seo: {
      title: "Atriveo Reel — Self-Hosted Comparison Videos · Atishay Kasliwal",
      description:
        "How Atishay Kasliwal built Atriveo Reel: paste two clips, pick two moments, and get a 1080×1920 comparison video rendered by a worker that outlives the browser tab.",
      language: "TypeScript",
    },
    headline: "Two clips in, one comparison reel out.",
    headlineSoft: "Rendered by a worker that survives a closed tab.",
    lede:
      "Paste two video URLs, pick a moment in each, choose a layout, and download a 1080×1920 MP4. It's self-hosted on one Mac Mini, reached through a Cloudflare Tunnel, built over two weeks in August 2026.",
    spec: [
      { label: "Stack", html: "<b>Next.js · Remotion · FFmpeg</b> · SQLite · Cloudflare Tunnel" },
      {
        label: "Status",
        html: '<b>Open source</b> · <a href="https://github.com/atishay-kasliwal/atriveo-reel">GitHub <span class="arrow">↗︎</span></a>',
      },
    ],
    stats: [
      { value: "4", label: "comparison layouts" },
      { value: "1080×1920", label: "output, 30 fps" },
      { value: "17", label: "commits over two weeks" },
    ],
    windowStack: "Next.js · Remotion · FFmpeg",
    links: [{ label: "View code", href: "https://github.com/atishay-kasliwal/atriveo-reel" }],
    media: {
      video: "/projects/video/reel.mp4",
      items: [
        {
          label: "Overview",
          src: "/projects/video/reel-poster.webp",
          thumb: "/projects/video/reel-poster.webp",
          alt: "Atriveo Reel: two source clips, a caption band between them, and a 1080×1920 rendered reel",
          video: true,
        },
      ],
    },
    problem: {
      title: "A comparison video is five careful decisions, not one edit.",
      body: "Two clips have to line up on the moment that matters, sit in a layout that makes the comparison obvious, and hold captions without one clip going blank while the other keeps playing.",
    },
    solution: {
      title: "One workspace, four layouts, a worker that outlives the tab.",
      body: "A single-page workspace replaced an earlier five-step wizard. The web app only writes a job row and returns; a separate worker polls SQLite and renders with FFmpeg and Remotion, so a render survives a browser refresh.",
    },
    engineering: {
      nodes: [
        [
          { name: "Next.js", detail: "writes a job" },
          { name: "SQLite", detail: "job queue" },
          { name: "Worker", detail: "polls · renders" },
        ],
        [
          { name: "FFmpeg", detail: "VideoToolbox" },
          { name: "Remotion", detail: "text · captions" },
        ],
      ],
      note: "The shorter clip freezes on its last frame in a split layout, so the comparison pane never goes blank while the longer one keeps playing.",
    },
    decisions: [
      "<b>Web never renders</b>: a job row, then a worker",
      "<b>One render at a time</b>, tuned for a Mac Mini",
      "<b>Hardware encoding</b> via VideoToolbox by default",
      "<b>Caption band</b> takes space, not covers it",
      "<b>Finished reels kept</b>, unless retention is set",
    ],
    note: {
      strong: "A caption never hides behind a title card.",
      soft: "The band claims its strip first; the card lays out around it.",
      body: "A caption band and a text card can run together: the band's height comes out of each pane rather than sitting over it, so a 1920px frame with a 220px band still leaves 850px of clear video each side. The card composites first, then the band goes on last, holding its strip for the card's whole duration.",
    },
  },
  {
    slug: "insureraft",
    name: "InsureRaft",
    live: false,
    started: "2026-04-28", // first commit: "Initial commit: InsureRaft distributed insurance data transfer system"
    seo: {
      title: "InsureRaft — Replicated Insurance Event Log · Atishay Kasliwal",
      description:
        "How Atishay Kasliwal built InsureRaft: a Raft-replicated log of insurance events in C++ on NuRaft, where the log itself is the audit trail.",
      language: "C++",
    },
    headline: "A claim isn't approved until a quorum of nodes agrees.",
    headlineSoft: "The replicated log is the audit trail, not a copy of it.",
    lede:
      "Carriers, brokers, reinsurers and regulators all need the same ordered history of a policy: created, claimed, approved, paid. InsureRaft replicates that history across a Raft cluster in C++ on NuRaft, so no single party's copy is the one everyone else has to trust.",
    spec: [
      { label: "Stack", html: "<b>C++ · NuRaft · CMake</b> · OpenSSL" },
      {
        label: "Status",
        html: '<b>Open source</b> · <a href="https://github.com/atishay-kasliwal/InsureRaft">GitHub <span class="arrow">↗︎</span></a>',
      },
    ],
    stats: [
      { value: "3", label: "node cluster" },
      { value: "8", label: "typed insurance events" },
      { value: "1,469", label: "lines of C++" },
    ],
    windowStack: "C++ · NuRaft · CMake",
    links: [{ label: "View code", href: "https://github.com/atishay-kasliwal/InsureRaft" }],
    media: {
      video: "/projects/video/raft.mp4",
      items: [
        {
          label: "Overview",
          src: "/projects/video/raft-poster.webp",
          thumb: "/projects/video/raft-poster.webp",
          alt: "InsureRaft: a leader node and two followers committing an insurance event to a replicated log",
          video: true,
        },
      ],
    },
    problem: {
      title: "Everyone in an insurance claim keeps their own copy.",
      body: "A claim moves from broker to carrier to reinsurer to regulator, and today each party trusts its own record of what happened, which leaves no single ordered history everyone agrees on.",
    },
    solution: {
      title: "Make the replicated log the record.",
      body: "Every policy and claim action, created, filed, approved, denied, paid, is a typed event appended to a Raft log. A write only commits once a quorum of nodes has it, so the log itself is the audit trail rather than a copy of one.",
    },
    engineering: {
      nodes: [
        [
          { name: "Leader", detail: "node 1" },
          { name: "Follower", detail: "node 2" },
          { name: "Follower", detail: "node 3" },
        ],
        [
          { name: "State machine", detail: "policy · claim" },
          { name: "Log store", detail: "file-backed" },
        ],
      ],
      note: "New parties join as learner nodes: a snapshot catch-up brings them to the current state with no downtime for the rest of the cluster.",
    },
    decisions: [
      "<b>Quorum writes</b>: majority persists before ack",
      "<b>Event ID dedup</b>, so a retried event commits once",
      "<b>8 typed events</b>: created, filed, approved, paid",
      "<b>NuRaft</b> (eBay's library), not homegrown consensus",
      "<b>Learner nodes</b> for onboarding without downtime",
    ],
    note: {
      strong: "\u201cExactly once\u201d lives in one small set, in memory.",
      soft: "A retried event is caught before it ever reaches the log.",
      body: "Every event carries a globally unique event_id, and the state machine checks it against an in-memory set before applying anything: if it's been seen, the event is dropped before it touches policy or claim state. It is a few lines, not a dedup service, and it is what makes replaying the same event twice safe.",
    },
  },
  {
    slug: "kaggriculture",
    name: "Kaggriculture",
    live: false,
    started: "2026-08-06", // first commit: "Phase 1: environment setup, PASS/single-crop agents, crop profitability measurement"
    seo: {
      title: "Kaggriculture — A Farming-Game Agent, Built in Phases · Atishay Kasliwal",
      description:
        "How Atishay Kasliwal built a Kaggle competition agent for a two-player farming game: a simulator that matches the real engine exactly, then a planner that searches ahead through it.",
      language: "Python",
    },
    headline: "An agent that plans ahead by simulating the real rules.",
    headlineSoft: "Nine versions, each built to beat the last.",
    lede:
      "Kaggriculture is a two-player Kaggle competition: farm a shared board, sell into a moving market, out-earn an opponent over 720 turns. I built a simulator that matches the real engine exactly, then a planner that searches ahead through it instead of reacting turn by turn.",
    spec: [
      { label: "Stack", html: "<b>Python · kaggle-environments</b> · React strategy desk" },
      {
        label: "Status",
        html: '<b>Open source</b> · <a href="https://github.com/atishay-kasliwal/kaggriculture">GitHub <span class="arrow">↗︎</span></a>',
      },
    ],
    stats: [
      { value: "9", label: "agent versions" },
      { value: "720", label: "turns per season" },
      { value: "1,738", label: "lines of Python" },
    ],
    windowStack: "Python · kaggle-environments",
    links: [{ label: "View code", href: "https://github.com/atishay-kasliwal/kaggriculture" }],
    media: {
      video: "/projects/video/kaggriculture.mp4",
      items: [
        {
          label: "Overview",
          src: "/projects/video/kaggriculture-poster.webp",
          thumb: "/projects/video/kaggriculture-poster.webp",
          alt: "Kaggriculture: a farming-game strategy desk showing simulation episodes and opponent benchmarks",
          video: true,
        },
      ],
    },
    problem: {
      title: "A reactive agent can't see the trap it's walking into.",
      body: "Land, water, harvest, sell, repeat: an agent that only reacts to the current turn buys land too late, plants the wrong crop for the days left in the season, or gets outpaced by a competitor at the market.",
    },
    solution: {
      title: "Simulate first, then search through the simulation.",
      body: "A deterministic simulator reproduces the game's rules, checked turn by turn against Kaggle's own engine. A planner searches move sequences through it, models the opponent, and hands off to an emergency handler near the end of the season.",
    },
    engineering: {
      nodes: [
        [
          { name: "Simulator", detail: "matches engine" },
          { name: "Planner", detail: "search · candidates" },
          { name: "Opponent model", detail: "rollouts" },
        ],
        [
          { name: "Emergency handler", detail: "endgame" },
          { name: "Strategy desk", detail: "React" },
        ],
      ],
      note: "Tests assert the simulator against Kaggle's real engine turn by turn, so a planner search through it searches the actual rules, not an approximation.",
    },
    decisions: [
      "<b>Simulator validated</b>, exact-match vs. real engine",
      "<b>Opponent modeled</b> by rollouts, not a formula",
      "<b>Data-driven thresholds</b>, not hardcoded guesses",
      "<b>Endgame guard</b>, added after two timing bugs",
      "<b>Nine agent versions</b>, each beating the last",
    ],
    note: {
      strong: "The planner earned its search budget one phase at a time.",
      soft: "Ten phases in three days, each one validated before the next began.",
      body: "Phase 2 checked the price formula against the live engine before Phase 3 trusted the simulator to search through. Phase 5's planner had to beat every earlier agent before it became the baseline, and Phase 9 replaced a discount-formula guess at the opponent with rollouts of its own policy.",
    },
  },
  {
    slug: "bayesian-marketing-mix",
    name: "Bayesian Marketing Mix",
    live: false,
    started: "2026-04-28", // first commit: "Initial project setup — structure, README, requirements"
    seo: {
      title: "Bayesian Marketing Mix Model · Atishay Kasliwal",
      description:
        "How Atishay Kasliwal built a marketing mix model with adstock decay, Hill saturation curves, holdout and Monte Carlo validation, and ROAS-weighted budget allocation.",
      language: "Python",
    },
    headline: "I modeled five channels to find the one that works.",
    headlineSoft: "Not by correlation, by adstock and saturation.",
    lede:
      "A three-year weekly dataset, five media channels, one Ridge and PyMC-Marketing model with adstock decay and Hill saturation curves, checked by holdout, Monte Carlo and time-series cross-validation before it's allowed to say where budget should move.",
    spec: [
      { label: "Stack", html: "<b>Python · scikit-learn</b> · PyMC-Marketing · Pandas" },
      {
        label: "Status",
        html: '<b>Open source</b> · <a href="https://github.com/atishay-kasliwal/bayesian-marketing-mix-model">GitHub <span class="arrow">↗︎</span></a>',
      },
    ],
    stats: [
      { value: "0.9489", label: "R\u00b2, 156 modeled weeks" },
      { value: "2.74%", label: "mean absolute % error" },
      { value: "5.5% \u2192 47.3%", label: "email budget share" },
    ],
    windowStack: "Python · scikit-learn · PyMC",
    links: [{ label: "View code", href: "https://github.com/atishay-kasliwal/bayesian-marketing-mix-model" }],
    media: {
      video: "/projects/video/mmm.mp4",
      items: [
        {
          label: "Overview",
          src: "/projects/video/mmm-poster.webp",
          thumb: "/projects/video/mmm-poster.webp",
          alt: "Bayesian Marketing Mix Model: actual-versus-predicted sales and per-channel budget allocation charts",
          video: true,
        },
        {
          label: "Fit",
          src: "/projects/media/bayesian-mmm/actual_vs_predicted.webp",
          thumb: "/projects/media/bayesian-mmm/actual_vs_predicted-480.webp",
          alt: "Actual versus predicted weekly sales over 156 weeks, model fit and residual",
        },
        {
          label: "Contributions",
          src: "/projects/media/bayesian-mmm/channel_contributions.webp",
          thumb: "/projects/media/bayesian-mmm/channel_contributions.webp",
          alt: "Stacked channel contributions to weekly sales",
        },
        {
          label: "Budget",
          src: "/projects/media/bayesian-mmm/budget_allocation.webp",
          thumb: "/projects/media/bayesian-mmm/budget_allocation.webp",
          alt: "Current versus optimal budget allocation across five channels",
        },
      ],
    },
    problem: {
      title: "Which channel actually earned its budget?",
      body: "TV took the largest share of a three-year, five-channel spend, but a raw correlation between spend and sales can't tell a channel's own effect apart from a trend or a competitor moving at the same time.",
    },
    solution: {
      title: "Model each channel's real, saturating effect.",
      body: "Adstock decay carries a channel's spend forward across the weeks after it runs, and Hill saturation curves cap its return, so the fit separates each channel's own diminishing effect from everything happening around it.",
    },
    engineering: {
      nodes: [
        [
          { name: "Adstock", detail: "geometric decay" },
          { name: "Hill curves", detail: "saturation" },
          { name: "Ridge · PyMC", detail: "weekly fit" },
        ],
        [
          { name: "Holdout · Monte Carlo", detail: "1,000 runs" },
          { name: "Budget optimizer", detail: "ROAS-weighted" },
        ],
      ],
      note: "A 5-fold time-series split scores every fold forward in time only, never validating a week against data from after it.",
    },
    decisions: [
      "<b>Synthetic, fixed-seed data</b>, not a real client's",
      "<b>Adstock + Hill curves</b>, one per channel",
      "<b>1,000-run Monte Carlo</b> for uncertainty bounds",
      "<b>5-fold time-series CV</b>, never out of order",
      "<b>ROAS-weighted optimizer</b> over current spend",
    ],
    note: {
      strong: "The results are real; the money behind them isn't.",
      soft: "Every dollar comes from a fixed random seed, not an advertiser's ledger.",
      body: "generate_data.py builds all 156 weeks with a seeded random generator, so TV's -11.9% ROI and email's +1,152% aren't a real company's numbers, they're what the model recovers when the true relationship is already known. The question is whether the method finds that answer, not the dollar figures.",
    },
  },
];

export const additionalProjectPages = [

];

export const staticPageLastModified = {
  homepage: "2026-09-28",
  resume: "2026-02-21",
};
