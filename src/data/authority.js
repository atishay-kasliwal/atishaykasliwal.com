/**
 * Long-term authority surfaces: research, talks, media, awards.
 *
 * These are all EMPTY BY DESIGN. The pages, routing, schema generators, and
 * layouts are fully built and will render the moment real entries are added —
 * but nothing here is invented. Fabricated publications and talks are the
 * single fastest way to destroy credibility with the exact audience this site
 * is built for, and they are trivially checkable.
 *
 * ── HOW TO ADD ──────────────────────────────────────────────────────────
 * Push a real entry into the relevant array. Each page automatically:
 *   • switches out of its empty state
 *   • enters the sitemap (see scripts/generate-sitemap.mjs)
 *   • emits the matching JSON-LD (ScholarlyArticle / Event / CreativeWork)
 *   • appears in site nav and the command palette
 *
 * Google Scholar and YouTube profile URLs also belong in PROFILES in
 * src/data/site.js once they exist — they are deliberately not in `sameAs`
 * yet, because a sameAs pointing at a non-existent profile actively lowers
 * entity confidence.
 * ────────────────────────────────────────────────────────────────────────
 */

/**
 * @typedef {Object} Publication
 * @property {string} title
 * @property {string[]} authors      Full names, in publication order.
 * @property {string} venue          Journal or conference name.
 * @property {string} date           ISO date.
 * @property {string} [url]          Canonical link (DOI preferred).
 * @property {string} [doi]
 * @property {string} [pdf]
 * @property {string} abstract
 */
export const PUBLICATIONS = [];

/**
 * @typedef {Object} Talk
 * @property {string} title
 * @property {string} event
 * @property {string} date           ISO date.
 * @property {string} location
 * @property {string} [url]
 * @property {string} [slides]
 * @property {string} [video]
 * @property {string} description
 */
export const TALKS = [];

/**
 * Ongoing research threads. Distinct from PUBLICATIONS — this is work in
 * progress, which is legitimate to show as long as it is labeled as such.
 */
export const RESEARCH_AREAS = [
  {
    id: 'financial-nlp',
    title: 'Financial NLP and central bank communication',
    affiliation: 'Stony Brook University',
    period: 'Nov 2024 — Present',
    status: 'Active',
    summary:
      'Extracting stance and stance-change from Federal Reserve publications, and testing whether the delta between consecutive releases carries information beyond what is already priced in.',
    outputs: ['FOMC Intelligence pipeline'],
    relatedProject: 'fomc-intelligence',
  },
  {
    id: 'medical-imaging-ml',
    title: 'Deployable ML for medical imaging',
    affiliation: 'Wake Forest University — Center for Artificial Intelligence Research',
    period: 'May 2025 — Aug 2025',
    status: 'Completed',
    summary:
      'Brain tumor segmentation with a deployment constraint: inference must run client-side so patient imaging never leaves the reviewing machine.',
    outputs: ['MRI Tumor Viewer'],
    relatedProject: 'mri-tumor-viewer',
  },
];

/** Press, podcasts, interviews. Empty until real. */
export const MEDIA = [];

export const hasPublications = () => PUBLICATIONS.length > 0;
export const hasTalks = () => TALKS.length > 0;
export const hasMedia = () => MEDIA.length > 0;
export const hasResearch = () => RESEARCH_AREAS.length > 0;
