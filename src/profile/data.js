// The parts of the canonical professional profile that live nowhere else on the site: identity,
// the skill taxonomy and its evidence, professional strengths, and community work. Projects,
// experience and education are NOT repeated here; src/profile/build.js imports them from
// src/case-studies/data.js, src/projects.js, src/experience.js and src/experience-pages.js, and
// open source comes from the verified GitHub snapshot in ./open-source-contributions.json.
//
// Rules for anything added here (see docs/profile-architecture.md):
// - Every skill and strength names its evidence. A ref is "<kind>:<id>", where kind is
//   project | experience | education | contributions | reviews | repository | resume.
// - `note` says what was actually built or done, in words already published on the site,
//   the résumé or the linked source. No proficiency levels, no years-of-experience numbers.
// - The verification status is derived from the evidence by build.js, never written by hand.
// - A taxonomy entry with no evidence is listed in UNSUPPORTED_STRENGTHS and is not published.

export const PROFILE_SCHEMA_VERSION = "1.1";
// Bump when anything in this file, or the meaning of the generated profile, changes.
export const PROFILE_LAST_MODIFIED = "2026-11-19";

export const identity = {
  id: "atishay-kasliwal",
  name: "Atishay Kasliwal",
  givenName: "Atishay",
  familyName: "Kasliwal",
  // Same wording as the homepage title, masthead and Person schema.
  headline: "Software & AI Engineer",
  tagline: "Full-stack & AI engineer",
  description:
    "Software and AI engineer in New York building distributed systems, LLM products and the interfaces on top of them.",
  // Every sentence below is already published on the homepage, an experience page or llms.txt.
  summary: [
    "Software and AI engineer in New York building distributed systems, LLM products and the interfaces on top of them.",
    "Three years as a senior software engineer at Accolite (now part of Bounteous), shipping production microservices for fintech, telecom and commerce clients.",
    "Then research engineering at Stony Brook University, building LLM services and the infrastructure behind them, and a summer at Wake Forest's Center for Artificial Intelligence Research building an AI radiology platform over 10K+ MRI studies.",
    "M.S. in Data Science from Stony Brook University (2026). Now building Atriveo, a set of small live products for job seekers, health data and personal memory, and contributing to open source projects run by other teams.",
  ],
  location: { locality: "New York", region: "NY", country: "US" },
  openToWork: true,
  currentFocus: "Building Atriveo",
  // The phone number printed on the résumé is deliberately not repeated here.
  contact: { email: "katishay@gmail.com", website: "https://atishaykasliwal.com/" },
};

// What the work concentrates on, each tied to the strongest public evidence for it.
export const specializations = [
  {
    id: "backend-distributed-systems",
    name: "Backend and distributed systems",
    summary: "Event-driven services, replication and the reliability work around them.",
    evidence: ["experience:accolite", "project:insurance-platform", "project:insureraft", "project:chaal-tech", "contributions:kiali/kiali", "contributions:numaproj/numaflow"],
  },
  {
    id: "full-stack-product",
    name: "Full-stack product engineering",
    summary: "Products taken from the database to the screen and kept running in production.",
    evidence: ["project:atriveo-tracker", "project:atriveo-bio", "project:chaal-tech", "project:atriveo-reel", "experience:shriffle"],
  },
  {
    id: "applied-ai-llm",
    name: "Applied AI and LLM applications",
    summary: "LLM features with retrieval, local models, grounding checks and human review.",
    evidence: ["experience:stony-brook-research", "project:fedtalk", "project:atriveo-cortex", "project:atriveo-job-search", "project:atriaa", "contributions:mezmo/aura"],
  },
  {
    id: "data-ml-pipelines",
    name: "Data and machine-learning pipelines",
    summary: "Ingestion, feature pipelines and models evaluated against baselines.",
    evidence: ["experience:wake-forest-cair", "project:atriveo-bio", "project:bayesian-marketing-mix", "project:kaggriculture"],
  },
];

export const skillCategories = [
  { id: "programming-languages", name: "Programming languages" },
  { id: "frontend", name: "Frontend engineering" },
  { id: "backend", name: "Backend engineering" },
  { id: "full-stack", name: "Full-stack development" },
  { id: "databases", name: "Databases and storage" },
  { id: "distributed-systems", name: "Distributed systems" },
  { id: "cloud-infrastructure", name: "Cloud and infrastructure" },
  { id: "devops-ci-cd", name: "DevOps and CI/CD" },
  { id: "ai-engineering", name: "AI engineering" },
  { id: "llm", name: "Large language models" },
  { id: "machine-learning", name: "Machine learning" },
  { id: "data-science", name: "Data science" },
  { id: "data-engineering", name: "Data engineering" },
  { id: "mlops", name: "MLOps" },
  { id: "testing-observability", name: "Testing and observability" },
  { id: "architecture", name: "Architecture and system design" },
  { id: "security", name: "Security" },
];

