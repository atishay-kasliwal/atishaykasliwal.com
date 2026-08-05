/**
 * Per-route SEO metadata registry.
 *
 * One record per route, consumed by three things that must never disagree:
 *   1. the runtime <Seo> component (SPA navigation)
 *   2. scripts/prerender.mjs (the HTML crawlers and OG bots actually receive)
 *   3. scripts/generate-sitemap.mjs
 *
 * Titles are written to sit under ~60 chars so Google does not truncate them,
 * and every one ends with the full name — name queries are the primary target.
 * Descriptions target 150–160 chars.
 */

import {
  ORIGIN,
  abs,
  FULL_NAME,
  JOB_TITLE,
  META_DESCRIPTION,
  IMAGES,
} from '../data/site.js';

/**
 * Build a <title> that fits Google's display width.
 *
 * Every title is "{page} | Atishay Kasliwal", with the pipe as the single
 * separator sitewide. Consistency matters here because the title is the tab
 * label, the search-result headline, and the default share text — three places
 * where a mixed set of dashes, commas, and missing separators reads as
 * carelessness.
 *
 * Google truncates around 60 characters. If a page's own subject is long enough
 * that the name will not fit, the subject is trimmed rather than the name being
 * dropped: the brand is the part worth guaranteeing on a name query.
 */
