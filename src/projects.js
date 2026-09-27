// Eleven projects from github.com/atishay-kasliwal.
// `art` is the card and preview-window artwork: a screenshot for live products,
// an HTML/CSS composition for code-only repos. `stack` sits in the preview window's
// title bar; `url` adds an "Open site ↗︎" link, or "View code ↗︎" for a GitHub URL.
// `card` is the carousel image (a styled render of the same page); the preview window
// keeps `art`, so hovering a card still shows the real product.
// `video` replaces `art` in the preview window: a scroll recording for live sites, an animated scene
// (scripts/scenes/) for the rest, both made by scripts/record_previews.py. `art` stays as the
// reduced-motion fallback.
// `year` (first commit, or repo creation when history was squashed) shows in the cursor marquee.
// `caseStudy` links the preview window to the project's page (see src/case-studies/data.js).
// The card button and preview window carry the accessible name, so the image itself is decorative.
const shot = file => `<img src="/projects/${file}" alt="" decoding="async" />`;

// Keep the portrait as the original photograph. It is the foundation of the
// composition: the surrounding surface extends its neutral studio background.
const profileArt = `
  <span class="profile-layout" aria-hidden="true">
    <img class="profile-portrait" src="/atishay-kasliwal.jpg" alt="" decoding="async" />
    <span class="profile-copy">
      <small><i></i> 07 / PERSONAL PROFILE</small>
      <strong>Atishay<br />Kasliwal</strong>
      <em>Software &amp; AI Engineer</em>
      <span>New York, NY</span>
    </span>
    <span class="profile-map">
      <svg viewBox="0 0 420 150" preserveAspectRatio="none">
        <path class="profile-map-grid" d="M0 25H420M0 75H420M0 125H420M70 0V150M210 0V150M350 0V150" />
        <path class="profile-map-route" d="M34 106C82 106 92 45 143 45S202 112 257 112S321 55 386 55" />
        <circle class="profile-map-pulse" cx="34" cy="106" r="5" />
        <circle cx="143" cy="45" r="5" />
        <circle cx="257" cy="112" r="5" />
        <circle cx="386" cy="55" r="5" />
        <text x="34" y="132">BUILD</text>
        <text x="143" y="27">SHIP</text>
        <text x="257" y="139">SYSTEMS</text>
        <text x="386" y="37" text-anchor="end">FRAME</text>
      </svg>
    </span>
    <span class="profile-interests"><b>OPEN SOURCE</b><b>SYSTEMS</b><b>PHOTOGRAPHY</b></span>
  </span>`;

const reelArt = `
  <div class="reel-card-art">
    <div class="reel-card-top"><b>ATRIVEO <em>REEL</em></b><span><i></i> READY TO RENDER</span></div>
    <div class="reel-card-copy"><strong>Create a comparison reel</strong><small>Two clips, one vertical video.</small></div>
    <div class="reel-card-panels"><span><i>01</i><b>Media</b><small>2 / 2 · READY</small></span><span><i>02</i><b>Trim</b><small>A 10.0s · B 10.0s</small></span><span><i>03</i><b>Layout</b><small>TOP + BOTTOM</small></span><span><i>04</i><b>Text and timing</b><small>CAPTION BAND</small></span></div>
    <div class="reel-card-preview"><small>PREVIEW <i>9:16</i></small><div><span><img src="/projects/media/atriveo-reel/clip-a.webp" alt="" decoding="async" /><i>A</i></span><span><img src="/projects/media/atriveo-reel/clip-b.webp" alt="" decoding="async" /><i>B</i></span><b>Two clips.<br />One reel.</b></div></div>
    <div class="reel-card-output"><span>1080 × 1920</span><span>30 FPS</span><span>20.0S</span></div>
  </div>`;