const e = (ref, note) => ({ ref, note });

export const skills = [
  // ---------- Programming languages ----------
  { id: "python", name: "Python", category: "programming-languages", evidence: [
    e("project:fedtalk", "Transcription, retrieval and prediction pipeline for FOMC conferences."),
    e("project:kaggriculture", "Deterministic game simulator and planner search."),
    e("project:atriveo-job-search", "Hourly job scraper and 0–10 fit scorer."),
    e("project:atriaa", "FastAPI service behind the nurse and patient views."),
    e("experience:wake-forest-cair", "PyTorch segmentation and SimpleITK imaging pipelines."),
    e("contributions:numaproj/numaflow-python", "Updated the asyncio reduce example to the current reducer API."),
    e("contributions:The-PR-Agent/pr-agent", "Test recording which config keys PR comments can override."),
  ] },
  { id: "java", name: "Java", category: "programming-languages", evidence: [
    e("experience:accolite", "20+ production microservices in Java and Spring Boot."),
    e("experience:shriffle", "Billing microservices and telecom integrations in Java."),
    e("project:insurance-platform", "Eight Spring Boot services around a Kafka pipeline."),
  ] },
  { id: "typescript", name: "TypeScript", category: "programming-languages", evidence: [
    e("project:atriveo-cortex", "Hono API, deterministic builders and the private dashboard."),
    e("project:atriveo-bio", "Feature engine and API for HealthKit data."),
    e("project:atriveo-reel", "Next.js workspace and render worker."),
    e("contributions:EthanHenrickson/math-mcp", "Fixed median sorting numbers as strings in an MCP math server."),
    e("contributions:ustaxes/UsTaxes", "Type-only imports for tooling compatibility."),
  ] },
  { id: "javascript", name: "JavaScript", category: "programming-languages", evidence: [
    e("project:atriveo-tracker", "Chrome MV3 extension that reads job pages on 60 sites."),
    e("project:chaal-tech", "SvelteKit game client and server rules modules."),
    e("contributions:Seagey/couch-tv", "Build step that fetches a TV app's own icon when no logo is bundled."),
  ] },
  { id: "go", name: "Go", category: "programming-languages", evidence: [
    e("contributions:kiali/kiali", "Bounded Kubernetes cache reads with a timeout; confirmed revoked access before tearing down a cluster cache."),
    e("contributions:redhat-developer/mapt", "Fixes to context handling, SSH password aging and runner setup in a provisioning tool."),
    e("contributions:dsx-ai-factory/nvkr", "CLI features: catalog show, run list, release diff and filters."),
    e("contributions:dsx-ai-factory/workload-map", "kli CLI sorting, filter flags and a STATUS column."),
  ] },
  { id: "rust", name: "Rust", category: "programming-languages", evidence: [
    e("contributions:mezmo/aura", "Orchestration, event and tool-filter fixes in an SRE agent platform."),
    e("contributions:numaproj/numaflow-rs", "Side input server tests and an updated source example."),
    e("contributions:anefzaoui/misterdownloadmanager", "System yt-dlp support and macOS window fixes."),
  ] },
  { id: "cpp", name: "C++", category: "programming-languages", evidence: [
    e("project:insureraft", "Raft-replicated insurance event log on NuRaft."),
  ] },
  { id: "sql", name: "SQL", category: "programming-languages", evidence: [
    e("project:atriveo-tracker", "36 ordered SQL migrations on Postgres."),
    e("experience:accolite", "Financial-data backend on PostgreSQL; insurance data vault on SQL."),
  ] },
  { id: "swift", name: "Swift", category: "programming-languages", evidence: [
    e("project:atriveo-bio", "SwiftUI iPhone app that syncs HealthKit data."),
  ] },

  // ---------- Frontend ----------
  { id: "react", name: "React", category: "frontend", evidence: [
    e("project:atriveo-tracker", "Application dashboard."),
    e("project:atriveo-cortex", "Private dashboard on Cloudflare Pages."),
    e("experience:wake-forest-cair", "Dashboard where physicians review and correct tumor masks."),
    e("experience:shriffle", "Real-time operations dashboard."),
  ] },
  { id: "nextjs", name: "Next.js", category: "frontend", evidence: [
    e("project:atriveo-reel", "Single-page editing workspace that queues render jobs."),
    e("project:atriaa", "Patient, nurse and front-desk views."),
  ] },
  { id: "sveltekit", name: "SvelteKit", category: "frontend", evidence: [
    e("project:chaal-tech", "Game client on Cloudflare Pages."),
  ] },
  { id: "browser-extensions", name: "Browser extensions (Chrome MV3)", category: "frontend", evidence: [
    e("project:atriveo-tracker", "One-click capture with per-site extractors and duplicate checks."),
  ] },
  { id: "web-accessibility", name: "Web accessibility", category: "frontend", evidence: [
    e("contributions:keycloak/keycloak", "Accessible names for the masthead options toggle and the Groups page checkboxes."),
    e("contributions:cockpit-project/cockpit", "Made the terminal scrollbar and selection visible in all themes."),
  ] },

  // ---------- Backend ----------
  { id: "spring-boot", name: "Spring Boot", category: "backend", evidence: [
    e("experience:accolite", "Production microservices for fintech, telecom and commerce clients."),
    e("experience:shriffle", "Billing REST APIs."),
    e("project:insurance-platform", "Gateway, discovery, ingestion and query services."),
  ] },
  { id: "fastapi", name: "FastAPI", category: "backend", evidence: [
    e("project:atriaa", "Atria API over Postgres and TimescaleDB."),
    e("experience:stony-brook-research", "Research platform services on Google Cloud."),
  ] },
  { id: "hono", name: "Hono", category: "backend", evidence: [
    e("project:atriveo-tracker", "API on Cloudflare Workers."),
    e("project:atriveo-bio", "Readiness API."),
    e("project:atriveo-cortex", "Sync and dashboard API."),
  ] },
  { id: "django", name: "Django REST Framework", category: "backend", evidence: [
    e("experience:stony-brook-research", "Async backend ingesting 10,000+ FOMC intervals."),
  ] },
  { id: "rest-api-design", name: "REST API design", category: "backend", evidence: [
    e("project:atriveo-bio", "Documented OpenAPI for wearable data."),
    e("experience:shriffle", "Spring Boot REST APIs for billing."),
    e("project:atriveo-tracker", "Extension and dashboard API with server-side duplicate checks."),
  ] },
  { id: "websockets", name: "WebSockets and real-time state", category: "backend", evidence: [
    e("project:chaal-tech", "Native WebSockets to an authoritative room server."),
  ] },
  { id: "nodejs", name: "Node.js", category: "backend", evidence: [
    e("project:atriveo-job-search", "Express server and a Node sidecar with a job queue."),
  ] },

  // ---------- Full stack ----------
  { id: "full-stack-delivery", name: "End-to-end product delivery", category: "full-stack", evidence: [
    e("project:atriveo-tracker", "Extension, API, Postgres and dashboard, live since March 2026."),
    e("project:atriveo-bio", "iPhone app, feature store, API and documentation site."),
    e("project:chaal-tech", "Live multiplayer game with server-side rules."),
    e("project:atriveo-reel", "Web app, queue and renderer on one machine."),
  ] },

  // ---------- Databases ----------
  { id: "postgresql", name: "PostgreSQL", category: "databases", evidence: [
    e("project:atriveo-tracker", "Neon Postgres with ordered migrations."),
    e("project:atriveo-bio", "Append-only samples and derived features through Prisma."),
    e("experience:accolite", "High-volume financial-data backend."),
  ] },
  { id: "sqlite", name: "SQLite", category: "databases", evidence: [
    e("project:atriveo-reel", "Durable render-job queue."),
    e("project:atriveo-cortex", "Local knowledge store."),
    e("project:chaal-tech", "SQLite-backed Durable Object per room."),
  ] },
  { id: "elasticsearch", name: "Elasticsearch", category: "databases", evidence: [
    e("project:insurance-platform", "Read side of a CQRS split."),
    e("experience:accolite", "Rearchitected British Telecom services on Redis and Elasticsearch, cutting P99 latency 40%."),
  ] },
  { id: "redis", name: "Redis", category: "databases", evidence: [
    e("project:insurance-platform", "Per-route rate limits at the gateway."),
    e("experience:accolite", "Redis caching in the British Telecom rearchitecture that cut P99 latency 40%."),
  ] },
  { id: "timescaledb", name: "TimescaleDB", category: "databases", evidence: [
    e("project:atriaa", "Vitals stored in a hypertable."),
  ] },
  { id: "neo4j", name: "Neo4j", category: "databases", evidence: [
    e("project:medscan", "Derived relationship graph next to authoritative Postgres schemas."),
  ] },
  { id: "dynamodb", name: "DynamoDB", category: "databases", evidence: [
    e("resume", "Listed for the Stony Brook research services on the résumé."),
  ] },

  // ---------- Distributed systems ----------
  { id: "event-driven-architecture", name: "Event-driven architecture", category: "distributed-systems", evidence: [
    e("project:insurance-platform", "Policy changes as Kafka events consumed by search, analytics and the gateway."),
    e("experience:stony-brook-research", "Async, event-driven backend for research data."),
  ] },
  { id: "kafka", name: "Apache Kafka", category: "distributed-systems", evidence: [
    e("project:insurance-platform", "Avro events on a three-broker cluster."),
    e("experience:accolite", "Financial-data backend on Kafka, Airflow and PostgreSQL."),
  ] },
  { id: "cqrs-event-sourcing", name: "CQRS and event sourcing", category: "distributed-systems", evidence: [
    e("project:insurance-platform", "Writes to Kafka, reads from Elasticsearch."),
  ] },
  { id: "consensus-replication", name: "Consensus and replication (Raft)", category: "distributed-systems", evidence: [
    e("project:insureraft", "Quorum writes, learner nodes and snapshot catch-up on NuRaft."),
  ] },
  { id: "idempotency", name: "Idempotent processing", category: "distributed-systems", evidence: [
    e("project:atriveo-tracker", "Per-day idempotency key on the digest cron."),
    e("project:insureraft", "Event-ID deduplication before state changes."),
  ] },
  { id: "resilience-patterns", name: "Resilience: timeouts, circuit breakers, rate limits", category: "distributed-systems", evidence: [
    e("contributions:kiali/kiali", "Timeout on Kubernetes cache reads so a lost cluster cannot block a read."),
    e("experience:stony-brook-research", "Connection pooling and circuit breakers on LLM services."),
  ] },
  { id: "stream-processing", name: "Stream processing", category: "distributed-systems", evidence: [
    e("contributions:numaproj/numaflow", "Per-edge watermark metric and payload-size logging in a streaming platform."),
    e("project:insurance-platform", "Kafka Streams state store."),
  ] },

  // ---------- Cloud and infrastructure ----------
  { id: "cloudflare", name: "Cloudflare Workers, Durable Objects, D1 and R2", category: "cloud-infrastructure", evidence: [
    e("project:atriveo-tracker", "Workers API, Pages dashboard and R2 storage."),
    e("project:chaal-tech", "Durable Object per room."),
    e("repository:atishaykasliwal.com", "This site's Pages Functions, D1 photography library and R2 uploads."),
  ] },
  { id: "kubernetes", name: "Kubernetes", category: "cloud-infrastructure", evidence: [
    e("contributions:kiali/kiali", "Kubernetes client cache behaviour in a service-mesh console."),
    e("contributions:numaproj/numaflow", "MonoVertex scale validation in a Kubernetes-native platform."),
    e("experience:accolite", "Jenkins, Docker and Kubernetes deployment pipeline."),
  ] },
  { id: "docker", name: "Docker", category: "cloud-infrastructure", evidence: [
    e("project:atriveo-job-search", "Docker Compose as one of three ways to run it."),
    e("experience:accolite", "Containerised deployment pipeline."),
  ] },
  { id: "gcp", name: "Google Cloud Platform", category: "cloud-infrastructure", evidence: [
    e("experience:wake-forest-cair", "Medical-imaging platform on GCP."),
    e("experience:stony-brook-research", "Research platform front end on Google Cloud."),
    e("experience:shriffle", "Billing services on GCP."),
  ] },
  { id: "aws", name: "AWS", category: "cloud-infrastructure", evidence: [
    e("experience:accolite", "Insurance data vault on AWS Lambda."),
    e("project:medscan", "AWS Lambda in the proof of concept."),
  ] },
  { id: "cloud-provisioning", name: "Cloud provisioning tooling", category: "cloud-infrastructure", evidence: [
    e("contributions:redhat-developer/mapt", "Fixes and new VM sizes in Red Hat's multi-architecture provisioning tool."),
  ] },
  { id: "terraform", name: "Terraform", category: "cloud-infrastructure", evidence: [
    e("resume", "Listed for GCP provisioning at Wake Forest CAIR on the résumé."),
  ] },

  // ---------- DevOps and CI/CD ----------
  { id: "ci-cd", name: "CI/CD pipelines", category: "devops-ci-cd", evidence: [
    e("experience:accolite", "CI/CD and canary releases standardised across 8 teams; deploys from 6 hours to 90 seconds."),
    e("contributions:mezmo/aura", "CI publishes integration results even after test failures."),
    e("repository:atishaykasliwal.com", "GitHub Actions deploy, SEO and Lighthouse workflows for this site."),
  ] },
  { id: "jenkins", name: "Jenkins", category: "devops-ci-cd", evidence: [
    e("experience:accolite", "Jenkins, Docker and Kubernetes pipeline for 20 engineers."),
  ] },
  { id: "release-tooling", name: "Release and CLI tooling", category: "devops-ci-cd", evidence: [
    e("contributions:dsx-ai-factory/nvkr", "release diff and release browse filters."),
    e("contributions:dsx-ai-factory/workload-map", "kli get --sort-by and definition filters."),
  ] },

  // ---------- AI engineering ----------
  { id: "ai-product-integration", name: "AI features in products", category: "ai-engineering", evidence: [
    e("project:atriaa", "Gemini answers with a labeled deterministic fallback when a cited number is not in the evidence."),
    e("project:atriveo-cortex", "Local model proposals rated good, okay or bad in an inspector."),
    e("experience:stony-brook-research", "LLM service components in production."),
  ] },
  { id: "agent-tooling", name: "Agent and MCP tooling", category: "ai-engineering", evidence: [
    e("contributions:mezmo/aura", "Tool filters, human-in-the-loop gating and MCP transport handling in an SRE agent platform."),
    e("contributions:EthanHenrickson/math-mcp", "Correct median and division-by-zero errors in MCP math tools."),
    e("contributions:The-PR-Agent/pr-agent", "Configuration tests in an AI pull request reviewer."),
  ] },
  { id: "human-in-the-loop", name: "Human-in-the-loop AI design", category: "ai-engineering", evidence: [
    e("project:atriaa", "The model alerts; a nurse decides priority."),
    e("project:atriveo-cortex", "Every extraction reviewed and rated."),
  ] },
  { id: "model-evaluation", name: "Evaluation against baselines", category: "ai-engineering", evidence: [
    e("project:fedtalk", "Predictions scored on realized SPY prices: 58.7% directional accuracy, 0.74 weighted F1 on the labeled set."),
    e("project:atriveo-bio", "A model replaces the rules only after beating three baselines."),
  ] },

  // ---------- Large language models ----------
  { id: "llm-applications", name: "LLM applications", category: "llm", evidence: [
    e("project:fedtalk", "GPT-4o-mini predicts market direction; GPT-3.5 filters news."),
    e("project:atriveo-job-search", "Local Gemma selects real résumé bullets per job."),
    e("project:atriaa", "Ask Atria answers with citations to tickets, readings and times."),
  ] },
  { id: "rag", name: "Retrieval-augmented generation", category: "llm", evidence: [
    e("project:fedtalk", "Statement and news sentences in two Pinecone indexes as model context."),
    e("experience:stony-brook-research", "Whisper transcription and Pinecone retrieval in FedTalk."),
  ] },
  { id: "local-llms", name: "Local models (Ollama)", category: "llm", evidence: [
    e("project:atriveo-cortex", "Gemma on Ollama proposes projects, commitments and ideas."),
    e("project:atriveo-job-search", "Gemma on Ollama, no API costs and no data sent."),
  ] },
  { id: "structured-outputs", name: "Structured LLM outputs", category: "llm", evidence: [
    e("project:atriveo-job-search", "JSON schema with capped lists and token-budget retries."),
  ] },
  { id: "embeddings-vector-search", name: "Embeddings and vector search", category: "llm", evidence: [
    e("project:fedtalk", "mpnet sentence embeddings in Pinecone."),
  ] },
  { id: "speech-to-text", name: "Speech-to-text (Whisper)", category: "llm", evidence: [
    e("project:fedtalk", "Whisper transcription of FOMC press conferences."),
  ] },

  // ---------- Machine learning ----------
  { id: "pytorch", name: "PyTorch", category: "machine-learning", evidence: [
    e("experience:wake-forest-cair", "Tumor segmentation at 90%+ mask accuracy."),
  ] },
  { id: "medical-imaging", name: "Medical imaging pipelines", category: "machine-learning", evidence: [
    e("experience:wake-forest-cair", "N4ITK bias correction, SimpleITK standardisation across 5 modalities, PyRadiomics features."),
  ] },
  { id: "xgboost", name: "XGBoost", category: "machine-learning", evidence: [
    e("project:atriveo-bio", "Readiness model trained offline and gated on baselines."),
  ] },
  { id: "scikit-learn", name: "scikit-learn", category: "machine-learning", evidence: [
    e("project:bayesian-marketing-mix", "Ridge model with time-series cross-validation."),
  ] },
  { id: "simulation-search", name: "Simulation and planning search", category: "machine-learning", evidence: [
    e("project:kaggriculture", "Simulator matched to the real engine, planner search and opponent rollouts."),
  ] },

  // ---------- Data science ----------
  { id: "statistical-modeling", name: "Statistical modeling", category: "data-science", evidence: [
    e("project:bayesian-marketing-mix", "Adstock decay and Hill saturation per channel, on synthetic data."),
    e("education:stony-brook-university", "Probability, statistical learning and statistical computing coursework."),
  ] },
  { id: "monte-carlo", name: "Monte Carlo simulation", category: "data-science", evidence: [
    e("project:bayesian-marketing-mix", "1,000-run Monte Carlo for uncertainty bounds."),
  ] },
  { id: "time-series-validation", name: "Time-series validation", category: "data-science", evidence: [
    e("project:bayesian-marketing-mix", "5-fold time-series split, never scored out of order."),
  ] },
  { id: "nlp", name: "Natural language processing", category: "data-science", evidence: [
    e("education:stony-brook-university", "AMS 691 topics course on natural language processing."),
    e("experience:stony-brook-research", "Sentiment benchmark on 1,159 five-minute intervals."),
  ] },

  // ---------- Data engineering ----------
  { id: "etl-pipelines", name: "ETL and data pipelines", category: "data-engineering", evidence: [
    e("experience:wake-forest-cair", "Apache Airflow ETL building research-ready cohorts."),
    e("experience:accolite", "Kafka and Airflow financial-data backend."),
    e("project:atriveo-bio", "Append-only samples rolled up into daily and hourly features."),
  ] },
  { id: "airflow", name: "Apache Airflow", category: "data-engineering", evidence: [
    e("experience:wake-forest-cair", "Imaging ETL."),
    e("experience:accolite", "Financial-data backend."),
  ] },
  { id: "feature-engineering", name: "Feature engineering", category: "data-engineering", evidence: [
    e("project:atriveo-bio", "Personal 30-day baselines for sleep, HRV, resting heart rate and activity."),
    e("experience:wake-forest-cair", "200+ radiomic biomarkers; 500+ features for the stroke study."),
  ] },
  { id: "web-scraping", name: "Web scraping", category: "data-engineering", evidence: [
    e("project:atriveo-job-search", "Hourly LinkedIn, Greenhouse and Lever scraping."),
  ] },

  // ---------- MLOps ----------
  { id: "model-gating", name: "Baseline-gated model promotion", category: "mlops", evidence: [
    e("project:atriveo-bio", "The rules-based score stays the default until a model beats all three baselines."),
  ] },
  { id: "production-inference-reliability", name: "Production inference reliability", category: "mlops", evidence: [
    e("experience:stony-brook-research", "Connection pooling and circuit breakers cut inference timeouts 80%."),
  ] },

  // ---------- Testing and observability ----------
  { id: "automated-testing", name: "Automated testing", category: "testing-observability", evidence: [
    e("project:kaggriculture", "Simulator asserted turn by turn against Kaggle's engine."),
    e("contributions:numaproj/numaflow-rs", "Side input server tests."),
    e("contributions:statsmodels/statsmodels", "Array-layout checks at the Cython entry points."),
    e("experience:shriffle", "JUnit coverage raised to 99%."),
  ] },
  { id: "observability", name: "Observability and metrics", category: "testing-observability", evidence: [
    e("contributions:numaproj/numaflow", "Per-edge watermark exposed as a pipeline daemon metric."),
    e("project:insurance-platform", "Prometheus, Grafana and ELK across all 8 services."),
  ] },

  // ---------- Architecture ----------
  { id: "microservices", name: "Microservices architecture", category: "architecture", evidence: [
    e("experience:accolite", "20+ production microservices."),
    e("project:insurance-platform", "Service discovery, gateway and eight services."),
  ] },
  { id: "architecture-decision-records", name: "Architecture decision records", category: "architecture", evidence: [
    e("contributions:dsx-ai-factory/nvkr", "ADR-26: gate the combined-Definition cutover on output equivalence."),
    e("project:atriveo-cortex", "Deterministic builders written up as ADRs."),
  ] },
  { id: "modular-boundaries", name: "Module boundaries and data ownership", category: "architecture", evidence: [
    e("project:medscan", "Four modules with their own schemas, enforced by tests."),
    e("project:atriveo-reel", "The web app never renders; a separate worker does."),
  ] },

  // ---------- Security ----------
  { id: "authentication-authorization", name: "Authentication and authorization", category: "security", evidence: [
    e("experience:accolite", "Spring Security, OAuth2 and JWT on Fidelity backend services."),
    e("project:insurance-platform", "JWT checked once at the gateway."),
    e("project:atriveo-tracker", "PBKDF2 password hashing on the Worker."),
    e("contributions:kiali/kiali", "Confirm revoked access before tearing down a cluster cache."),
  ] },
];

