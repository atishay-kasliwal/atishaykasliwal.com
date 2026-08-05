/**
 * Local preview server that mirrors Cloudflare Pages resolution.
 *
 * `vite preview` cannot be used for this build. It runs in SPA mode: any route
 * that is not a literal file gets history-fallback to the root index.html. That
 * silently serves the HOMEPAGE for /about, /projects, /blog, and every other
 * route — so the entire prerendering effort looks broken locally while being
 * completely correct on the real host. Debugging against it is worse than not
 * previewing at all, because it reports a failure that does not exist.
 *
 * Cloudflare Pages resolves in this order, which is what this reproduces:
 *   1. exact file match            /rss.xml       -> build/rss.xml
 *   2. directory index             /about         -> build/about/index.html
 *   3. _redirects rules            /Highlights/x  -> rewrite or redirect
 *   4. 404.html with a 404 status
 */

import http from 'node:http';
import zlib from 'node:zlib';
import { promisify } from 'node:util';

const gzip = promisify(zlib.gzip);
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUILD = path.resolve(__dirname, '..', 'build');
const PORT = Number(process.env.PORT || 4173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
};

/** Parse _redirects into ordered rules. */
async function loadRedirects() {
  try {
    const raw = await fs.readFile(path.join(BUILD, '_redirects'), 'utf-8');
    return raw
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))
      .map((line) => {
        const [from, to, status = '200'] = line.split(/\s+/);
        return { from, to, status: parseInt(status, 10) };
      });
  } catch {
    return [];
  }
}

const matchRule = (rule, pathname) => {
  if (rule.from === pathname) return {};
  if (rule.from.endsWith('/*')) {
    const prefix = rule.from.slice(0, -1);
    if (pathname.startsWith(prefix)) return { splat: pathname.slice(prefix.length) };
  }
  return null;
};

/**
 * Text assets are gzipped, because Cloudflare serves them compressed and an
 * uncompressed local preview understates real-world performance badly — the JS
 * and CSS bundles are roughly 3-4x smaller over the wire in production, which
 * is most of the difference in a throttled Lighthouse run.
 */
const COMPRESSIBLE = /\.(html|js|mjs|css|json|xml|txt|svg)$/i;

async function serveFile(res, filePath, status = 200, acceptEncoding = '') {
  let body = await fs.readFile(filePath);
  const headers = {
    'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
  };

  if (COMPRESSIBLE.test(filePath) && /\bgzip\b/.test(acceptEncoding)) {
    body = await gzip(body);
    headers['Content-Encoding'] = 'gzip';
    headers.Vary = 'Accept-Encoding';
  }

  // Mirror the production cache headers from public/_headers.
  headers['Cache-Control'] = filePath.includes(`${path.sep}assets${path.sep}`)
    ? 'public, max-age=31536000, immutable'
    : 'public, max-age=0, must-revalidate';

  headers['Content-Length'] = body.length;
  res.writeHead(status, headers);
  res.end(body);
}

const exists = async (p) => {
  try {
    const s = await fs.stat(p);
    return s.isFile();
  } catch {
    return false;
  }
};

const redirects = await loadRedirects();

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    let pathname = decodeURIComponent(url.pathname);

    // Guard against path traversal before touching the filesystem.
    const safe = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
    const target = path.join(BUILD, safe);
    if (!target.startsWith(BUILD)) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    // 1. exact file
    const enc = req.headers['accept-encoding'] || '';

    if (await exists(target)) return serveFile(res, target, 200, enc);

    // 2. directory index — this is the step vite preview skips
    const asIndex = path.join(target, 'index.html');
    if (await exists(asIndex)) return serveFile(res, asIndex, 200, enc);

    // 3. _redirects
    for (const rule of redirects) {
      const m = matchRule(rule, pathname);
      if (!m) continue;

      const dest = rule.to.replace(':splat', m.splat ?? '');

      if (rule.status >= 300 && rule.status < 400) {
        res.writeHead(rule.status, { Location: dest }).end();
        return;
      }

      const destFile = path.join(BUILD, dest);
      if (await exists(destFile)) return serveFile(res, destFile, rule.status, enc);
      const destIndex = path.join(BUILD, dest, 'index.html');
      if (await exists(destIndex)) return serveFile(res, destIndex, rule.status, enc);
    }

    // 4. 404
    const notFound = path.join(BUILD, '404.html');
    if (await exists(notFound)) return serveFile(res, notFound, 404, enc);
    res.writeHead(404).end('Not found');
  })
  .listen(PORT, () => {
    console.log(`\n  Preview (Cloudflare Pages semantics)  http://localhost:${PORT}\n`);
  });
