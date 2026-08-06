/**
 * Fails the build when prerendered HTML references a local file that is not in
 * build/.
 *
 * This exists because two broken references shipped to production and stayed
 * there unnoticed: every project page pointed its hero and its og:image at
 * /projects/<slug>-cover.jpg, and organizationSchema() pointed Organization.logo
 * at /atishay-kasliwal-logo.png. Neither file was ever generated. Nothing
 * failed, because a missing image is a silent 404 — the page renders, the build
 * passes, and the damage only shows up when someone shares a link and gets an
 * empty preview card.
 *
 * A missing og:image is worse than a missing <img>: the crawler caches the
 * failure, so the broken card outlives the fix.
 *
 * Runs last in `npm run build`, after prerender and feeds, so it sees the same
 * bytes that get deployed.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ORIGIN } from '../src/data/site.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'build');

/**
 * Attributes worth checking. `content` is included for the OG and Twitter meta
 * tags, which is where a dead reference does the most damage.
 */
const REF = /(?:src|href|content)="([^"]+)"/g;

/**
 * JSON-LD blocks, scanned separately.
 *
 * Attribute matching alone is not enough, and this was proven the hard way: the
 * first version of this check passed cleanly while /atishay-kasliwal-logo.png
 * was missing, because Organization.logo lives in a ld+json payload as a JSON
 * string value, not in any HTML attribute. Schema references are exactly the
 * ones nobody eyeballs, so they need to be covered here or the check gives
 * false confidence about the references that matter most.
 */
const LD_JSON = /<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi;
const JSON_STRING = /"([^"]+)"/g;

/** Extensions that name a file on disk. Routes like /about/ are not files. */
const ASSET = /\.(jpe?g|png|webp|avif|gif|svg|mp4|webm|pdf|ico|xml|json|txt|css|js|woff2?)$/i;

async function htmlFiles(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await htmlFiles(full)));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

async function main() {
  let pages;
  try {
    pages = await htmlFiles(BUILD);
  } catch {
    console.warn('! no build/ directory — skipping asset check');
    return;
  }

  /* Keyed by asset path so one missing file shared across 20 pages reports as
     one problem with its referrers, not 20 separate lines. */
  const missing = new Map();
  let checked = 0;

  for (const page of pages) {
    const html = await fs.readFile(page, 'utf-8');
    const from = path.relative(BUILD, page);

    const refs = [...html.matchAll(REF)].map((m) => m[1]);
    for (const [, block] of html.matchAll(LD_JSON)) {
      for (const [, value] of block.matchAll(JSON_STRING)) refs.push(value);
    }

    for (const raw of refs) {
      let ref = raw.trim();

      // Only local references. Absolute URLs on our own origin count as local.
      if (ref.startsWith(ORIGIN)) ref = ref.slice(ORIGIN.length);
      if (!ref.startsWith('/') || ref.startsWith('//')) continue;

      // Strip query and fragment before touching the filesystem.
      const clean = decodeURIComponent(ref.split(/[?#]/)[0]);
      if (!ASSET.test(clean)) continue;

      checked += 1;
      try {
        await fs.access(path.join(BUILD, clean));
      } catch {
        if (!missing.has(clean)) missing.set(clean, new Set());
        missing.get(clean).add(from);
      }
    }
  }

  if (missing.size === 0) {
    console.log(`✓ assets: ${checked} references across ${pages.length} pages, all resolve`);
    return;
  }

  console.error(`\n✗ ${missing.size} referenced asset(s) missing from build/:\n`);
  for (const [asset, referrers] of missing) {
    const list = [...referrers];
    const shown = list.slice(0, 3).join(', ');
    const more = list.length > 3 ? ` (+${list.length - 3} more)` : '';
    console.error(`  ${asset}\n    referenced by ${shown}${more}\n`);
  }
  process.exit(1);
}

main().catch((err) => {
  console.error('✗ asset check failed\n', err);
  process.exit(1);
});
