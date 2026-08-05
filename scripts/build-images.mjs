/**
 * Generates every derived image the site references: the canonical headshot,
 * icon set, and the OpenGraph card.
 *
 * Generated rather than committed so the whole set regenerates from one source
 * photo. Each output exists because something specific asks for it:
 *
 *   • 512×512 headshot — what Person schema points `image` at. Google prefers
 *     square for a person entity, and a knowledge panel will not use a portrait
 *     crop it has to guess at.
 *   • AVIF/WebP siblings — served via <picture> where supported; AVIF is
 *     typically 40–50% smaller than the JPEG at the same perceptual quality.
 *   • 1200×630 OG card — the aspect ratio every social crawler expects. Built
 *     as a composition with the name and title so a shared link reads as a
 *     deliberate card, not a cropped selfie.
 *
 * Idempotent: safe to run on every build.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');

/**
 * Source is the professional headshot (1000×1294). Note that
 * profile-dark-theme.jpg, despite the name, is the "A." monogram — not a photo —
 * so it is the logo source, not the portrait source.
 */
const SOURCE = path.join(PUBLIC, 'portrait.jpeg');
const LOGO_SOURCE = path.join(PUBLIC, 'profile-dark-theme.jpg');

/**
 * Face-centered square crop, in source pixels.
 *
 * sharp's `position: 'top'` would keep the top 1000×1000, which leaves the face
 * high and a band of empty shoulder below. These bounds frame head and
 * shoulders the way a headshot should sit, and being explicit means the crop is
 * reproducible rather than dependent on a saliency heuristic.
 */
const FACE_CROP = { left: 90, top: 70, width: 820, height: 820 };

const NAME = 'Atishay Kasliwal';
const TITLE = 'AI Engineer';
const TAGLINE = 'Production LLM, RAG, and agent systems';
const DOMAIN = 'atishaykasliwal.com';