const kaggricultureArt = `
  <div class="kag-card-art">
    <div class="kag-card-head"><b>Kaggriculture</b><span>KAGGLE SYNC · COMPLETE</span></div>
    <div class="kag-card-score"><small>STRONGEST PUBLIC SCORE</small><strong>489.2</strong><span>Current build</span></div>
    <div class="kag-card-sync"><span><b>3</b><small>SUBMISSIONS</small></span><span><b>22</b><small>EPISODES</small></span><span><b>2</b><small>REPLAYS</small></span></div>
    <div class="kag-card-benchmark"><header><span>PAST-OPPONENT BENCHMARK</span><span>W–L</span><span>AVG Δ</span></header><p><b>v9</b><span>26–2</span><strong>+27,609</strong></p><p><b>v8</b><span>6–2</span><strong>+20,133</strong></p><p><b>submission</b><span>7–1</span><strong>+15,939</strong></p></div>
    <div class="kag-card-board" aria-hidden="true">
      <i class="crop wheat"></i><i class="crop melon"></i><i class="crop wheat"></i><i></i><i class="crop carrot"></i>
      <i></i><i class="crop wheat"></i><i class="crop melon"></i><i class="crop carrot"></i><i></i>
      <i class="crop carrot"></i><i></i><i class="shed"></i><i class="crop wheat"></i><i class="crop melon"></i>
      <i class="crop wheat"></i><i class="crop carrot"></i><i></i><i class="crop melon"></i><i class="crop wheat"></i>
      <i></i><i class="crop melon"></i><i class="crop wheat"></i><i></i><i class="crop carrot"></i>
      <span class="kag-card-agent">A</span>
      <small>REPLAY MAP · DAY 09</small>
    </div>
    <div class="kag-card-note"><i></i><span><small>LATEST FINDING</small><b>Opening tempo lost immediately</b></span></div>
  </div>`;

const mmmArt = `
  <div class="mmm-card-art">
    <div class="mmm-card-head"><b>MARKETING MIX</b><span>MODEL DIAGNOSTICS · 156 WEEKS</span></div>
    <div class="mmm-card-copy"><small>OUT-OF-SAMPLE FIT</small><strong>0.9489</strong><span>R² · MAPE 2.74%</span></div>
    <figure class="mmm-card-figure"><img src="/projects/media/bayesian-mmm/actual_vs_predicted.webp" alt="" decoding="async" /><figcaption>ACTUAL VS PREDICTED SALES</figcaption></figure>
    <div class="mmm-card-foot"><span>ADSTOCK</span><span>SATURATION</span><span>1,000-RUN MONTE CARLO</span></div>
  </div>`;

const raftArt = `
  <div class="raft-card-art">
    <div class="raft-card-head"><b>InsureRaft</b><span><i></i> 3-NODE CLUSTER</span></div>
    <div class="raft-card-cluster">
      <span class="raft-node leader"><small>NODE 1 · :26001</small><b>LEADER</b><i></i></span>
      <span class="raft-node follower follower-a"><small>NODE 2 · :26002</small><b>FOLLOWER</b><i></i></span>
      <span class="raft-node follower follower-b"><small>NODE 3 · :26003</small><b>FOLLOWER</b><i></i></span>
      <svg viewBox="0 0 100 60" preserveAspectRatio="none"><path d="M50 18L24 44M50 18L76 44M24 44H76" /><circle cx="50" cy="18" r="1.2" /><circle cx="24" cy="44" r="1.2" /><circle cx="76" cy="44" r="1.2" /></svg>
    </div>
    <div class="raft-card-log"><span>04</span><b>PAYMENT_ISSUED · CLM-001</b><i>PAID · COMMITTED</i></div>
  </div>`;

