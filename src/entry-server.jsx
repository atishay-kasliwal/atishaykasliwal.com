import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import AppRoutes from './AppRoutes';
import { resolveMeta } from './seo/routes.js';
import {
  buildGraph,
  serializeJsonLd,
  projectSchema,
  blogPostingSchema,
} from './seo/schema.js';
import { TWITTER_HANDLE, SITE, abs } from './data/site.js';

/**
 * Server entry used only at build time by scripts/prerender.mjs.
 *
 * Produces the two things injected into the static HTML for each route: the
 * rendered markup, and the full <head>. The head is the part that actually
 * decides SEO outcomes — Google will render JS eventually, but the OG and
 * Twitter crawlers behind LinkedIn, Slack, iMessage, and X never will. If the
 * tags aren't in the served HTML, link previews are wrong everywhere.
 */

const esc = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const meta = (attr, key, content) =>
  content ? `<meta ${attr}="${esc(key)}" content="${esc(content)}" />` : '';

/**
 * Builds the complete head for a route.
 * @param {string} url
 * @param {object} overrides  Per-page metadata (blog posts, project details).
 * @param {Array}  schema     Extra JSON-LD nodes to merge into the @graph.
 */
export function renderHead(url, overrides = {}, schema = []) {
  const m = resolveMeta(url, overrides);
  const robots = m.noindex
    ? 'noindex, nofollow'
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  const tags = [
    `<title>${esc(m.title)}</title>`,
    meta('name', 'description', m.description),
    m.keywords?.length ? meta('name', 'keywords', m.keywords.join(', ')) : '',
    meta('name', 'robots', robots),
    meta('name', 'googlebot', robots),
    `<link rel="canonical" href="${esc(m.canonical)}" />`,

    // Open Graph
    meta('property', 'og:type', m.ogType),
    meta('property', 'og:title', m.title),
    meta('property', 'og:description', m.description),
    meta('property', 'og:url', m.canonical),
    meta('property', 'og:site_name', SITE.shortName),
    meta('property', 'og:locale', SITE.locale),
    meta('property', 'og:image', m.image.url),
    meta('property', 'og:image:secure_url', m.image.url),
    meta('property', 'og:image:type', m.image.url.endsWith('.png') ? 'image/png' : 'image/jpeg'),
    meta('property', 'og:image:width', m.image.width),
    meta('property', 'og:image:height', m.image.height),
    meta('property', 'og:image:alt', m.image.alt),

    // Article-specific OG, only on blog posts.
    m.ogType === 'article' ? meta('property', 'article:published_time', overrides.datePublished) : '',
    m.ogType === 'article' ? meta('property', 'article:modified_time', overrides.dateModified) : '',
    m.ogType === 'article' ? meta('property', 'article:author', 'Atishay Kasliwal') : '',
    ...(m.ogType === 'article' && overrides.tags
      ? overrides.tags.map((t) => meta('property', 'article:tag', t))
      : []),

    // Twitter
    meta('name', 'twitter:card', 'summary_large_image'),
    meta('name', 'twitter:site', TWITTER_HANDLE),
    meta('name', 'twitter:creator', TWITTER_HANDLE),
    meta('name', 'twitter:title', m.title),
    meta('name', 'twitter:description', m.description),
    meta('name', 'twitter:image', m.image.url),
    meta('name', 'twitter:image:alt', m.image.alt),

    // Feed discovery
    `<link rel="alternate" type="application/rss+xml" title="Atishay Kasliwal — Writing" href="${abs('/rss.xml')}" />`,
    `<link rel="alternate" type="application/atom+xml" title="Atishay Kasliwal — Writing" href="${abs('/atom.xml')}" />`,
    `<link rel="alternate" type="application/json" title="Atishay Kasliwal — Writing" href="${abs('/feed.json')}" />`,

    `<script type="application/ld+json">${serializeJsonLd(buildGraph(m, schema))}</script>`,
  ];

  return tags.filter(Boolean).join('\n    ');
}

/**
 * Render a route to static markup.
 * Throws on failure so the caller can fall back to head-only output for that
 * route rather than shipping a broken page.
 */
export function render(url) {
  const html = renderToString(
    <StaticRouter location={url}>
      <AppRoutes />
    </StaticRouter>
  );
  return { html };
}

/**
 * Re-exported so scripts/prerender.mjs can enumerate routes without importing
 * app source directly — it only ever loads this one compiled SSR bundle.
 */
export { ROUTES } from './seo/routes.js';
export { PROJECTS } from './data/projects.js';
export { BLOG_POSTS } from './content/posts.js';

/**
 * Build the extra JSON-LD nodes for a dynamic route. Kept here rather than in
 * the prerender script so schema generation has exactly one home.
 */
export function schemaFor(spec) {
  if (!spec) return [];
  if (spec.type === 'project') return [projectSchema(spec.data)];
  if (spec.type === 'post') return [blogPostingSchema(spec.data)];
  return [];
}