// Professional strengths. Only entries with evidence are published; build.js derives the status.
// Mentoring is never inferred from code, and leadership is never inferred from a personal project.
export const strengthCategories = ["Communication", "Leadership", "Mentoring", "Collaboration", "Problem solving", "Professional skills"];

export const professionalStrengths = [
  {
    id: "technical-documentation",
    name: "Technical documentation",
    category: "Communication",
    description: "Documentation changes accepted by open source maintainers, and written engineering records for my own systems.",
    examples: [
      e("contributions:numaproj/numaflow", "Rewrote SDK examples into content tabs and updated a Rust source example; merged."),
      e("contributions:dsx-ai-factory/nvkr", "Wrote ADR-26 on gating a cutover on output equivalence; merged."),
      e("contributions:mezmo/aura", "Documented what result_preview is; merged."),
      e("project:atriveo-cortex", "62 engineering reports and ADRs in the repository."),
    ],
  },
  {
    id: "technical-communication",
    name: "Explaining technical work",
    category: "Communication",
    description: "Case studies that state the problem, the architecture, the decisions and the limits of each result.",
    examples: [
      e("project:bayesian-marketing-mix", "States plainly that every dollar figure comes from a fixed random seed."),
      e("project:atriaa", "Says it is synthetic data only and not a medical device."),
    ],
  },
  {
    id: "stakeholder-communication",
    name: "Working with domain experts",
    category: "Communication",
    description: "Built tools around the review workflow of the people who use them.",
    examples: [
      e("experience:wake-forest-cair", "A dashboard where physicians review and correct masks, for a 20-person physician-research team."),
      e("experience:stony-brook-research", "Dashboards that make model output usable for a research team."),
    ],
  },
  {
    id: "project-ownership",
    name: "End-to-end ownership",
    category: "Leadership",
    description: "Products designed, shipped and kept running by me. This is individual ownership, not people leadership.",
    examples: [
      e("project:atriveo-tracker", "Owner-only dashboard in February 2026, public sign-up and extension within two weeks, live since."),
      e("project:atriveo-bio", "iPhone app, API and documentation in public beta since June 2026."),
      e("project:chaal-tech", "Live game with an authoritative server per room."),
    ],
  },
  {
    id: "technical-leadership",
    name: "Cross-team engineering standards",
    category: "Leadership",
    description: "Standardised delivery practices beyond a single team.",
    examples: [
      e("experience:accolite", "Standardised CI/CD and canary releases across 8 teams, preventing 12+ incidents before production."),
    ],
  },
  {
    id: "design-proposals",
    name: "Leading design decisions in the open",
    category: "Leadership",
    description: "Proposed and documented design decisions that upstream maintainers accepted.",
    examples: [
      e("contributions:dsx-ai-factory/nvkr", "ADR-26 merged upstream."),
    ],
  },
  {
    id: "mentoring",
    name: "Mentoring interns",
    category: "Mentoring",
    description: "Mentored interns at Accolite into full-time roles.",
    examples: [e("experience:accolite", "Interns mentored into full-time roles.")],
  },
  {
    id: "technical-interviewing",
    name: "Technical interviewing",
    category: "Mentoring",
    description: "Conducted 500+ technical interviews at Accolite.",
    examples: [e("experience:accolite", "500+ technical interviews.")],
  },
  {
    id: "code-review",
    name: "Code review",
    category: "Mentoring",
    description: "Public reviews of pull requests by other contributors in open source projects.",
    examples: [e("reviews:github", "Reviews on other contributors' pull requests, listed from GitHub.")],
  },
  {
    id: "open-source-collaboration",
    name: "Collaborating through review",
    category: "Collaboration",
    description: "Changes taken through maintainer review to a merge in projects run by other teams.",
    examples: [
      e("contributions:mezmo/aura", "Merged fixes in Mezmo's SRE agent platform."),
      e("contributions:numaproj/numaflow", "Merged features, fixes and documentation."),
      e("contributions:redhat-developer/mapt", "Merged fixes in Red Hat's provisioning tool."),
    ],
  },
  {
    id: "cross-functional-collaboration",
    name: "Cross-functional collaboration",
    category: "Collaboration",
    description: "Engineering work inside research and clinical teams.",
    examples: [
      e("experience:wake-forest-cair", "Platform built with doctors, residents and researchers as its users."),
      e("experience:stony-brook-research", "A workflow for 5 researchers and analysts."),
    ],
  },
  {
    id: "debugging-root-cause",
    name: "Debugging and root-cause fixes",
    category: "Problem solving",
    description: "Reproduced and fixed defects in unfamiliar codebases.",
    examples: [
      e("contributions:redhat-developer/mapt", "Stopped password aging from locking users out of SSH."),
      e("contributions:kiali/kiali", "Bounded kube cache reads so a lost cluster cannot block a read."),
      e("contributions:EthanHenrickson/math-mcp", "Median sorted numbers as strings; fixed and reported division by zero as an error."),
    ],
  },
  {
    id: "analytical-thinking",
    name: "Measuring before claiming",
    category: "Problem solving",
    description: "Results scored against reality or a baseline rather than asserted.",
    examples: [
      e("project:fedtalk", "Scored on realized price, not the model's own features."),
      e("project:atriveo-bio", "Models must beat yesterday, a 7-day average and the rules."),
      e("project:kaggriculture", "Each phase validated before the next began."),
    ],
  },
  {
    id: "concurrent-commitments",
    name: "Managing concurrent commitments",
    category: "Professional skills",
    description: "Held a research engineering role through a full-time M.S. program.",
    examples: [
      e("education:stony-brook-university", "The research role ran through the degree; three semesters of AMS 585 internship credit."),
      e("experience:wake-forest-cair", "Summer 2025 role alongside the Stony Brook research position."),
    ],
  },
  {
    id: "continuous-learning",
    name: "Continuous learning",
    category: "Professional skills",
    description: "Coursework beyond the degree requirements.",
    examples: [e("education:symbiosis-university", "22 courses and workshops between 2018 and 2021, including IBM's Python for Data Science and AI.")],
  },
];