export function seoTitle(primary, { suffix = FULL_NAME, max = 60 } = {}) {
  const full = `${primary} | ${suffix}`;
  if (full.length <= max) return full;

  // Shorten the subject so the name still fits, rather than losing the brand.
  const room = max - suffix.length - 3; // " | " separator
  if (room > 12) {
    const cut = primary.slice(0, room);
    const trimmed = cut.slice(0, cut.lastIndexOf(' ')).trimEnd() || cut.trimEnd();
    return `${trimmed} | ${suffix}`;
  }

  return primary.length <= max ? primary : `${primary.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Clamp a meta description to ~155 chars, cutting at a sentence or word
 * boundary so the snippet does not end mid-thought.
 */
export function seoDescription(text, max = 155) {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;

  const window = clean.slice(0, max);
  const sentenceEnd = Math.max(window.lastIndexOf('. '), window.lastIndexOf('? '));
  if (sentenceEnd > max * 0.6) return clean.slice(0, sentenceEnd + 1);

  return `${window.slice(0, window.lastIndexOf(' ')).trimEnd()}…`;
}

export const DEFAULT_OG_IMAGE = {
  url: abs(IMAGES.og.src),
  width: IMAGES.og.width,
  height: IMAGES.og.height,
  alt: IMAGES.og.alt,
};

/**
 * @typedef {Object} RouteMeta
 * @property {string} path            Route path (no trailing slash except "/").
 * @property {string} title           Full <title>.
 * @property {string} description     Meta description.
 * @property {string} [ogType]        Defaults to "website".
 * @property {object} [image]         OG image override.
 * @property {Array}  [breadcrumbs]   [{name, path}] — "Home" is prepended automatically.
 * @property {number} [priority]      Sitemap priority.
 * @property {string} [changefreq]
 * @property {boolean} [noindex]      Excluded from sitemap and marked noindex.
 * @property {boolean} [hidden]       Valid route, but kept out of nav/sitemap until it has content.
 * @property {string[]} [keywords]
 */

/** @type {Record<string, RouteMeta>} */
export const ROUTES = {
  '/': {
    path: '/',
    title: `${FULL_NAME} | ${JOB_TITLE}`,
    description: META_DESCRIPTION,
    ogType: 'profile',
    breadcrumbs: [],
    priority: 1.0,
    changefreq: 'weekly',
    keywords: [
      'Atishay Kasliwal',
      'AI Engineer',
      'LLM engineer',
      'RAG systems',
      'machine learning engineer New York',
    ],
  },

  '/about': {
    path: '/about',
    title: `About | ${FULL_NAME}`,
    description: `${FULL_NAME} is an AI Engineer in New York building production LLM, RAG, and agent systems. MS in Data Science, Stony Brook University.`,
    ogType: 'profile',
    breadcrumbs: [{ name: 'About', path: '/about' }],
    priority: 0.9,
    changefreq: 'monthly',
  },

  '/projects': {
    path: '/projects',
    title: `Projects | ${FULL_NAME}`,
    description: `Engineering case studies by ${FULL_NAME}: production LLM and RAG systems, distributed pipelines, and ML tooling — architecture, decisions, outcomes.`,
    breadcrumbs: [{ name: 'Projects', path: '/projects' }],
    priority: 0.9,
    changefreq: 'weekly',
  },

  '/experience': {
    path: '/experience',
    title: `Experience | ${FULL_NAME}`,
    description: `Professional history of ${FULL_NAME}: research at Stony Brook University, ML at Wake Forest CAIR, and three years as a Senior Engineer at Accolite Digital.`,
    breadcrumbs: [{ name: 'Experience', path: '/experience' }],
    priority: 0.8,
    changefreq: 'monthly',
  },

  '/resume': {
    path: '/resume',
    title: `Résumé | ${FULL_NAME}`,
    description: `Resume of ${FULL_NAME}, AI Engineer in New York. Experience, skills, education, and a downloadable PDF.`,
    breadcrumbs: [{ name: 'Resume', path: '/resume' }],
    priority: 0.9,
    changefreq: 'monthly',
  },

  '/research': {
    path: '/research',
    title: `Research | ${FULL_NAME}`,
    description: `Peer-reviewed publications and applied research by ${FULL_NAME} — financial NLP at Stony Brook University and deployable ML for medical imaging at Wake Forest.`,
    breadcrumbs: [{ name: 'Research', path: '/research' }],
    priority: 0.7,
    changefreq: 'monthly',
  },

  '/blog': {
    path: '/blog',
    title: `Writing | ${FULL_NAME}`,
    description: `Technical writing by ${FULL_NAME} on LLM systems, retrieval-augmented generation, distributed architecture, and what actually breaks in production.`,
    breadcrumbs: [{ name: 'Writing', path: '/blog' }],
    priority: 0.8,
    changefreq: 'weekly',
  },

  '/speaking': {
    path: '/speaking',
    title: `Speaking | ${FULL_NAME}`,
    description: `Talks and technical presentations by ${FULL_NAME} on AI engineering, retrieval systems, and distributed infrastructure.`,
    breadcrumbs: [{ name: 'Speaking', path: '/speaking' }],
    priority: 0.6,
    changefreq: 'monthly',
  },

  '/open-source': {
    path: '/open-source',
    title: `Open Source | ${FULL_NAME}`,
    description: `Open-source work by ${FULL_NAME}: public repositories spanning AI tooling, data pipelines, and developer infrastructure, pulled live from GitHub.`,
    breadcrumbs: [{ name: 'Open Source', path: '/open-source' }],
    priority: 0.7,
    changefreq: 'weekly',
  },

  '/contact': {
    path: '/contact',
    title: `Contact | ${FULL_NAME}`,
    description: `Get in touch with ${FULL_NAME} — AI Engineer in New York, open to roles. Email, LinkedIn, GitHub, and a direct booking link.`,
    breadcrumbs: [{ name: 'Contact', path: '/contact' }],
    priority: 0.8,
    changefreq: 'monthly',
  },

  '/privacy': {
    path: '/privacy',
    title: `Privacy | ${FULL_NAME}`,
    description: `How atishaykasliwal.com handles analytics, cookies, and personal data.`,
    breadcrumbs: [{ name: 'Privacy', path: '/privacy' }],
    priority: 0.2,
    changefreq: 'yearly',
  },

  '/art': {
    path: '/art',
    title: `Photography | ${FULL_NAME}`,
    description: `Photography and visual work by ${FULL_NAME}.`,
    breadcrumbs: [{ name: 'Photography', path: '/art' }],
    priority: 0.4,
    changefreq: 'monthly',
  },

  '/atriveo': {
    path: '/atriveo',
    title: `Atriveo | ${FULL_NAME}`,
    description: `Atriveo is a job-search platform by ${FULL_NAME}: passive application capture via Chrome extension, plus pipeline analytics. 100+ active customers.`,
    breadcrumbs: [{ name: 'Atriveo', path: '/atriveo' }],
    priority: 0.7,
    changefreq: 'monthly',
  },

  '/highlights': {
    path: '/highlights',
    title: `Live Demos | ${FULL_NAME}`,
    description: `Interactive demos of systems built by ${FULL_NAME}: FOMC intelligence, legal RAG, in-browser MRI segmentation, and data contract enforcement.`,
    breadcrumbs: [{ name: 'Demos', path: '/highlights' }],
    priority: 0.7,
    changefreq: 'monthly',
  },

  '/404': {
    path: '/404',
    title: `Page not found | ${FULL_NAME}`,
    description: 'That page does not exist.',
    noindex: true,
    priority: 0,
  },
};

/** Routes safe to emit in the sitemap: indexable and not withheld pending content. */
export const indexableRoutes = () =>
  Object.values(ROUTES).filter((r) => !r.noindex && !r.hidden);

/**
 * Base used for paths with no registry entry — the dynamic routes
 * (/blog/:slug, /projects/:slug), which supply their own metadata via
 * overrides.
 *
 * This must NOT be the /404 record. It was, and because /404 carries
 * `noindex: true`, every blog post and every project case study inherited it
 * and shipped `<meta name="robots" content="noindex, nofollow">`. Those are the
 * highest-value pages on the site for long-tail search, and Google was being
 * told explicitly to skip all of them.
 */
const DYNAMIC_BASE = {
  ogType: 'website',
  priority: 0.6,
  changefreq: 'monthly',
};

/** Merge a route record with defaults into the shape the renderers consume. */
export function resolveMeta(pathname, overrides = {}) {
  const clean =
    pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

  // An explicit /404 lookup still gets the 404 record; anything else unknown is
  // treated as a dynamic route, not as an error page.
  const base = ROUTES[clean] || (clean === '/404' ? ROUTES['/404'] : DYNAMIC_BASE);

  const merged = { ...base, ...overrides };
  const path = merged.path || clean;

  return {
    ...merged,
    path,
    description: seoDescription(merged.description),
    canonical: merged.canonical || abs(path === '/404' ? '/' : path),
    ogType: merged.ogType || 'website',
    image: merged.image || DEFAULT_OG_IMAGE,
    breadcrumbs: merged.breadcrumbs || [],
  };
}

/** Primary navigation. Derived from ROUTES so nav can never drift from SEO. */
export const NAV_LINKS = [
  { label: 'About', path: '/about' },
  { label: 'Projects', path: '/projects' },
  { label: 'Experience', path: '/experience' },
  { label: 'Writing', path: '/blog' },
  { label: 'Open Source', path: '/open-source' },
  { label: 'Contact', path: '/contact' },
].filter((l) => !ROUTES[l.path]?.hidden);

export { ORIGIN, abs };
