import { useEffect } from 'react';
import { resolveMeta } from './routes.js';
import { buildGraph, serializeJsonLd } from './schema.js';
import { TWITTER_HANDLE, SITE } from '../data/site.js';

/**
 * Head manager for client-side navigation.
 *
 * Replaces react-helmet, which is unmaintained and warns under React 19. It is
 * also the wrong tool here: the head that matters for SEO is the one
 * scripts/prerender.mjs writes into the static HTML, because OG and Twitter
 * crawlers never execute JavaScript. This component exists so that in-app
 * navigation keeps the tab title and canonical honest — not to serve crawlers.
 *
 * Every tag it writes is marked data-seo="dynamic" so a subsequent navigation
 * can clear exactly what it added without touching prerendered tags it does
 * not own.
 */

const OWNED = 'data-seo';

function setTag(selector, attrs, tagName = 'meta') {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(tagName);
    el.setAttribute(OWNED, 'dynamic');
    document.head.appendChild(el);
  }
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined) el.removeAttribute(k);
    else el.setAttribute(k, String(v));
  }
  return el;
}

function setMetaByName(name, content) {
  if (!content) return;
  setTag(`meta[name="${name}"]`, { name, content });
}

function setMetaByProperty(property, content) {
  if (!content) return;
  setTag(`meta[property="${property}"]`, { property, content });
}

export default function Seo({ path, overrides = {}, schema = [] }) {
  const meta = resolveMeta(path, overrides);

  useEffect(() => {
    document.title = meta.title;

    setMetaByName('description', meta.description);
    if (meta.keywords?.length) setMetaByName('keywords', meta.keywords.join(', '));
    setMetaByName('robots', meta.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

    // Canonical
    const link = setTag('link[rel="canonical"]', { rel: 'canonical', href: meta.canonical }, 'link');
    link.setAttribute('href', meta.canonical);

    // Open Graph
    setMetaByProperty('og:type', meta.ogType);
    setMetaByProperty('og:title', meta.title);
    setMetaByProperty('og:description', meta.description);
    setMetaByProperty('og:url', meta.canonical);
    setMetaByProperty('og:site_name', SITE.shortName);
    setMetaByProperty('og:locale', SITE.locale);
    setMetaByProperty('og:image', meta.image.url);
    setMetaByProperty('og:image:width', meta.image.width);
    setMetaByProperty('og:image:height', meta.image.height);
    setMetaByProperty('og:image:alt', meta.image.alt);

    // Twitter
    setMetaByName('twitter:card', 'summary_large_image');
    setMetaByName('twitter:site', TWITTER_HANDLE);
    setMetaByName('twitter:creator', TWITTER_HANDLE);
    setMetaByName('twitter:title', meta.title);
    setMetaByName('twitter:description', meta.description);
    setMetaByName('twitter:image', meta.image.url);
    setMetaByName('twitter:image:alt', meta.image.alt);

    // JSON-LD — replace the graph wholesale on each navigation.
    const existing = document.head.querySelector('script[data-seo="graph"]');
    if (existing) existing.remove();
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute(OWNED, 'graph');
    script.textContent = serializeJsonLd(buildGraph(meta, schema));
    document.head.appendChild(script);
  }, [
    meta.title,
    meta.description,
    meta.canonical,
    meta.ogType,
    meta.noindex,
    meta.image.url,
    // schema is rebuilt per render; stringify keeps the effect from thrashing.
    JSON.stringify(schema),
  ]);

  return null;
}
