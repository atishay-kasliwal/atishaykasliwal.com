/**
 * Cloudflare Pages Function — /highlights/[id]
 *
 * Problem: CRA is client-side rendered. Social crawlers (LinkedIn, Twitter,
 * Slack) don't execute JS, so react-helmet meta tags are never seen.
 *
 * Solution: Detect bot User-Agent → return minimal HTML with correct OG tags.
 *           Real users → context.next() → falls through to _redirects → index.html.
 *
 * Deploy: Committed to `functions/` — Cloudflare Pages picks it up automatically.
 * No wrangler config changes needed.
 */

// ── Bot detection ─────────────────────────────────────────────────────────────

const BOT_UA =
  /linkedinbot|twitterbot|facebookexternalhit|facebot|slackbot|slack-imgproxy|whatsapp|telegrambot|discordbot|googlebot|bingbot|applebot|ia_archiver|embedly|quora|outbrain|pinterest|vkshare|w3c_validator/i;

// ── Project metadata ──────────────────────────────────────────────────────────
// Mirrors projectsData in Projects.js — update here if you change a project.

const SITE = 'https://atishaykasliwal.com';

const PROJECTS = {
  // UUID → metadata
  'd4e5f6a7-b8c9-4012-d345-6789abcdef01': {
    title: 'FOMC Intelligence Dashboard',
    description:
      'Real-time NLP pipeline predicting equity market reactions to Federal Reserve press conferences. 13 FOMC sessions, LLM-based sentiment analysis, up to 70% directional accuracy.',
    image: `${SITE}/fmocc.jpeg`,
    category: 'NLP',
  },
  'c3d4e5f6-a7b8-4901-c234-56789abcdef0': {
    title: 'Ask Your Documents Anything',
    description:
      'Retrieval-augmented generation system for querying legal filings in natural language. Semantic vector search with LLM-grounded, citation-backed answers.',
    image: `${SITE}/4th.jpeg`,
    category: 'AI / RAG',
  },
  'e5f6a7b8-c9d0-4123-e456-789abcdef012': {
    title: 'Tumor Detection: Scan to Insight',
    description:
      'CNN-powered MRI brain tumor viewer with real-time segmentation across 6 imaging modalities (T1, T2, FLAIR, DWI, ADC, Overlay) — running entirely in the browser.',
    image: `${SITE}/mriimage.jpeg`,
    category: 'Medical AI',
  },
  'f6a7b8c9-d0e1-4234-f567-89abcdef0123': {
    title: 'Policy Enforcement at Every Layer',
    description:
      'Interactive data contract enforcement system with real-time architecture visualization. Surfaces schema and quality violations at each pipeline layer.',
    image: `${SITE}/5th%20image.jpeg`,
    category: 'Systems',
  },
  'a1b2c3d4-e5f6-4789-a012-bcdef0123456': {
    title: 'Healthcare AI Research',
    description:
      'Machine learning research and clinical data analytics at Atrium Health Wake Forest Baptist. Predictive models for patient outcome analysis.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop',
    category: 'Research',
  },
};

// Slug → UUID (for /highlights/fomc-intelligence-dashboard style URLs)
const SLUG_TO_UUID = Object.fromEntries(
  Object.entries(PROJECTS).map(([uuid, p]) => [slugify(p.title), uuid])
);

const FALLBACK_IMAGE = `${SITE}/profile-dark-theme.jpg`;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function lookupProject(id) {
  if (UUID_RE.test(id)) return PROJECTS[id] ? { ...PROJECTS[id], uuid: id } : null;
  const uuid = SLUG_TO_UUID[id] ?? SLUG_TO_UUID[slugify(id)];
  return uuid && PROJECTS[uuid] ? { ...PROJECTS[uuid], uuid } : null;
}

function buildOgHtml(project, canonicalUrl) {
  const title   = escHtml(`${project.title} | Atishay Kasliwal`);
  const desc    = escHtml(project.description);
  const image   = escHtml(project.image || FALLBACK_IMAGE);
  const pageUrl = escHtml(canonicalUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />

  <!-- Open Graph (LinkedIn, Facebook, Slack, Discord) -->
  <meta property="og:type"         content="article" />
  <meta property="og:site_name"    content="Atishay Kasliwal" />
  <meta property="og:title"        content="${title}" />
  <meta property="og:description"  content="${desc}" />
  <meta property="og:url"          content="${pageUrl}" />
  <meta property="og:image"        content="${image}" />
  <meta property="og:image:width"  content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt"    content="${escHtml(project.title)}" />

  <!-- Twitter Card -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:site"        content="@atishayk" />
  <meta name="twitter:title"       content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image"       content="${image}" />

  <!-- Redirect real browsers immediately — bots follow og: tags and stop -->
  <meta http-equiv="refresh" content="0; url=${pageUrl}" />
</head>
<body>
  <a href="${pageUrl}">${title}</a>
</body>
</html>`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function onRequestGet(context) {
  const { request, params } = context;
  const ua  = request.headers.get('user-agent') ?? '';
  const url = request.url;
  const id  = params.id;

  // Non-bot: pass through → _redirects serves index.html → React handles routing
  if (!BOT_UA.test(ua)) {
    return context.next();
  }

  const project = lookupProject(id);

  // Unknown highlight → let static 404 handle it
  if (!project) {
    return context.next();
  }

  const html = buildOgHtml(project, url);

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html;charset=UTF-8',
      // Cache at edge for 1 h, allow shared caches (LinkedIn's crawler cache)
      'cache-control': 'public, max-age=3600, s-maxage=3600',
      'x-robots-tag': 'index, follow',
    },
  });
}
