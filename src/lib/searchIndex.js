/**
 * Client-side search index.
 *
 * Built from the data layer at module load — a few hundred entries at most, so
 * there is no reason to ship a search library or call out to a hosted index.
 * Everything is already in the bundle; this just makes it queryable.
 */

import { ROUTES } from '../seo/routes.js';
import { PROJECTS } from '../data/projects.js';
import { BLOG_POSTS } from '../content/posts.js';
import { EXPERIENCE } from '../data/experience.js';
import { PROFILES, RESUME_PDF, EMAIL } from '../data/site.js';

/**
 * @typedef {Object} SearchEntry
 * @property {string} id
 * @property {string} title
 * @property {string} subtitle
 * @property {string} group
 * @property {string} [path]      Internal route.
 * @property {string} [href]      External URL.
 * @property {string} keywords    Extra searchable text, not displayed.
 * @property {number} boost       Higher ranks first on equal match quality.
 */

const pageEntries = Object.values(ROUTES)
  .filter((r) => !r.noindex && !r.hidden && !r.path.includes(':'))
  .map((r) => ({
    id: `page:${r.path}`,
    title: r.title.split(' — ')[0].replace(/ \| .*$/, ''),
    subtitle: r.description,
    group: 'Pages',
    path: r.path,
    keywords: [r.path, ...(r.keywords || [])].join(' '),
    boost: r.priority ?? 0.5,
  }));

const projectEntries = PROJECTS.map((p) => ({
  id: `project:${p.slug}`,
  title: p.name,
  subtitle: p.tagline,
  group: 'Projects',
  path: `/projects/${p.slug}`,
  keywords: [p.category, p.status, ...(p.stack || [])].join(' '),
  boost: p.featured ? 0.9 : 0.7,
}));

const postEntries = BLOG_POSTS.map((p) => ({
  id: `post:${p.slug}`,
  title: p.title,
  subtitle: p.description,
  group: 'Writing',
  path: `/blog/${p.slug}`,
  keywords: [...(p.tags || []), p.category, p.excerpt].join(' '),
  boost: 0.8,
}));

const experienceEntries = EXPERIENCE.map((e) => ({
  id: `exp:${e.id}`,
  title: e.company,
  subtitle: `${e.role} · ${e.period}`,
  group: 'Experience',
  path: '/experience',
  keywords: [e.role, e.location, ...(e.stack || []), ...(e.clients || [])].join(' '),
  boost: 0.6,
}));

const actionEntries = [
  {
    id: 'action:resume',
    title: 'Download résumé (PDF)',
    subtitle: 'Full experience, skills, and education',
    group: 'Actions',
    href: RESUME_PDF,
    download: true,
    keywords: 'cv resume download pdf hire',
    boost: 1.0,
  },
  {
    id: 'action:email',
    title: 'Send an email',
    subtitle: EMAIL,
    group: 'Actions',
    href: `mailto:${EMAIL}`,
    keywords: 'contact email hire reach out',
    boost: 0.95,
  },
  {
    id: 'action:cal',
    title: 'Book a call',
    subtitle: '30 minutes, via Cal.com',
    group: 'Actions',
    href: PROFILES.cal,
    keywords: 'calendar meeting schedule call interview',
    boost: 0.9,
  },
  {
    id: 'action:linkedin',
    title: 'LinkedIn',
    subtitle: 'Professional profile',
    group: 'Actions',
    href: PROFILES.linkedin,
    keywords: 'linkedin social profile',
    boost: 0.85,
  },
  {
    id: 'action:github',
    title: 'GitHub',
    subtitle: '@atishay-kasliwal',
    group: 'Actions',
    href: PROFILES.github,
    keywords: 'github code repositories open source',
    boost: 0.85,
  },
];

export const SEARCH_INDEX = [
  ...actionEntries,
  ...pageEntries,
  ...projectEntries,
  ...postEntries,
  ...experienceEntries,
];

/**
 * Score one entry against a query.
 *
 * Scoring is intentionally simple and tiered rather than fuzzy: for an index
 * this small, prefix and substring matches on the title are what people expect,
 * and a fuzzy matcher mostly produces surprising results. Returns 0 for no
 * match so the caller can filter.
 */
function score(entry, query) {
  const q = query.toLowerCase().trim();
  if (!q) return entry.boost;

  const title = entry.title.toLowerCase();
  const subtitle = (entry.subtitle || '').toLowerCase();
  const keywords = (entry.keywords || '').toLowerCase();

  let s = 0;

  if (title === q) s = 100;
  else if (title.startsWith(q)) s = 80;
  else if (title.includes(q)) s = 60;
  else if (subtitle.includes(q)) s = 35;
  else if (keywords.includes(q)) s = 20;
  else {
    // Every term must appear somewhere — an AND match across fields.
    const terms = q.split(/\s+/).filter(Boolean);
    const haystack = `${title} ${subtitle} ${keywords}`;
    if (terms.length > 1 && terms.every((t) => haystack.includes(t))) s = 15;
  }

  return s === 0 ? 0 : s + entry.boost * 5;
}

export function search(query, limit = 12) {
  return SEARCH_INDEX.map((entry) => ({ entry, s: score(entry, query) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((r) => r.entry);
}

/** Group results while preserving the sorted order within each group. */
export function groupResults(results) {
  const groups = new Map();
  for (const r of results) {
    if (!groups.has(r.group)) groups.set(r.group, []);
    groups.get(r.group).push(r);
  }
  return [...groups.entries()].map(([group, items]) => ({ group, items }));
}
