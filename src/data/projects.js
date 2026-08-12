/**
 * Project case studies.
 *
 * Each entry is a full case study, not a card: problem, architecture,
 * decisions, challenges, metrics, lessons. This is the depth recruiters and
 * hiring managers actually read, and it is what earns long-tail search traffic
 * ("RAG latency", "FOMC sentiment NLP") rather than only name queries.
 *
 * Metrics are carried over from Atishay Kasliwal's own resume claims; the
 * narrative framing has been reviewed and approved by him.
 *
 * ── Fields the /projects browse page adds on top of the case study ──────────
 *
 * `spotlight`  Rotation slot in the trailer hero, 1..n. Omit to keep a project
 *              out of the hero entirely. Sorted ascending, so this is an
 *              editorial ordering, not a computed one.
 * `uuid`       The live interactive demo at /highlights/<uuid>, when one
 *              exists. This is the bridge to src/data/highlights.js — see the
 *              header there. Absent means there is nothing to play on-domain.
 * `video`      Screen recording, or null. Shape:
 *                { poster, preview, trailer }
 *              `preview` and `trailer` accept either a full path with an
 *              extension ('/clip.mp4') or an extensionless basename
 *              ('/video/atriveo-card'), in which case .webm and .mp4 are both
 *              offered as <source> elements — see mediaSources() in
 *              components/browse/videoSupport.js. Null is a fully supported
 *              state; every surface falls back to `image`, so recordings can
 *              land one project at a time.
 * `writeup`    Slug of the blog post telling this project's story, or absent.
 * `links`      Extra destinations for the info overlay, beyond the case study /
 *              demo / GitHub links already derived from the fields above.
 */

/**
 * PLACEHOLDER — every project currently points its preview and trailer at the
 * same clip, the one the retired /highlights hero used.
 *
 * It exists so the browse page's motion can be built and reviewed before the
 * real screen recordings are captured. Replace per project as recordings land:
 * set `video` to { poster, preview, trailer } with that project's own paths and
 * delete the reference here. When every project has its own, delete this too.
 *
 * Nothing else is placeholder-aware — `video: null` is equally valid and falls
 * back to the poster image — so removing this constant degrades gracefully
 * rather than breaking the page.
 */
const DEMO_VIDEO = {
  poster: null,
  preview: '/featured-project.mp4',
  trailer: '/featured-project.mp4',
};