export const projects = [
  {
    name: "Atriveo Tracker",
    url: "https://tracker.atriveo.com",
    tag: "LIVE",
    theme: "tracker",
    caseStudy: "/projects/atriveo-tracker/",
    year: 2026,
    card: shot("cards/tracker.webp"),
    video: "/projects/video/tracker.mp4",
    poster: "/projects/screens/tracker.webp",
    category: "Full-stack product / Live",
    stack: "React · Hono · Postgres",
    description:
      "Job application tracking that captures applications through a Chrome extension, tracks referrals and assessments in one dashboard, and surfaces trends.",
    art: shot("screens/tracker.webp"),
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
    caseStudy: "/projects/atriveo-cortex/",
    year: 2026,
    card: shot("cards/cortex.webp"),
    video: "/projects/video/cortex.mp4",
    poster: "/projects/video/cortex-poster.webp",
    category: "Local-first AI / Live",
    stack: "ScreenPipe · TypeScript · Hono",
    description:
      "An AI working-memory layer on ScreenPipe that turns screen and audio history into projects, commitments and ideas, with a local model.",
    art: shot("screens/cortex.webp"),
  },
  {
    name: "Atriveo Bio",
    url: "https://bio.atriveo.com",
    tag: "LIVE",
    theme: "bio",
    caseStudy: "/projects/atriveo-bio/",
    year: 2026,
    card: shot("cards/bio.webp"),
    video: "/projects/video/bio.mp4",
    poster: "/projects/screens/bio.webp",
    category: "Health data API / Live",
    stack: "TypeScript · Postgres · OpenAPI",
    description:
      "Wearable intelligence API that turns Apple Health data into an explainable readiness score, personal baselines and deep-work forecasts.",
    art: shot("screens/bio.webp"),
  },
  {
    name: "Atriveo Job Search",
    url: "https://application.atriveo.com",
    tag: "LIVE",
    theme: "jobs",
    caseStudy: "/projects/atriveo-job-search/",
    year: 2026,
    card: shot("cards/jobs.webp"),
    video: "/projects/video/jobs.mp4",
    poster: "/projects/screens/jobs.webp",
    category: "Job search automation / Live",
    stack: "Python · TypeScript · Local LLM",
    description:
      "A self-hosted pipeline that scrapes LinkedIn, Greenhouse and Lever every hour, scores roles against a profile, and tailors a one-page resume with a local LLM.",
    art: shot("screens/jobs.webp"),
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
  {
    name: "Developer Profile",
    url: "https://github.com/atishay-kasliwal/atishay-kasliwal",
    actionLabel: "View profile",
    tag: "PROFILE",
    theme: "profile",
    year: 2026,
    card: profileArt,
    video: "/projects/video/profile.mp4",
    poster: "/projects/video/profile-poster.webp",
    category: "GitHub profile / Open source",
    stack: "Markdown · Open source · Systems",
    description:
      "A visual map of my work, experience, photography, technical toolkit, and the principles behind the products I build.",
    art: shot("video/profile-poster.webp"),
  },
  {
    name: "Atriveo Reel",
    url: "https://github.com/atishay-kasliwal/atriveo-reel",
    tag: "CODE",
    theme: "reel",
    year: 2026,
    card: reelArt,
    video: "/projects/video/reel.mp4",
    poster: "/projects/video/reel-poster.webp",
    category: "Media tooling / Open source",
    stack: "Next.js · FFmpeg · Remotion · SQLite",
    description:
      "A self-hosted editor that turns two source clips into a polished vertical comparison reel, with precise trims, layouts, captions, and durable background rendering.",
    art: reelArt,
  },
  {
    name: "Kaggriculture",
    url: "https://github.com/atishay-kasliwal/kaggriculture",
    tag: "RESEARCH",
    theme: "kaggriculture",
    year: 2026,
    card: kaggricultureArt,
    video: "/projects/video/kaggriculture.mp4",
    poster: "/projects/video/kaggriculture-poster.webp",
    category: "Game-agent research / Open source",
    stack: "Python · Simulation · Search · React",
    description:
      "A research platform for a competitive farming economy, with a deterministic simulator, opponent modeling, planner search, replay analysis, and a live strategy desk.",
    art: kaggricultureArt,
  },
  {
    name: "Bayesian Marketing Mix",
    url: "https://github.com/atishay-kasliwal/bayesian-marketing-mix-model",
    tag: "DATA",
    theme: "mmm",
    year: 2026,
    card: mmmArt,
    video: "/projects/video/mmm.mp4",
    poster: "/projects/video/mmm-poster.webp",
    category: "Applied statistics / Open source",
    stack: "Python · scikit-learn · Monte Carlo",
    description:
      "An end-to-end marketing mix model covering adstock, saturation, holdout validation, uncertainty simulation, channel ROI, and budget allocation across 156 weeks.",
    art: mmmArt,
  },
  {
    name: "InsureRaft",
    url: "https://github.com/atishay-kasliwal/InsureRaft",
    tag: "SYSTEMS",
    theme: "raft",
    year: 2026,
    card: raftArt,
    video: "/projects/video/raft.mp4",
    poster: "/projects/video/raft-poster.webp",
    category: "Consensus systems / Open source",
    stack: "C++ · NuRaft · OpenSSL · CMake",
    description:
      "A replicated insurance event log built on Raft, with quorum writes, leader election, idempotent commands, durable storage, snapshots, and automatic failover.",
    art: raftArt,
  },
];
