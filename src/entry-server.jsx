import React from 'react';
import { prerenderToNodeStream } from 'react-dom/static';
import { StaticRouter } from 'react-router-dom/server';
import AppRoutes from './AppRoutes';

/**
 * Statically imported so the prerenderer never hits a Suspense boundary.
 * This module is loaded only by scripts/prerender.mjs in Node, so these imports
 * never reach the browser bundle and code splitting is unaffected.
 */
import Resume from './Resume';
import ArtPage from './pages/ArtPage';
import AtriveoPage from './pages/AtriveoPage';
import LegacyProjects from './Projects';
import HighlightDetail from './HighlightDetail';

const EAGER = { Resume, ArtPage, AtriveoPage, LegacyProjects, HighlightDetail };
import { resolveMeta } from './seo/routes.js';
import {
  buildGraph,
  serializeJsonLd,
  projectSchema,
  blogPostingSchema,
  webPageSchema,
  contactPageSchema,
  collectionPageSchema,
  publicationSchema,
  talkSchema,
  conferencePaperSchema,
  faqSchema,
} from './seo/schema.js';
import { TWITTER_HANDLE, SITE, abs } from './data/site.js';
import { ABOUT_FAQS } from './data/faqs.js';
import { PROJECTS } from './data/projects.js';
import { BLOG_POSTS } from './content/posts.js';
import { PUBLICATIONS, TALKS, CONFERENCES } from './data/authority.js';
import githubData from './data/generated/github.json';

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
/**
 * Render a route to static markup.
 *
 * Uses `prerenderToNodeStream` from react-dom/static rather than
 * `renderToString`. This is not a style preference — renderToString cannot
 * handle Suspense, so every route behind a React.lazy() boundary (/resume,
 * /highlights, /art, /atriveo) silently degraded to "Switched to client
 * rendering" and shipped an empty body. prerenderToNodeStream is React 19's
 * static-generation API: it waits for suspended boundaries to resolve and
 * returns the complete HTML.
 *
 * Errors are collected rather than thrown, because React reports render errors
 * through onError while still producing partial output. The caller must treat a
 * non-empty `errors` array as a failed route — see scripts/prerender.mjs.
 */
async function renderOnce(url, errors) {
  const { prelude } = await prerenderToNodeStream(
    <StaticRouter location={url}>
      <AppRoutes overrides={EAGER} />
    </StaticRouter>,
    {
      onError(error) {
        errors.push(error?.message || String(error));
      },
    }
  );

  return new Promise((resolve, reject) => {
    let out = '';
    prelude.setEncoding('utf8');
    prelude.on('data', (chunk) => {
      out += chunk;
    });
    prelude.on('end', () => resolve(out));
    prelude.on('error', reject);
  });
}

export async function render(url) {
  const errors = [];

  /**
   * Rendered twice, deliberately.
   *
   * React.lazy suspends on its FIRST render even when the underlying module is
   * already in memory — the component only records its resolved state after
   * that first attempt. A suspended boundary makes React emit the fallback into
   * the shell and defer the real markup to a hydration-time swap, so the routes
   * behind lazy() (/resume, /highlights, /atriveo, /art) were prerendering an
   * empty `.route-loading` div and shifting ~1.0 CLS when the content appeared.
   *
   * The first pass is a warm-up whose output is discarded; by the second pass
   * every lazy component resolves synchronously and the markup is fully inlined.
   * Cost is a few seconds of build time, which is the right trade for the pages
   * actually being present at first paint.
   */
  const html = await renderOnce(url, errors);

  return { html, errors };
}



/**
 * Re-exported so scripts/prerender.mjs can enumerate routes without importing
 * app source directly — it only ever loads this one compiled SSR bundle.
 */
export { ROUTES, seoTitle, seoDescription } from './seo/routes.js';
export { PROJECTS, BLOG_POSTS };

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

/**
 * Page-level schema for the static routes.
 *
 * These have to be emitted here, not just by the runtime <Seo> component:
 * Google will not award an FAQ rich result for structured data that only
 * appears after hydration, and the ProfilePage/CollectionPage types are what
 * tell it whether a URL is a person, a list, or a contact point.
 */
export function staticSchemaFor(routePath) {
  const meta = resolveMeta(routePath);

  switch (routePath) {
    case '/':
      return [webPageSchema(meta, 'ProfilePage')];

    case '/about':
      return [webPageSchema(meta, 'ProfilePage'), faqSchema(ABOUT_FAQS)];

    case '/contact':
      return [contactPageSchema(meta)];

    case '/projects':
      return [
        collectionPageSchema(
          meta,
          PROJECTS.map((p) => ({ url: abs(`/projects/${p.slug}`), name: p.name }))
        ),
      ];

    case '/blog':
      return [
        collectionPageSchema(
          meta,
          BLOG_POSTS.map((p) => ({ url: abs(`/blog/${p.slug}`), name: p.title }))
        ),
      ];

    case '/open-source':
      return [
        collectionPageSchema(
          meta,
          (githubData.repos || []).map((r) => ({ url: r.url, name: r.name }))
        ),
      ];

    case '/research':
      return [
        webPageSchema(meta),
        ...PUBLICATIONS.map(publicationSchema),
        ...CONFERENCES.map(conferencePaperSchema),
      ];

    case '/speaking':
      return [webPageSchema(meta), ...TALKS.map(talkSchema)];

    default:
      return [webPageSchema(meta)];
  }
}