export const PROJECTS = [
  {
    slug: 'atriveo',
    name: 'Atriveo',
    tagline: 'Job-search platform with a 5.0-rated Chrome extension and live customers.',
    category: 'Product',
    featured: true,
    spotlight: 1,
    status: 'Live',
    year: '2026',
    timeline: 'Jan 2026 — Present',
    role: 'Founder, sole engineer',
    href: 'https://atriveo.com/',
    demo: 'https://atriveo.com/',
    github: 'https://github.com/atishay-kasliwal/atriveo-app',
    video: DEMO_VIDEO,
    writeup: 'atriveo-capture-before-analytics',
    links: [
      { label: 'Chrome Web Store', href: 'https://chromewebstore.google.com/detail/atriveo-job-assistant/ocbmncmmepfjgpnakenoibaambecidcf' },
      { label: 'Product walkthrough', href: '/atriveo' },
    ],
    image: {
      src: '/projects/atriveo-cover.jpg',
      tile: '/projects/atriveo-tile.jpg',
      width: 1600,
      height: 900,
      alt: 'Atriveo network insights dashboard: a weekly application-volume chart beside a leaderboard and streak panel',
    },
    stack: ['TypeScript', 'React', 'Python', 'FastAPI', 'PostgreSQL', 'Docker', 'Chrome Extension API'],
    metrics: [
      { value: '100+', label: 'active customers' },
      { value: '2K+', label: 'daily queries' },
      { value: '99.9%', label: 'uptime' },
      { value: '5.0★', label: 'Chrome Web Store' },
    ],
    problem:
      'Job seekers apply across dozens of portals and lose the thread almost immediately. The tracking burden lands exactly when attention is scarcest, so spreadsheets go stale within a week and there is no reliable picture of what is actually working.',
    approach:
      'Capture has to be passive. A Chrome extension detects application submissions on the page and writes them to a central pipeline without the user doing anything, which turns tracking from a chore into a byproduct.',
    architecture: [
      'Chrome extension (MV3) detects submission events via DOM heuristics per job board and posts normalized payloads to the API.',
      'FastAPI service validates and deduplicates, then persists to PostgreSQL with a normalized company/role schema.',
      'React + TypeScript dashboard reads aggregate pipeline analytics — stage conversion, response times, source effectiveness.',
      'Containerized with Docker; deployed behind a CDN with per-user auth boundaries.',
    ],
    decisions: [
      {
        decision: 'Passive capture over manual entry',
        rationale:
          'Every competing tool asks the user to log applications. Adherence collapses within days. Detecting submissions server-agnostically in the extension was harder to build but is the only version people keep using.',
      },
      {
        decision: 'Per-board heuristics instead of one generic parser',
        rationale:
          'A universal parser degraded badly on the long tail. Explicit adapters for the highest-traffic boards produce far better precision, at the cost of ongoing maintenance as those sites change.',
      },
      {
        decision: 'PostgreSQL over a document store',
        rationale:
          'Pipeline analytics are relational — conversion between stages, grouping by company and source. Normalized tables made those queries trivial where a document store would have forced aggregation into application code.',
      },
    ],
    challenges: [
      'Job boards restructure their DOM without notice, silently breaking capture. Required detection health checks that alert on a drop in capture rate rather than waiting for user reports.',
      'Deduplicating the same application submitted through multiple channels, where the company and title strings never match exactly.',
      'Chrome Web Store review cycles made the extension the slowest part of the release loop, which pushed as much logic as possible server-side where it could ship immediately.',
    ],
    lessons: [
      'Shipping the extension server-light was the decision that mattered most — logic behind the API can be fixed in minutes, logic in the extension takes days to reach users.',
      'A 5.0 rating came from responding to every early review personally, not from feature volume.',
    ],
  },
  {
    slug: 'fomc-intelligence',
    name: 'FOMC Intelligence',
    tagline: 'NLP pipeline turning Federal Reserve communications into market signals.',
    category: 'Applied Research',
    featured: true,
    spotlight: 2,
    status: 'Research',
    year: '2025',
    timeline: 'Nov 2024 — Present',
    role: 'Graduate Research Assistant, Stony Brook University',
    href: '/projects/fomc-intelligence',
    uuid: 'd4e5f6a7-b8c9-4012-d345-6789abcdef01',
    demo: '/highlights/d4e5f6a7-b8c9-4012-d345-6789abcdef01',
    github: 'https://github.com/atishay-kasliwal/fedtalk-openai-analysis-main',
    video: DEMO_VIDEO,
    writeup: 'point-in-time-correctness',
    image: {
      src: '/projects/fomc-intelligence-cover.jpg',
      tile: '/projects/fomc-intelligence-tile.jpg',
      width: 1600,
      height: 900,
      alt: 'A rendered candlestick chart trending downward — illustrative of the markets this pipeline reads, not a screenshot of it',
    },
    stack: ['Python', 'FastAPI', 'AWS Lambda', 'S3', 'DynamoDB', 'NLP', 'Transformers', 'Prometheus'],
    metrics: [
      { value: '200K+', label: 'data points processed' },
      { value: '3.7K+', label: 'time-series intervals' },
      { value: '<300ms', label: 'P99 API latency' },
      { value: '27%', label: 'simulated portfolio return' },
    ],
    problem:
      'Federal Reserve language moves markets, but the signal is buried in hedged prose. The interesting question is not what the FOMC said — it is what changed since the last statement, and whether that delta is priced in.',
    approach:
      'Treat each statement, minutes release, and speech as a document in a time series. Extract sentiment and stance, diff against the prior release, and align the result to market data on the same intervals.',
    architecture: [
      'Ingestion: AWS Lambda pulls Fed publications and financial news on a schedule, landing raw documents in S3 with schema validation at the boundary.',
      'Processing: transformer-based sentiment and stance extraction, plus statement-over-statement diffing to isolate what actually changed.',
      'Storage: DynamoDB holds structured per-interval features across 3.7K+ time-series intervals.',
      'Serving: FastAPI exposes the feature store to downstream consumers at sub-300ms P99.',
      'Observability: Prometheus and CloudWatch track ingestion lag and pipeline failures.',
    ],
    decisions: [
      {
        decision: 'Event-driven ingestion over a monolithic batch job',
        rationale:
          'Fed publications arrive irregularly and the market reaction window is short. Lambda triggers keep end-to-end lag low and make partial failures recoverable per-document instead of per-run.',
      },
      {
        decision: 'Diff against prior release rather than scoring in isolation',
        rationale:
          'Absolute sentiment on central-bank prose is nearly constant — it is engineered to be. Almost all the information is in the change, so the pipeline is built around comparison, not classification.',
      },
      {
        decision: 'Schema validation at ingestion, not at read time',
        rationale:
          'Upstream formats change without warning. Failing loudly at the boundary keeps malformed documents out of the feature store, where they would be far more expensive to detect.',
      },
    ],
    challenges: [
      'Backtests are trivially self-deceiving. Any signal computed with information unavailable at decision time produces spectacular and meaningless returns, so the pipeline enforces point-in-time correctness on every feature.',
      'Sustaining zero data loss under bursty load when several publications land at once.',
      'Fed language is deliberately hedged; off-the-shelf sentiment models trained on consumer text score it as uniformly neutral and had to be adapted.',
    ],
    lessons: [
      'The modeling was the easy part. Correct point-in-time data plumbing was most of the work and all of the risk.',
      'Reported returns from a simulation are a statement about the backtest, not about the market — and the site says so rather than implying a track record.',
    ],
  },
  {
    slug: 'legal-rag',
    name: 'Legal RAG',
    tagline: 'Retrieval-augmented generation over legal filings, with citations that hold up.',
    category: 'AI Systems',
    featured: true,
    spotlight: 3,
    status: 'Demo',
    year: '2025',
    timeline: '2025',
    role: 'Solo build',
    href: '/projects/legal-rag',
    uuid: 'c3d4e5f6-a7b8-4901-c234-56789abcdef0',
    demo: '/highlights/c3d4e5f6-a7b8-4901-c234-56789abcdef0',
    github: null,
    video: DEMO_VIDEO,
    writeup: 'legal-rag-citations-before-answers',
    image: {
      src: '/projects/legal-rag-cover.jpg',
      tile: '/projects/legal-rag-tile.jpg',
      width: 1600,
      height: 900,
      alt: 'A field of connected points against a dark ground — illustrative of a vector index, not a screenshot of the system',
    },
    stack: ['Python', 'FastAPI', 'Vector Search', 'Embeddings', 'LLMs', 'React'],
    metrics: [
      { value: 'Citation-first', label: 'answer contract' },
      { value: 'Chunk-level', label: 'source attribution' },
    ],
    problem:
      'A legal answer without a verifiable citation is worse than no answer — it is a confident claim a lawyer cannot check. Generic RAG returns fluent summaries that quietly blend sources, which is precisely the failure mode this domain cannot tolerate.',
    approach:
      'Invert the usual contract: retrieve first, answer only from retrieved spans, and refuse when retrieval is weak. Every sentence in the output maps to a chunk the user can open.',
    architecture: [
      'Documents are chunked on structural boundaries (sections, clauses) rather than fixed token windows, so citations land on semantically complete units.',
      'Embeddings indexed for vector similarity search, with metadata filters for document and jurisdiction.',
      'Retrieved chunks are passed to the LLM under a prompt contract that forbids unsupported claims.',
      'The response renders inline citations that resolve to the exact source span.',
    ],
    decisions: [
      {
        decision: 'Structural chunking over fixed-size windows',
        rationale:
          'Fixed windows split clauses mid-sentence, producing citations that point at fragments. Structural boundaries cost more preprocessing but make every citation independently readable.',
      },
      {
        decision: 'Refuse rather than approximate on weak retrieval',
        rationale:
          'In legal context a plausible wrong answer is the worst outcome. Below a retrieval confidence threshold the system says it does not have the source, which users trust more than a hedge.',
      },
    ],
    challenges: [
      'Long filings blow past context limits, so the ranking stage matters more than the generation stage.',
      'Keeping the model from smoothing over contradictions between two retrieved passages instead of surfacing them.',
    ],
    lessons: [
      'Most RAG quality problems are retrieval problems wearing a generation costume. Improving chunking and ranking moved answer quality far more than changing models.',
    ],
  },
  {
    slug: 'mri-tumor-viewer',
    name: 'MRI Tumor Viewer',
    tagline: 'Brain tumor segmentation running entirely in the browser.',
    category: 'Machine Learning',
    featured: true,
    spotlight: 4,
    status: 'Demo',
    year: '2025',
    timeline: 'May 2025 — Aug 2025',
    role: 'ML Engineer Intern, Wake Forest CAIR',
    href: '/projects/mri-tumor-viewer',
    uuid: 'e5f6a7b8-c9d0-4123-e456-789abcdef012',
    demo: '/highlights/e5f6a7b8-c9d0-4123-e456-789abcdef012',
    github: null,
    video: DEMO_VIDEO,
    writeup: 'mri-viewer-model-in-the-browser',
    image: {
      src: '/projects/mri-tumor-viewer-cover.jpg',
      tile: '/projects/mri-tumor-viewer-tile.jpg',
      width: 1600,
      height: 900,
      alt: 'An axial T1 brain slice, the modality this viewer renders — the scan alone, without a segmentation overlay',
    },
    stack: ['Python', 'PyTorch', 'TensorFlow.js', 'GCP', 'Terraform', 'Firebase'],
    metrics: [
      { value: '90%', label: 'classification accuracy' },
      { value: '20min → 5min', label: 'clinical processing time' },
      { value: '1,250+', label: 'patient cases' },
      { value: '10TB+', label: 'imaging data' },
    ],
    problem:
      'Reviewing scans is slow and the bottleneck is human attention, not imaging. Cutting time-to-first-read matters more than a marginal accuracy gain, because the queue is what delays patients.',
    approach:
      'Train the segmentation model offline on GCP, then ship inference to the browser so a scan can be reviewed without uploading patient data anywhere.',
    architecture: [
      'Training pipeline in PyTorch on GCP across 50K+ scans, provisioned with Terraform for reproducibility.',
      'Model exported and quantized for TensorFlow.js so inference runs client-side on the reviewer machine.',
      'Viewer renders slice-by-slice with the predicted segmentation as an overlay the clinician can toggle.',
      'Firebase handles auth and durable metadata; scan pixels never leave the client in the browser path.',
    ],
    decisions: [
      {
        decision: 'In-browser inference over a server endpoint',
        rationale:
          'Medical imaging carries real privacy constraints. Running the model client-side removes an entire class of data-handling risk and eliminates upload latency on large volumes.',
      },
      {
        decision: 'Overlay the prediction rather than replace the scan',
        rationale:
          'The model assists a clinician, it does not decide. A toggleable overlay keeps the original image authoritative and makes the model auditable at a glance.',
      },
    ],
    challenges: [
      'Quantizing to a browser-deployable size without losing clinically meaningful accuracy.',
      'Class imbalance — tumor voxels are a small fraction of any volume, so raw accuracy is a misleading metric and evaluation had to weight recall.',
    ],
    lessons: [
      'The throughput win came from workflow placement, not model quality. A slightly worse model that loads instantly beat a better one behind an upload step.',
    ],
  },
  {
    slug: 'policy-fabric',
    name: 'PolicyFabric',
    tagline: 'Data contract enforcement with live architecture visualization.',
    category: 'Developer Tools',
    featured: false,
    spotlight: 5,
    status: 'Demo',
    year: '2025',
    timeline: '2025',
    role: 'Solo build',
    href: '/projects/policy-fabric',
    uuid: 'f6a7b8c9-d0e1-4234-f567-89abcdef0123',
    demo: '/highlights/f6a7b8c9-d0e1-4234-f567-89abcdef0123',
    github: null,
    video: DEMO_VIDEO,
    writeup: 'policy-fabric-contract-graph-visible',
    image: {
      src: '/projects/policy-fabric-cover.jpg',
      tile: '/projects/policy-fabric-tile.jpg',
      width: 1600,
      height: 900,
      /* The only tile still generated — nothing in the repo depicts PolicyFabric.
         See TILE_SOURCES in scripts/build-images.mjs. */
      alt: 'An abstract plate of vertical bars on a ruled grid, standing in until a screenshot of PolicyFabric exists',
    },
    stack: ['TypeScript', 'React', 'Node.js', 'Graph Visualization'],
    metrics: [{ value: 'Per-layer', label: 'contract enforcement' }],
    problem:
      'Data contracts break silently. A producer changes a field, and the consumer three services downstream fails hours later with an error that points nowhere near the cause.',
    approach:
      'Make the contract graph a first-class artifact — render every producer/consumer edge and validate changes against it before they ship.',
    architecture: [
      'Service and schema definitions are parsed into a directed graph of producers, consumers, and the contracts between them.',
      'Policy rules evaluate proposed schema changes against downstream consumers and flag breaking edges.',
      'Interactive visualization highlights violations in place rather than in a log.',
    ],
    decisions: [
      {
        decision: 'Visualize the graph rather than emit a report',
        rationale:
          'Contract violations are inherently topological — the question is always "who downstream breaks". A list of errors loses the structure that makes the answer obvious.',
      },
    ],
    challenges: [
      'Graph layouts become unreadable past a few dozen nodes, so the view had to collapse to the affected subgraph rather than render everything.',
    ],
    lessons: [
      'Enforcement only works where it is cheap to obey. Surfacing violations at change time instead of at runtime is the whole value.',
    ],
  },
];

