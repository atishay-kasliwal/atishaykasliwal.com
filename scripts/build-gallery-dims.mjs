/**
 * Records the intrinsic dimensions of every /art gallery image.
 *
 * The gallery is a CSS column masonry with `height: auto`, so the browser
 * reserves no space for an image until its bytes arrive. With ~40 remote images
 * that produced a visible reflow on every load — measured at 0.19 CLS, the
 * worst on the site once the prerendering issues were fixed.
 *
 * Dimensions cannot be hardcoded (the ratios vary and the URLs are remote), and
 * guessing one ratio for all of them just trades a big shift for many small
 * ones. So they are measured once at build time and written to a map the page
 * uses to set an exact `aspect-ratio` per tile.
 *
 * Only the leading bytes of each file are read — enough for the header that
 * carries the dimensions — rather than downloading whole images.
 *
 * Network failure is non-fatal: a missing entry simply falls back to the
 * previous behaviour for that one tile.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'pages', 'ArtPage.jsx');
const OUT = path.join(ROOT, 'src', 'data', 'generated', 'gallery-dims.json');

/** Pull the `images` array literal out of the page without importing JSX. */
async function readUrls() {
  const s = await fs.readFile(SRC, 'utf-8');
  const block = s.slice(s.indexOf('const images = ['));
  const arr = block.slice(0, block.indexOf('];') + 1);
  return [...arr.matchAll(/['"`](https?:\/\/[^'"`]+)['"`]/g)].map((m) => m[1]);
}

async function dimensionsOf(url) {
  // 64 KB covers the header of every JPEG/PNG/WebP we serve here.
  const res = await fetch(url, { headers: { Range: 'bytes=0-65535' } });
  if (!res.ok && res.status !== 206) throw new Error(`${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const { width, height } = await sharp(buf).metadata();
  if (!width || !height) throw new Error('no dimensions');
  return { w: width, h: height };
}

async function main() {
  const urls = await readUrls();
  if (!urls.length) {
    console.log('· no gallery URLs found — skipping');
    return;
  }

  let existing = {};
  try {
    existing = JSON.parse(await fs.readFile(OUT, 'utf-8'));
  } catch {
    /* first run */
  }

  const dims = { ...existing };
  let fetched = 0;
  let failed = 0;

  // Modest concurrency: enough to be quick, not enough to look abusive.
  const queue = urls.filter((u) => !dims[u]);
  const workers = Array.from({ length: 6 }, async () => {
    let url;
    while ((url = queue.pop())) {
      try {
        dims[url] = await dimensionsOf(url);
        fetched++;
      } catch {
        failed++;
      }
    }
  });
  await Promise.all(workers);

  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, JSON.stringify(dims, null, 2), 'utf-8');

  console.log(
    `✓ gallery dimensions: ${Object.keys(dims).length}/${urls.length} known` +
      (fetched ? ` (${fetched} newly measured)` : '') +
      (failed ? ` · ${failed} unavailable` : '')
  );
}

main().catch((err) => {
  console.warn('! gallery dimension build failed —', err.message);
});
