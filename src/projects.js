// Six projects from github.com/atishay-kasliwal.
// `art` is the card and preview-window artwork: a screenshot for live products,
// an HTML/CSS composition for code-only repos. `stack` sits in the preview window's
// title bar; `url` adds an "Open site ↗︎" link, or "View code ↗︎" for a GitHub URL.
// `card` is the carousel image (a styled render of the same page); the preview window
// keeps `art`, so hovering a card still shows the real product.
// `video` replaces `art` in the preview window: a scroll recording for live sites, an animated scene
// (scripts/scenes/) for the rest, both made by scripts/record_previews.py. `art` stays as the
// reduced-motion fallback.
// `year` (first commit, or repo creation when history was squashed) shows in the cursor marquee.
// The card button and preview window carry the accessible name, so the image itself is decorative.
const shot = file => `<img src="/projects/${file}" alt="" decoding="async" />`;

export const projects = [
  {
    name: "Atriveo Tracker",
    url: "https://tracker.atriveo.com",
    tag: "LIVE",
    theme: "tracker",
    year: 2024,
    card: shot("cards/tracker.webp"),
    video: "/projects/video/tracker.mp4",
    poster: "/projects/tracker.webp",
    category: "Full-stack product / Live",
    stack: "React · FastAPI · Postgres",
    description:
      "Job application tracking that captures applications through a Chrome extension, tracks referrals and assessments in one dashboard, and surfaces trends.",
    art: shot("tracker.webp"),
  },
  {
    name: "Insurance Platform",
    url: "https://github.com/atishay-kasliwal/insurance-microservices-platform",
    tag: "CODE",
    theme: "insurance",
    year: 2024,
    card: shot("cards/insurance.webp"),
    video: "/projects/video/insurance.mp4",
    poster: "/projects/video/insurance-poster.webp",
    category: "Distributed systems / Open source",
    stack: "Spring Boot · Kafka · Elasticsearch",
    description:
      "Event-driven microservices that move policy data from third-party insurers to a payment gateway, using CQRS and event sourcing on Kafka and Elasticsearch.",
    art: '<div class="mock-nav"><b>Insurance Platform</b><span>Java · Spring Boot</span></div><div class="flow-title">Policy data,<br />event by event.</div><div class="flow"><i>Providers</i><i>Kafka</i><i>Elasticsearch</i><i>Gateway</i></div><div class="mock-bottom">CQRS · event sourcing · Kubernetes<span>Open source ↗︎</span></div>',
  },
  {
    name: "Atriveo Cortex",
    url: "https://cortex.atriveo.com/login",
    tag: "LIVE",
    theme: "cortex",
    year: 2026,
    card: shot("cards/cortex.webp"),
    video: "/projects/video/cortex.mp4",
    poster: "/projects/video/cortex-poster.webp",
    category: "Local-first AI / Live",
    stack: "ScreenPipe · Ollama · Python",
    description:
      "An AI working-memory layer on ScreenPipe that turns screen and audio history into projects, commitments and ideas, with a local model.",
    art: shot("cortex.webp"),
  },
  {
    name: "Atriveo Bio",
    url: "https://bio.atriveo.com",
    tag: "LIVE",
    theme: "bio",
    year: 2026,
    card: shot("cards/bio.webp"),
    video: "/projects/video/bio.mp4",
    poster: "/projects/bio.webp",
    category: "Health data API / Live",
    stack: "TypeScript · Postgres · OpenAPI",
    description:
      "Wearable intelligence API that turns Apple Health, Oura, WHOOP and Garmin data into readiness scores, performance forecasts and deep-work windows.",
    art: shot("bio.webp"),
  },
  {
    name: "Atriveo Job Search",
    url: "https://application.atriveo.com",
    tag: "LIVE",
    theme: "jobs",
    year: 2026,
    card: shot("cards/jobs.webp"),
    video: "/projects/video/jobs.mp4",
    poster: "/projects/jobs.webp",
    category: "Job search automation / Live",
    stack: "Python · TypeScript · Local LLM",
    description:
      "A self-hosted pipeline that scrapes LinkedIn, Greenhouse and Lever every hour, scores roles against a profile, and tailors a one-page resume with a local LLM.",
    art: shot("jobs.webp"),
  },
  {
    name: "FedTalk",
    url: "https://github.com/atishay-kasliwal/fedtalk-openai-analysis-main",
    tag: "CODE",
    theme: "fedtalk",
    year: 2025,
    card: shot("cards/fedtalk.webp"),
    video: "/projects/video/fedtalk.mp4",
    poster: "/projects/video/fedtalk-poster.webp",
    category: "LLM research / Open source",
    stack: "GPT-4o · Whisper · Pinecone",
    description:
      "Research on whether an LLM can predict short-horizon market reactions to FOMC statements, using transcripts, retrieved news and minute-level prices.",
    art: '<div class="mock-nav"><b>FedTalk</b><span>FOMC × GPT-4o</span></div><div class="fed-title">Can an LLM<br />read the Fed?</div><svg class="fed-chart" viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden="true"><path class="fed-rule" d="M88 0V80" /><path class="fed-line" d="M0 44L8 45L16 43L24 44L32 42L40 44L48 43L56 45L64 43L72 44L80 43L88 44L92 30L96 52L100 22L104 48L108 16L113 40L118 26L124 34L130 20L137 30L144 24L152 28L160 18L170 24L180 16L190 20L200 14" /></svg><div class="fed-mark">2:00 PM ET<br />statement</div><div class="mock-bottom">Whisper · Pinecone · minute-level prices<span>Research ↗︎</span></div>',
  },
];