export const FEATURED_PROJECTS = PROJECTS.filter((p) => p.featured);

export const PROJECT_CATEGORIES = [...new Set(PROJECTS.map((p) => p.category))];

export const getProject = (slug) => PROJECTS.find((p) => p.slug === slug);

/** Trailer hero rotation, in editorial order. */
export const SPOTLIGHT = PROJECTS.filter((p) => p.spotlight).sort(
  (a, b) => a.spotlight - b.spotlight
);

/**
 * Rows on the browse page.
 *
 * Explicit slug lists rather than category filters. A filter would be shorter
 * and would quietly do the wrong thing: rows are an editorial sequence — which
 * project opens a row matters, a project can legitimately belong to two rows,
 * and adding a project should never silently reshuffle rows it was not meant to
 * touch. Membership and order are both stated here on purpose.
 *
 * A slug that matches nothing is skipped rather than rendering a hole, so rows
 * can name projects whose entries have not landed yet.
 *
 * ── On row count ────────────────────────────────────────────────────────────
 *
 * Keep rows few enough that each is nearly full and no project appears in more
 * than about two of them. Six rows over five projects put the same five tiles
 * on screen repeatedly and left three rows more than half empty background —
 * the shelf metaphor needs a catalogue to hold up, and past a certain ratio of
 * rows to projects it advertises how little there is rather than organising it.
 *
 * Rough rule: rows ≈ projects ÷ 3. Add categories back as the catalogue grows.
 */