// Requested taxonomy entries with no evidence found in the site, the résumé or public sources.
// They are NOT published as strengths. Add one back only with a real evidence ref.
export const UNSUPPORTED_STRENGTHS = [
  "Presentations and demonstrations",
  "Working with product managers and designers",
  "Conflict resolution",
  "Creative problem solving",
  "Working through ambiguity",
  "Time management",
  "Adaptability",
  "Prioritization",
  "Customer empathy",
  "Attention to detail",
];

// Primary language and domain for each repository with merged work, used for the contribution
// records' `skills`. Chosen from the merged pull request titles, not the repository's top language.
export const contributionSkills = {
  "anefzaoui/misterdownloadmanager": ["rust"],
  "cockpit-project/cockpit": ["web-accessibility"],
  "dsx-ai-factory/nvkr": ["go", "release-tooling", "architecture-decision-records"],
  "dsx-ai-factory/workload-map": ["go", "release-tooling"],
  "emmabostian/developer-portfolios": [],
  "EthanHenrickson/math-mcp": ["typescript", "agent-tooling"],
  "keycloak/keycloak": ["web-accessibility"],
  "kiali/kiali": ["go", "kubernetes", "resilience-patterns", "authentication-authorization"],
  "mezmo/aura": ["rust", "agent-tooling", "ci-cd"],
  "numaproj/numaflow": ["stream-processing", "observability", "kubernetes"],
  "numaproj/numaflow-python": ["python", "stream-processing"],
  "numaproj/numaflow-rs": ["rust", "automated-testing"],
  "redhat-developer/mapt": ["go", "cloud-provisioning"],
  "Seagey/couch-tv": ["javascript"],
  "statsmodels/statsmodels": ["python", "automated-testing"],
  "The-PR-Agent/pr-agent": ["python", "agent-tooling"],
  "ustaxes/UsTaxes": ["typescript"],
};

