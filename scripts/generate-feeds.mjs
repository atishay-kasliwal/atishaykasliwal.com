/**
 * Generates sitemap.xml, robots.txt, and the three feed formats into build/.
 *
 * Generated rather than hand-maintained because a stale sitemap is worse than
 * none: it teaches Google to distrust the file and wastes crawl budget on URLs
 * that no longer exist. Everything here derives from the same route registry
 * the app renders from, so the two cannot drift.
 *
 * Runs after prerender, so it can stat the emitted HTML for lastmod.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'build');
const SSR = path.join(ROOT, '.ssr', 'entry-server.mjs');

const ORIGIN = 'https://atishaykasliwal.com';
const AUTHOR = 'Atishay Kasliwal';
const EMAIL = 'hire@atishaykasliwal.com';

const esc = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const today = new Date().toISOString().slice(0, 10);

async function main() {
  const { ROUTES, PROJECTS, BLOG_POSTS } = await import(pathToFileURL(SSR).href);

  /* ── Sitemap ───────────────────────────────────────────────────────── */
  const urls = [];

  for (const route of Object.values(ROUTES)) {
    // `hidden` routes are real pages with no content yet — including them
    // invites Google to index thin pages, which drags down site quality.
    if (route.noindex || route.hidden) continue;
    urls.push({
      loc: route.path === '/' ? `${ORIGIN}/` : `${ORIGIN}${route.path}/`,
      lastmod: today,
      changefreq: route.changefreq || 'monthly',
      priority: route.priority ?? 0.5,
    });
  }

  for (const p of PROJECTS) {
    urls.push({
      loc: `${ORIGIN}/projects/${p.slug}/`,
      lastmod: today,
      changefreq: 'monthly',
      priority: p.featured ? 0.8 : 0.6,
      image: p.image
        ? { loc: `${ORIGIN}${p.image.src}`, title: p.name, caption: p.image.alt }
        : null,
    });
  }

  for (const post of BLOG_POSTS) {
    urls.push({
      loc: `${ORIGIN}/blog/${post.slug}/`,
      lastmod: (post.updated || post.date || today).slice(0, 10),
      changefreq: 'yearly',
      priority: 0.7,
    });
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls
  .map(
    (u) => `  <url>
    <loc>${esc(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority.toFixed(1)}</priority>${
      u.image
        ? `
    <image:image>
      <image:loc>${esc(u.image.loc)}</image:loc>
      <image:title>${esc(u.image.title)}</image:title>
      <image:caption>${esc(u.image.caption)}</image:caption>
    </image:image>`
        : ''
    }
  </url>`
  )
  .join('\n')}
</urlset>
`;

  await fs.writeFile(path.join(BUILD, 'sitemap.xml'), sitemap, 'utf-8');

  /* ── robots.txt ────────────────────────────────────────────────────── */
  const robots = `# https://atishaykasliwal.com
User-agent: *
Allow: /

# Crawling these wastes budget and they are noindex anyway.
Disallow: /404
Disallow: /*?q=

# AI crawlers are allowed — being cited by an assistant is distribution,
# and the content here is public professional information either way.
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

Sitemap: ${ORIGIN}/sitemap.xml
`;

  await fs.writeFile(path.join(BUILD, 'robots.txt'), robots, 'utf-8');

  /* ── Feeds ─────────────────────────────────────────────────────────── */
  const posts = [...BLOG_POSTS].sort((a, b) => new Date(b.date) - new Date(a.date));
  const updated = posts[0]?.date ? new Date(posts[0].date).toISOString() : new Date().toISOString();

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${esc(AUTHOR)} — Writing</title>
    <link>${ORIGIN}/blog</link>
    <description>Notes on building AI systems that survive contact with production.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date(updated).toUTCString()}</lastBuildDate>
    <atom:link href="${ORIGIN}/rss.xml" rel="self" type="application/rss+xml" />
${posts
  .map(
    (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${ORIGIN}/blog/${p.slug}</link>
      <guid isPermaLink="true">${ORIGIN}/blog/${p.slug}</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <description>${esc(p.description)}</description>
      <author>${esc(EMAIL)} (${esc(AUTHOR)})</author>
${p.tags.map((t) => `      <category>${esc(t)}</category>`).join('\n')}
      <content:encoded><![CDATA[${p.html}]]></content:encoded>
    </item>`
  )
  .join('\n')}
  </channel>
</rss>
`;

  const atom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${esc(AUTHOR)} — Writing</title>
  <link href="${ORIGIN}/blog" />
  <link href="${ORIGIN}/atom.xml" rel="self" />
  <updated>${updated}</updated>
  <id>${ORIGIN}/</id>
  <author><name>${esc(AUTHOR)}</name><email>${esc(EMAIL)}</email></author>
${posts
  .map(
    (p) => `  <entry>
    <title>${esc(p.title)}</title>
    <link href="${ORIGIN}/blog/${p.slug}" />
    <id>${ORIGIN}/blog/${p.slug}</id>
    <updated>${new Date(p.updated || p.date).toISOString()}</updated>
    <published>${new Date(p.date).toISOString()}</published>
    <summary>${esc(p.description)}</summary>
  </entry>`
  )
  .join('\n')}
</feed>
`;

  const jsonFeed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: `${AUTHOR} — Writing`,
    home_page_url: `${ORIGIN}/blog`,
    feed_url: `${ORIGIN}/feed.json`,
    description: 'Notes on building AI systems that survive contact with production.',
    authors: [{ name: AUTHOR, url: ORIGIN }],
    language: 'en-US',
    items: posts.map((p) => ({
      id: `${ORIGIN}/blog/${p.slug}`,
      url: `${ORIGIN}/blog/${p.slug}`,
      title: p.title,
      summary: p.description,
      content_html: p.html,
      date_published: new Date(p.date).toISOString(),
      tags: p.tags,
    })),
  };

  await Promise.all([
    fs.writeFile(path.join(BUILD, 'rss.xml'), rss, 'utf-8'),
    fs.writeFile(path.join(BUILD, 'atom.xml'), atom, 'utf-8'),
    fs.writeFile(path.join(BUILD, 'feed.json'), JSON.stringify(jsonFeed, null, 2), 'utf-8'),
  ]);

  console.log(
    `✓ sitemap.xml (${urls.length} urls) · robots.txt · rss.xml / atom.xml / feed.json (${posts.length} posts)`
  );
}

main().catch((err) => {
  console.error('✗ feed generation failed\n', err);
  process.exit(1);
});