export const COLLECTIONS = [
  {
    id: 'building',
    title: 'Currently building',
    slugs: ['atriveo', 'fomc-intelligence'],
  },
  {
    id: 'live',
    title: 'Try it live',
    slugs: ['legal-rag', 'mri-tumor-viewer', 'policy-fabric', 'fomc-intelligence'],
  },
];

/** Resolve a collection to its project records, dropping unknown slugs. */
export const collectionProjects = (collection) =>
  collection.slugs.map((slug) => getProject(slug)).filter(Boolean);

/**
 * Where the primary "Play" action goes for a project.
 *
 * This is the on-domain-vs-GitHub rule, and it lives here alone so the hero,
 * the card, and the info overlay cannot drift apart on it. Precedence, most to
 * least preferred:
 *
 *   1. `uuid`   — a live interactive demo on this domain. Always wins: keeping
 *                 someone on the site beats sending them to a repo.
 *   2. `href`   — an internal route (starts with "/").
 *   3. `href`   — an external product URL (starts with "http").
 *   4. `github` — nothing is hosted, so the source is the honest destination.
 *
 * Returns `{ to }` for a react-router <Link>, `{ href, external: true }` for a
 * new tab, or null when a project has no destination at all — callers must
 * handle null by hiding the action rather than rendering a dead button.
 */