// Facts the project pages state that a third party can check in the public repository (the
// comment beside each stat in src/case-studies/data.js names the file). Stats not listed here are
// the author's own statement and are published as self-reported.
export const repositoryCheckableStats = {
  "atriveo-tracker": ["60", "7"],
  "atriveo-cortex": ["222", "62", "71"],
  "atriveo-bio": ["6", "3", "30-day"],
  "atriveo-job-search": ["0–10", "1 page"],
  "insurance-platform": ["8", "3", "54"],
  fedtalk: ["33", "58.7%", "0.74"],
  "atriveo-reel": ["4", "1080×1920", "17"],
  insureraft: ["3", "8", "1,469"],
  kaggriculture: ["9", "720", "1,738"],
  "bayesian-marketing-mix": ["0.9489", "2.74%", "5.5% → 47.3%"],
  atriaa: ["3", "8", "0"],
};

// Where each experience entry happened. Stony Brook and Wake Forest match their pages; Accolite
// is from the résumé; Shriffle has no published location, so none is given.
export const experienceDetails = {
  "stony-brook-research": { location: { locality: "Stony Brook", region: "NY", country: "US" }, organizationUrl: "https://www.stonybrook.edu" },
  "wake-forest-cair": { location: { locality: "Winston-Salem", region: "NC", country: "US" }, organization: "Wake Forest University School of Medicine, Center for Artificial Intelligence Research (CAIR)", organizationUrl: "https://school.wakehealth.edu" },
  accolite: { location: { locality: "Hyderabad", region: "Telangana", country: "IN" }, alternateNames: ["Accolite Digital", "Bounteous x Accolite"], organizationUrl: "https://www.bounteous.com" },
  shriffle: { organization: "Shriffle Technologies", employmentType: "internship" },
  "stony-brook-university": { location: { locality: "Stony Brook", region: "NY", country: "US" }, degree: "Master of Science", field: "Data Science", organizationUrl: "https://www.stonybrook.edu" },
  // Name and degree title as printed on the résumé; the site uses the short forms.
  "symbiosis-university": { location: { locality: "Indore", region: "Madhya Pradesh", country: "IN" }, organization: "Symbiosis University of Applied Sciences", degree: "Bachelor of Technology", field: "Computer Science and Information Technology", organizationUrl: "https://suas.ac.in" },
};

// Public repositories that are evidence but not portfolio projects.
export const repositories = {
  "atishaykasliwal.com": {
    title: "Source of this website",
    url: "https://github.com/atishay-kasliwal/atishaykasliwal.com",
  },
};
