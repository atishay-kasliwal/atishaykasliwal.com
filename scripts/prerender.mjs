/**
 * Build-time prerenderer.
 *
 * Turns the SPA into a set of real static HTML files — one per route — each
 * carrying its own <head> and fully rendered markup. This is the single change
 * that makes the SEO work at all:
 *
 *   • Googlebot renders JavaScript, but on a deferred second pass. Static HTML
 *     gets indexed on the first pass, with the correct title and description.
 *   • The OG/Twitter crawlers behind LinkedIn, Slack, iMessage, WhatsApp, and X
 *     do NOT execute JavaScript, ever. Without this, every shared link on every
 *     platform shows the homepage's title and card regardless of the URL.
 *   • LCP stops waiting on React to boot, because content is in the document.
 *
 * Failure policy: a route that throws during render still gets a correct
 * head-only HTML file and is reported loudly at the end. A broken page is worse
 * than a client-rendered one, so we degrade rather than emit garbage.
 *
 * Run after `vite build` and `vite build --ssr` (see package.json).
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'build');
const SSR = path.join(ROOT, '.ssr', 'entry-server.mjs');

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

async function main() {
  const template = await fs.readFile(path.join(BUILD, 'index.html'), 'utf-8');
  const server = await import(pathToFileURL(SSR).href);

  const { render, renderHead, ROUTES, PROJECTS, BLOG_POSTS, staticSchemaFor, seoTitle, seoDescription } = server;

  /* ── Assemble the full route list ──────────────────────────────────── */
  const targets = [];

  for (const route of Object.values(ROUTES)) {
    if (route.path === '/404') continue; // handled separately below
    targets.push({
      url: route.path,
      overrides: {},
      // ProfilePage / FAQPage / CollectionPage per route — these must be in the
      // static HTML to be eligible for rich results.
      staticSchema: staticSchemaFor(route.path),
    });
  }

  for (const project of PROJECTS) {
    targets.push({
      url: `/projects/${project.slug}`,
      overrides: {
        path: `/projects/${project.slug}`,
        title: seoTitle(`${project.name} Case Study`),
        description: seoDescription(project.problem),
        breadcrumbs: [
          { name: 'Projects', path: '/projects' },
          { name: project.name, path: `/projects/${project.slug}` },
        ],
        image: project.image
          ? {
              url: `https://atishaykasliwal.com${project.image.src}`,
              width: project.image.width,
              height: project.image.height,
              alt: project.image.alt,
            }
          : undefined,
      },
      schemaFor: { type: 'project', data: project },
    });
  }

  for (const post of BLOG_POSTS || []) {
    targets.push({
      url: `/blog/${post.slug}`,
      overrides: {
        path: `/blog/${post.slug}`,
        title: seoTitle(post.title),
        description: seoDescription(post.description),
        ogType: 'article',
        datePublished: post.date,
        dateModified: post.updated || post.date,
        tags: post.tags,
        breadcrumbs: [
          { name: 'Writing', path: '/blog' },
          { name: post.title, path: `/blog/${post.slug}` },
        ],
      },
      schemaFor: { type: 'post', data: post },
    });
  }

  /* ── Render ────────────────────────────────────────────────────────── */
  const failures = [];
  let ok = 0;

  for (const target of targets) {
    const { url, overrides = {} } = target;

    // Extra JSON-LD nodes are built inside the SSR bundle, which owns the
    // schema generators.
    const schema = target.staticSchema ?? server.schemaFor(target.schemaFor);

    let appHtml = '';
    let prerendered = true;

    try {
      const result = await render(url);
      appHtml = result.html;

      /**
       * A thrown error is the easy case. The dangerous one is a route that
       * "succeeds" while React quietly swallows the error inside a Suspense
       * boundary and emits a client-rendering fallback marker instead of
       * content. That produces an empty page that reports as a success — which
       * is exactly what this script did before, claiming 20/20 while shipping
       * blank bodies. Both signals are checked.
       */
      if (result.errors?.length) {
        throw new Error(result.errors.join('; '));
      }
      if (appHtml.includes('Switched to client rendering')) {
        const detail = /data-msg="([^"]*)"/.exec(appHtml)?.[1] || 'unknown';
        throw new Error(`client-render fallback — ${detail.slice(0, 120)}`);
      }
      if (!appHtml.trim()) {
        throw new Error('rendered empty output');
      }
    } catch (err) {
      prerendered = false;
      appHtml = '';
      failures.push({ url, message: err.message.replace(/\s+/g, ' ').trim() });
    }

    const head = renderHead(url, overrides, schema);
    const html = inject(template, head, appHtml, prerendered);

    await writeRoute(url, html);
    if (prerendered) ok++;
  }

  /* ── 404: must be a real file at build/404.html for Cloudflare Pages ─ */
  const notFoundHead = renderHead('/404', {}, []);
  let notFoundHtml = '';
  try {
    const r = await render('/this-route-does-not-exist');
    if (!r.errors?.length && !r.html.includes('Switched to client rendering')) {
      notFoundHtml = r.html;
    }
  } catch {
    /* fall through to head-only */
  }
  await fs.writeFile(
    path.join(BUILD, '404.html'),
    inject(template, notFoundHead, notFoundHtml, Boolean(notFoundHtml)),
    'utf-8'
  );

  /* ── Report ────────────────────────────────────────────────────────── */
  console.log(
    `\n${GREEN}✓${RESET} prerendered ${GREEN}${ok}${RESET}/${targets.length} routes to static HTML`
  );

  if (failures.length) {
    console.log(
      `${YELLOW}!${RESET} ${failures.length} route(s) fell back to head-only ` +
        `${DIM}(correct meta + JSON-LD, body rendered client-side)${RESET}`
    );
    for (const f of failures) {
      console.log(`  ${YELLOW}·${RESET} ${f.url} ${DIM}— ${f.message}${RESET}`);
    }
    console.log(
      `${DIM}  Usually a browser-only API at module scope. Wrap the component in\n` +
        `  <ClientOnly> with a meaningful fallback to fix.${RESET}`
    );
  }
}

/**
 * Splice the per-route head and body into the built template.
 *
 * The template's own <title>/description/canonical/OG tags are stripped first —
 * leaving them in means two of each per page, and crawlers pick unpredictably.
 */
function inject(template, head, appHtml, prerendered) {
  let html = template;

  html = html
    .replace(/<title>[\s\S]*?<\/title>\s*/gi, '')
    .replace(/<meta\s+name=["'](description|keywords|robots|googlebot|twitter:[^"']*)["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+property=["'](og:[^"']*|article:[^"']*|profile:[^"']*)["'][^>]*>\s*/gi, '')
    .replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, '')
    // The template ships a homepage JSON-LD graph; per-route graphs replace it.
    .replace(/<script\s+type=["']application\/ld\+json["']>[\s\S]*?<\/script>\s*/gi, '');

  html = html.replace('</head>', `    ${head}\n  </head>`);

  html = html.replace(
    /<div id="root"([^>]*)><\/div>/,
    `<div id="root"$1${prerendered ? ' data-prerendered="true"' : ''}>${appHtml}</div>`
  );

  return html;
}

/** "/" → build/index.html;  "/about" → build/about/index.html */
async function writeRoute(url, html) {
  const target =
    url === '/'
      ? path.join(BUILD, 'index.html')
      : path.join(BUILD, url.replace(/^\//, ''), 'index.html');

  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, html, 'utf-8');
}

main().catch((err) => {
  console.error(`${RED}✗ prerender failed${RESET}\n`, err);
  process.exit(1);
});