export function resolvePlay(project) {
  if (!project) return null;
  if (project.uuid) return { to: `/highlights/${project.uuid}` };
  if (project.href?.startsWith('/')) return { to: project.href };
  if (project.href?.startsWith('http')) return { href: project.href, external: true };
  if (project.github) return { href: project.github, external: true };
  return null;
}

/**
 * SECONDARY destinations for a project — the info overlay's action row, which
 * renders alongside a primary Play button built from resolvePlay().
 *
 * Whatever resolvePlay() picked is filtered out by destination, not by label.
 * Doing it by label would miss the common case: for a project with a live demo,
 * Play and the "Live demo" link are the same URL under two names, and a
 * label-based check has no way to know that.
 */
export function projectLinks(project) {
  if (!project) return [];

  const play = resolvePlay(project);
  const playTarget = play?.to || play?.href;

  return [
    project.uuid && { label: 'Live demo', to: `/highlights/${project.uuid}` },
    /* Repo-derived records have no case study to link to — /projects/<slug> is
       only routed for the curated entries below, so offering it would be a link
       to a 404. See src/data/githubProjects.js. */
    project.source !== 'github' && { label: 'Case study', to: `/projects/${project.slug}` },
    ...(project.links || []).map((link) =>
      link.href?.startsWith('/')
        ? { label: link.label, to: link.href }
        : { label: link.label, href: link.href, external: true }
    ),
    project.github && { label: 'Source', href: project.github, external: true },
    project.writeup && { label: 'Read the story', to: `/blog/${project.writeup}` },
  ]
    .filter(Boolean)
    .filter((link) => (link.to || link.href) !== playTarget);
}