const BG = '#0a0c0e';
const FG = '#ece9e4';
const MUTED = '#9aa1ab';
const ACCENT = '#a5b4fc';

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function main() {
  try {
    await fs.access(SOURCE);
  } catch {
    console.warn(`! source photo missing (${path.relative(ROOT, SOURCE)}) — skipping image build`);
    return;
  }

  await ensureDir(path.join(PUBLIC, 'icons'));
  await ensureDir(path.join(PUBLIC, 'og'));

  const written = [];

  /* Every derived image starts from the same face-centered square, so the
     framing is identical across the headshot, icons, and OG card. */
  const squareBuffer = await sharp(SOURCE).extract(FACE_CROP).toBuffer();
  const square = () => sharp(squareBuffer);

  /* ── Headshot, in three formats ─────────────────────────────────────── */
  const headshot = square().resize(512, 512, { fit: 'cover' });

  await headshot
    .clone()
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(path.join(PUBLIC, 'atishay-kasliwal-headshot-512.jpg'));
  await headshot
    .clone()
    .webp({ quality: 84 })
    .toFile(path.join(PUBLIC, 'atishay-kasliwal-headshot-512.webp'));
  await headshot
    .clone()
    .avif({ quality: 62 })
    .toFile(path.join(PUBLIC, 'atishay-kasliwal-headshot-512.avif'));
  written.push('headshot-512 (jpg/webp/avif)');

  /* ── Larger portrait for the about page ─────────────────────────────── */
  const portrait = square().resize(1200, 1200, { fit: 'cover' });
  await portrait
    .clone()
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(path.join(PUBLIC, 'atishay-kasliwal-portrait.jpg'));
  await portrait
    .clone()
    .webp({ quality: 82 })
    .toFile(path.join(PUBLIC, 'atishay-kasliwal-portrait.webp'));
  written.push('portrait-1200 (jpg/webp)');

  /* ── Icons ──────────────────────────────────────────────────────────── */
  const iconSizes = [
    [16, 'icons/favicon-16.png'],
    [32, 'icons/favicon-32.png'],
    [180, 'icons/apple-touch-icon.png'],
    [192, 'icons/icon-192.png'],
    [512, 'icons/icon-512.png'],
  ];

  /**
   * Icons come from the LOGO, not the portrait.
   *
   * These were briefly generated from the face crop, which replaced the "A."
   * monogram in the browser tab with a photograph. A favicon is rendered at
   * 16px: a face is unrecognisable at that size, and the mark is the brand.
   * The photo belongs on the headshot, the about page, and the social card —
   * not the tab.
   */
  for (const [size, out] of iconSizes) {
    await sharp(LOGO_SOURCE)
      .resize(size, size, { fit: 'contain', background: BG })
      // palette + quantisation: the 512 icon was 414 KB as truecolour PNG.
      .png({ compressionLevel: 9, palette: true, quality: 90 })
      .toFile(path.join(PUBLIC, out));
  }
  written.push(`icons (${iconSizes.map(([s]) => s).join(', ')})`);

  /* Maskable icon: Android crops to a circle, so the safe zone is the middle
     80%. Padding the source prevents the head being clipped. */
  await sharp(LOGO_SOURCE)
    .resize(410, 410, { fit: 'contain', background: BG })
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: BG,
    })
    .png({ compressionLevel: 9 })
    .toFile(path.join(PUBLIC, 'icons/icon-maskable-512.png'));
  written.push('maskable icon');

  /* ── OpenGraph card ─────────────────────────────────────────────────── */
  const avatar = await square()
    .resize(260, 260, { fit: 'cover' })
    .composite([
      {
        // Circular mask via destination-in — sharp has no border-radius.
        input: Buffer.from(
          `<svg width="260" height="260"><circle cx="130" cy="130" r="130" fill="#fff"/></svg>`
        ),
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer();

  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* Fonts are referenced by family name only. The renderer falls back to a
     system sans, which is fine — this is a static card, and embedding a
     webfont here would mean shipping the font file just to build an image. */
  const card = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${BG}"/>
  <rect x="0" y="0" width="1200" height="4" fill="${ACCENT}"/>

  <!-- faint grid, echoes the site's surface treatment -->
  <g stroke="#ffffff" stroke-opacity="0.035" stroke-width="1">
    ${Array.from({ length: 11 }, (_, i) => `<line x1="${i * 120}" y1="0" x2="${i * 120}" y2="630"/>`).join('\n    ')}
    ${Array.from({ length: 6 }, (_, i) => `<line x1="0" y1="${i * 126}" x2="1200" y2="${i * 126}"/>`).join('\n    ')}
  </g>

  <text x="80" y="248" font-family="Inter, Helvetica, Arial, sans-serif" font-size="68" font-weight="700" fill="${FG}" letter-spacing="-2.4">${esc(NAME)}</text>
  <text x="80" y="312" font-family="Inter, Helvetica, Arial, sans-serif" font-size="38" font-weight="600" fill="${ACCENT}" letter-spacing="-0.8">${esc(TITLE)}</text>
  <text x="80" y="372" font-family="Inter, Helvetica, Arial, sans-serif" font-size="26" font-weight="400" fill="${MUTED}">${esc(TAGLINE)}</text>

  <line x1="80" y1="470" x2="1120" y2="470" stroke="#ffffff" stroke-opacity="0.1" stroke-width="1"/>
  <text x="80" y="516" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="22" fill="${MUTED}" letter-spacing="1.6">${esc(DOMAIN)}</text>
</svg>`;

  await sharp(Buffer.from(card))
    .composite([{ input: avatar, top: 150, left: 860 }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(PUBLIC, 'og/atishay-kasliwal-og.png'));

  // JPEG sibling: a few crawlers still handle JPEG more reliably than PNG.
  await sharp(Buffer.from(card))
    .composite([{ input: avatar, top: 150, left: 860 }])
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(path.join(PUBLIC, 'og/atishay-kasliwal-og.jpg'));
  written.push('OG card 1200×630 (png/jpg)');


  /* ── Footer lapel pins ──────────────────────────────────────────────────
     Ten PNGs totalling ~1.8 MB, rendered in a 10-column grid at roughly 100 CSS
     pixels each — about 5x more image data than any of them can display. One of
     them was measuring as the homepage's LCP element purely because of its
     weight. Resized to 240px (2x for retina) and emitted as WebP alongside the
     original, which the markup picks up through <picture>. */
  const PIN_DIR = path.join(PUBLIC, 'final-product');
  try {
    const pins = (await fs.readdir(PIN_DIR)).filter((f) => /\.png$/i.test(f));
    let saved = 0;
    for (const file of pins) {
      const src = path.join(PIN_DIR, file);
      const before = (await fs.stat(src)).size;
      const out = path.join(PIN_DIR, file.replace(/\.png$/i, '.webp'));
      await sharp(src)
        .resize(240, 240, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82, alphaQuality: 90 })
        .toFile(out);
      saved += before - (await fs.stat(out)).size;
    }
    written.push(`${pins.length} footer pins -> webp (saved ${(saved / 1024 / 1024).toFixed(1)} MB)`);
  } catch {
    /* directory absent — nothing to do */
  }

  console.log(`✓ images: ${written.join(' · ')}`);
}

main().catch((err) => {
  console.error('✗ image build failed\n', err);
  process.exit(1);
});
