import github from './generated/github.json';
import { PROJECTS } from './projects.js';

/**
 * Every public GitHub repo, adapted to the shape the browse page renders.
 *
 * The snapshot in generated/github.json is written at build time by
 * scripts/fetch-github.mjs — see the header there for why it is not fetched in
 * the browser. This module is the translation layer between that raw API shape
 * and the record ProjectCard / ProjectModal expect, and nothing else knows the
 * GitHub shape.
 *
 * ── These do not replace the curated case studies ───────────────────────────
 *
 * A repo carries a name, a one-line description, a language, and some topics.
 * A case study in projects.js carries the problem, the approach, the
 * architecture, the metrics, and the tradeoffs — the things someone deciding
 * whether to interview actually reads. Adapting a repo cannot invent any of
 * that, so these render as an additional shelf rather than as a substitute:
 * the five curated entries stay the front of the page and these are the long
 * tail behind them.
 *
 * Fields the curated records have and these deliberately do not: `problem`,
 * `approach`, `architecture`, `metrics`, `video`, `uuid`. Every consumer already
 * guards on those being absent, so the modal simply renders a shorter panel
 * rather than an empty section with a heading over it.
 */

/**
 * Repos that should not appear as projects.
 *
 * Two reasons, both explicit rather than heuristic:
 *
 *   • DUPLICATES — a curated case study already covers this work, in more depth
 *     and with a real write-up. Showing both puts the same project on the page
 *     twice under two different names. Matched by URL against each curated
 *     project's `github` field, plus the names below for repos that are the same
 *     work under a different repo (Atriveo and atriveo-app are one product).
 *   • NOT A PROJECT — the profile README repo is GitHub plumbing, not work.
 */
const EXCLUDE_NAMES = new Set([
  'atishay-kasliwal', // profile README
  'Atriveo', // same product as atriveo-app, which the Atriveo case study covers
]);

/** URLs already claimed by a curated case study. */
const CURATED_REPO_URLS = new Set(
  PROJECTS.map((p) => p.github?.toLowerCase()).filter(Boolean)
);

/**
 * Language → the category label shown on the card.
 *
 * Language is the only classification GitHub gives that is reliably present;
 * topics are richer but most repos here carry none. Anything unmapped falls
 * back to "Code" rather than to the raw language name, so an outlier like
 * "Jupyter Notebook" does not become a category of one.
 */
const CATEGORY_BY_LANGUAGE = {
  Python: 'Python',
  TypeScript: 'TypeScript',
  JavaScript: 'JavaScript',
  Java: 'Java',
  'C++': 'Systems',
  'Jupyter Notebook': 'Applied Research',
};

/** Repo names are not titles. "user-data-platform" → "User Data Platform". */
function titleFromName(name) {
  return name
    .replace(/[-_]+/g, ' ')
    .replace(/\bmain\b$/i, '')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const YEAR = (iso) => (iso ? new Date(iso).getUTCFullYear() : null);

function adapt(repo) {
  const slug = `gh-${repo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
  const pushedYear = YEAR(repo.pushedAt);
  const createdYear = YEAR(repo.createdAt);

  /* Stack is the language first, then topics. Topics are the author's own
     tagging and are frequently more specific than the language ("rag",
     "chrome-extension"), which is why they are worth surfacing at all. Capped
     because the modal renders them as a tag list, and a repo with twelve topics
     would push everything below it off the panel. */
  const stack = [repo.language, ...(repo.topics || [])].filter(Boolean).slice(0, 8);

  return {
    slug,
    name: titleFromName(repo.name),
    /* A repo with no description is common and is not an error — the card
       needs a line of text under the title either way, so the language stands
       in. Saying "no description" on a portfolio would be worse than saying
       nothing. */
    tagline: repo.description || `${repo.language || 'Source'} repository.`,
    category: CATEGORY_BY_LANGUAGE[repo.language] || 'Code',
    /* `homepage` set means something is deployed and reachable; otherwise the
       repo is the only destination there is. */
    status: repo.homepage ? 'Live' : 'Source',
    year: String(pushedYear || createdYear || ''),
    timeline:
      createdYear && pushedYear && createdYear !== pushedYear
        ? `${createdYear} — ${pushedYear}`
        : String(pushedYear || createdYear || '—'),
    role: 'Author',
    href: repo.homepage || repo.url,
    github: repo.url,
    video: null,
    image: {
      src: `/repos/${slug}-tile.jpg`,
      tile: `/repos/${slug}-tile.jpg`,
      width: 1600,
      height: 900,
      alt: '',
    },
    stack,
    /* Stars are shown only when there are any. A row of "★ 0" reads as a
       verdict on the work rather than as what it is — a repo nobody has been
       asked to star. */
    metrics: repo.stars > 0 ? [{ value: String(repo.stars), label: 'stars' }] : [],
    /* Marks this record as repo-derived. projectLinks() reads it to suppress
       the "Case study" link, because /projects/<slug> does not exist for these
       — there is no case study to route to. */
    source: 'github',
    pushedAt: repo.pushedAt,
  };
}

/** Every repo worth showing, most recently pushed first. */
export const GITHUB_PROJECTS = (github.repos || [])
  .filter(
    (repo) =>
      !EXCLUDE_NAMES.has(repo.name) && !CURATED_REPO_URLS.has(repo.url?.toLowerCase())
  )
  .map(adapt)
  .sort((a, b) => new Date(b.pushedAt) - new Date(a.pushedAt));

/** Rows built from the repos, in the order they should appear on the page. */
export const GITHUB_COLLECTIONS = [
  {
    id: 'gh-recent',
    title: 'Recently pushed',
    projects: GITHUB_PROJECTS.slice(0, 8),
  },
  {
    id: 'gh-all',
    title: `Everything on GitHub (${GITHUB_PROJECTS.length})`,
    projects: GITHUB_PROJECTS,
  },
];

/**
 * Slug lookup across both sources.
 *
 * The overlay is opened by slug from the URL (?p=…), and that slug can now name
 * either a curated project or a repo. The `gh-` prefix keeps the two namespaces
 * from ever colliding, so this can check curated first and fall through.
 */
export const findProject = (slug) =>
  PROJECTS.find((p) => p.slug === slug) || GITHUB_PROJECTS.find((p) => p.slug === slug);
