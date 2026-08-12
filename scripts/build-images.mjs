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
import { PROJECTS } from '../src/data/projects.js';

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

/**
 * The generic placeholder plate: accent wash, the site's grid, a motif, and an
 * index numeral. No words, deliberately — see the call site in the project loop
 * for why a label cannot survive everything drawn over these.
 *
 * Shared by project tiles and blog tiles so the two sit in the same visual
 * family. `index` selects the motif and cycles, so any number of items is fine.
 */
function plateSvg(index, width, height) {
    /* No bottom fade is baked into this file. The browse card and the info
     overlay each draw their own caption scrim over it, and a third gradient
     here compounded with those two and crushed the motif to black — the
     reason the first version of these tiles looked like failed image loads. */
  const num = String(index + 1).padStart(2, '0');
  const cx = Math.round(width * 0.72);
  const cy = Math.round(height * 0.44);

    /* One motif per project, cycling if the catalogue outgrows the set. Each is
       built from the same two primitives the site already uses — hairlines and
       the accent — so they read as a family rather than as five illustrations. */
  const motifs = [
    // 0 · Concentric rings, radiating from the right.
      Array.from({ length: 7 }, (_, i) =>
        `<circle cx="${cx}" cy="${cy}" r="${120 + i * 105}" fill="none" stroke="${ACCENT}" stroke-opacity="${(0.3 - i * 0.036).toFixed(3)}" stroke-width="${i < 2 ? 2 : 1}"/>`
      ).join('\n    '),

    // 1 · Perspective grid converging on a horizon.
      [
        ...Array.from({ length: 17 }, (_, i) =>
          `<line x1="${-600 + i * 200}" y1="${height}" x2="${cx}" y2="${cy}" stroke="${ACCENT}" stroke-opacity="0.16" stroke-width="1"/>`
        ),
        ...Array.from({ length: 7 }, (_, i) => {
          const y = cy + Math.pow(i / 6, 2.2) * (height - cy);
          return `<line x1="0" y1="${Math.round(y)}" x2="${width}" y2="${Math.round(y)}" stroke="${ACCENT}" stroke-opacity="${(0.07 + i * 0.028).toFixed(3)}" stroke-width="1"/>`;
        }),
      ].join('\n    '),

    // 2 · Diagonal bar field, thinning to the left.
      Array.from({ length: 22 }, (_, i) =>
        `<rect x="${i * 92 - 300}" y="-200" width="${8 + (i % 3) * 6}" height="${height + 400}" fill="${ACCENT}" fill-opacity="${(0.04 + i * 0.009).toFixed(3)}" transform="rotate(18 ${i * 92 - 300} ${height / 2})"/>`
      ).join('\n    '),

    // 3 · Dot matrix with a radial falloff toward the focal point.
      Array.from({ length: 13 * 8 }, (_, i) => {
        const gx = (i % 13) * 128 + 64;
        const gy = Math.floor(i / 13) * 118 + 60;
        const d = Math.hypot(gx - cx, gy - cy) / 900;
        const o = Math.max(0, 0.42 - d * 0.42);
        return o < 0.02
          ? ''
          : `<circle cx="${gx}" cy="${gy}" r="${(3 + (1 - d) * 7).toFixed(1)}" fill="${ACCENT}" fill-opacity="${o.toFixed(3)}"/>`;
      })
        .filter(Boolean)
        .join('\n    '),

    // 4 · Signal bars, a waveform read left to right.
      Array.from({ length: 46 }, (_, i) => {
        const h = Math.round(
          (0.16 + 0.34 * Math.abs(Math.sin(i * 0.42)) + 0.22 * Math.abs(Math.sin(i * 0.13))) * height
        );
        return `<rect x="${i * 35 + 12}" y="${Math.round((height - h) / 2)}" width="14" height="${h}" fill="${ACCENT}" fill-opacity="${(0.08 + (i % 5) * 0.035).toFixed(3)}"/>`;
      }).join('\n    '),
    ];

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="${Math.round((cx / width) * 100)}%" cy="${Math.round((cy / height) * 100)}%" r="70%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.34"/>
      <stop offset="55%" stop-color="#7c3aed" stop-opacity="0.13"/>
      <stop offset="100%" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${width}" height="${height}" fill="${BG}"/>

  <g stroke="#ffffff" stroke-opacity="0.05" stroke-width="1">
    ${Array.from({ length: 13 }, (_, i) => `<line x1="${i * 128}" y1="0" x2="${i * 128}" y2="${height}"/>`).join('\n    ')}
    ${Array.from({ length: 8 }, (_, i) => `<line x1="0" y1="${i * 128}" x2="${width}" y2="${i * 128}"/>`).join('\n    ')}
  </g>

  <g>
    ${motifs[index % motifs.length]}
  </g>

  <rect width="${width}" height="${height}" fill="url(#glow)"/>

  <text x="112" y="${Math.round(height * 0.44)}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="300" font-weight="700" fill="#ffffff" fill-opacity="0.16" letter-spacing="-14">${num}</text>

  <rect x="0" y="0" width="${width}" height="5" fill="${ACCENT}"/>
</svg>`;
}

/**
 * Real imagery, per project, overriding the generated plate above.
 *
 * The cover-card note explains why the plates exist: most of the repo's image
 * assets do not depict the work, and several are not even what their filename
 * says — fomc_market_predictions_1min.png is a photograph of a lapel pin, T1.png
 * is a photo of the Wake Forest campus, and bigdata.jpg is an AVIF, not a JPEG.
 * A wrong image is worse than an abstract one, so nothing gets used here
 * without having been opened and checked.
 *
 * Two kinds of source, both honest but in different ways:
 *
 *   'cover'  A real screenshot of the thing running, cropped to fill. Only
 *            Atriveo has one, and it is the dark-theme dashboard, so it needs
 *            no taming to sit on this page.
 *   'art'    Abstract imagery that illustrates the domain without claiming to
 *            be a screenshot — candlesticks for a markets pipeline, a node
 *            graph for a retrieval index. Dimmed further than a screenshot
 *            because it is texture, not information.
 *   'slice'  The MRI composite (see composeSlice), which is neither: a real
 *            scan, but one that has to be placed on the plate rather than
 *            cropped to fill, because it is a small subject on black.
 *
 * A slug absent from this map keeps its generated plate. PolicyFabric is the
 * one such project — nothing in the repo depicts it, and the node-graph art
 * that would suit it is already carrying Legal RAG on /highlights.
 */
const TILE_SOURCES = {
  atriveo: { file: 'Atriveo6th.jpg', mode: 'cover' },
  'fomc-intelligence': { file: 'fmocc.jpeg', mode: 'art' },
  'legal-rag': { file: '4th.jpeg', mode: 'art' },
  'mri-tumor-viewer': { mode: 'slice' },
};

/**
 * The plate minus its motif and numeral: ground, grid, glow, accent rule.
 *
 * Shared so a tile built from a real image sits in the same frame as a
 * generated one — same background, same hairline pitch, same 5px accent edge at
 * the top — rather than reading as a photograph dropped into a different set.
 */
function backdropSvg(width, height, focusX = 0.66) {
  const pitch = Math.round(width / 12.5);
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="${Math.round(focusX * 100)}%" cy="46%" r="66%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.26"/>
      <stop offset="55%" stop-color="#7c3aed" stop-opacity="0.11"/>
      <stop offset="100%" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="${BG}"/>
  <g stroke="#ffffff" stroke-opacity="0.05" stroke-width="1">
    ${Array.from({ length: 13 }, (_, i) => `<line x1="${i * pitch}" y1="0" x2="${i * pitch}" y2="${height}"/>`).join('\n    ')}
    ${Array.from({ length: 8 }, (_, i) => `<line x1="0" y1="${i * pitch}" x2="${width}" y2="${i * pitch}"/>`).join('\n    ')}
  </g>
  <rect width="${width}" height="${height}" fill="url(#glow)"/>
  <rect x="0" y="0" width="${width}" height="${Math.max(4, Math.round(height / 160))}" fill="${ACCENT}"/>
</svg>`;
}

/**
 * Artwork sets for the /about taste index, each normalised to its own shape.
 *
 * Adding a set is a row in this table plus a folder — nothing in the loop that
 * consumes it is per-set. A missing folder is not an error: the row it feeds
 * falls back to photographs, so art can land one set at a time.
 */
const ARTWORK = [
  { dir: 'albums', label: 'album covers', width: 600, height: 600 },
  { dir: 'posters', label: 'film posters', width: 500, height: 750 },
];

/** Where the axial T1 slice lives. Checked before use — it is a repo asset. */
const SLICE = path.join(ROOT, 'src', 'assets', 'brain t1.jpg');

/**
 * The MRI plate: a real axial T1 slice seated on the backdrop.
 *
 * `screen` rather than a plain paste so the slice's pure-black surround drops
 * out and the grid and glow read through it. Pasted normally it is a black
 * rectangle sitting on the plate.
 *
 * Brightness is lifted here because every consumer takes it back down again —
 * the hero at opacity 0.55 and brightness 0.88, the browse card under a caption
 * scrim. A raw slice lands nearly black once those apply.
 *
 * `focusX` exists because the two frames crop differently: the hero masks its
 * left 42% into the text column, so a centred brain would be half dissolved,
 * while the browse tile shows the full width and wants it centred.
 */
async function composeSlice(width, height, focusX) {
  const slice = await sharp(SLICE)
    .resize({ height: Math.round(height * 0.78) })
    .modulate({ brightness: 1.22 })
    .linear(1.15, -12)
    .toBuffer({ resolveWithObject: true });

  return sharp(Buffer.from(backdropSvg(width, height, focusX)))
    .composite([
      {
        input: slice.data,
        left: Math.round(width * focusX) - Math.round(slice.info.width / 2),
        top: Math.round(height / 2) - Math.round(slice.info.height / 2),
        blend: 'screen',
      },
    ])
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer();
}

/**
 * A tile built from a real image rather than from a motif.
 *
 * Cropped to fill with `position: 'attention'`, which picks the crop window by
 * saliency. These sources are all wider or taller than 16:9 and none of them
 * has its subject dead centre — a fixed centre crop cut the Atriveo screenshot
 * through the middle of its chart.
 *
 * Toning is the point of the rest. The row has to read as one set, so a
 * photograph gets pulled toward the plates rather than the plates being
 * brightened toward it: saturation down, and for 'art' a heavier brightness cut
 * because abstract texture at full strength competes with the caption over it.
 */
async function sourceTile(source, width, height) {
  const image = sharp(path.join(PUBLIC, source.file))
    .resize(width, height, { fit: 'cover', position: 'attention' })
    .modulate({
      saturation: source.mode === 'art' ? 0.72 : 0.88,
      brightness: source.mode === 'art' ? 0.74 : 0.92,
    });

  /* The same accent edge every generated plate carries, composited on top so
     it survives the crop. */
  const rule = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${width}" height="${Math.max(4, Math.round(height / 160))}" fill="${ACCENT}"/></svg>`
  );

  return image
    .composite([{ input: rule, top: 0, left: 0 }])
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();
}


async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function readJsonFile(file) {
  return JSON.parse(await fs.readFile(file, 'utf-8'));
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

  /* ── Organization logo ──────────────────────────────────────────────────
     src/data/site.js declares IMAGES.logo at /atishay-kasliwal-logo.png and
     organizationSchema() feeds it to Organization.logo, which every prerendered
     page emits. The file was never generated, so that JSON-LD pointed at a 404
     on every page — Google drops an Organization logo it cannot fetch.

     Same monogram source as the icons, so the schema logo and the browser tab
     are the same mark. */
  await sharp(LOGO_SOURCE)
    .resize(512, 512, { fit: 'contain', background: BG })
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toFile(path.join(PUBLIC, 'atishay-kasliwal-logo.png'));
  written.push('org logo 512×512');

  /* ── Project cover cards ────────────────────────────────────────────────
     Every entry in src/data/projects.js declares an image at
     /projects/<slug>-cover.jpg. None of those files existed, so each case study
     rendered a broken hero AND served a dead og:image — meaning every project
     link shared anywhere produced an empty preview card.

     These are generated from project metadata rather than cropped from the
     repo's image assets, and that is deliberate. The assets here are not
     reliable: the file named fOMC.png was a scanned immigration document,
     dashboard.png is Geckoboard's own marketing screenshot, and mriimage.jpeg
     is stock photography of a radiology monitor. A generated card states only
     what projects.js already claims, so it cannot misrepresent the work. Drop a
     real screenshot at the same path to override any of these. */
  await ensureDir(path.join(PUBLIC, 'projects'));

  let real = 0;

  for (const [index, project] of PROJECTS.entries()) {
    const out = path.basename(project.image.src);
    const { width, height } = project.image; // 1600×900, per projects.js

    /* Greedy wrap at a character budget rather than measured text: the
       renderer falls back to a system sans whose metrics we cannot query, so a
       conservative budget is more predictable than a precise-looking guess. */
    const wrap = (text, perLine) => {
      const lines = [];
      let line = '';
      for (const word of text.split(/\s+/)) {
        if (line && (line + ' ' + word).length > perLine) {
          lines.push(line);
          line = word;
        } else line = line ? `${line} ${word}` : word;
      }
      if (line) lines.push(line);
      return lines;
    };

    const titleSize = project.name.length > 22 ? 76 : 96;
    const tagline = wrap(project.tagline, 52).slice(0, 3);
    const stack = project.stack.slice(0, 6).join('  ·  ');

    /* Metrics laid out on a measured cursor rather than a fixed column pitch.
       An even 340px pitch collided on the MRI card, where "20min → 5min" ran
       straight into the next value — metric values vary from "90%" to
       "20min → 5min", so the column has to be as wide as its content.

       Widths are estimated, not measured: the renderer falls back to a system
       sans whose metrics we cannot query. The mono label is reliable at 0.6em;
       the bold sans value is approximated slightly wide so the error lands on
       the side of extra gutter. Anything that would cross the right margin is
       dropped rather than clipped. */
    const metricColumns = [];
    let cursor = 104;
    for (const m of project.metrics || []) {
      const valueW = String(m.value).length * 29;
      const labelW = m.label.length * 12.6;
      const colW = Math.max(valueW, labelW);
      if (cursor + colW > width - 104) break;
      metricColumns.push({ m, x: cursor });
      cursor += colW + 64;
    }
    /* Category and status overlap on some entries — "Applied Research" carries
       status "Research" — which renders as a stutter. Drop whichever term the
       other already contains. */
    const eyebrow = [project.category, project.status, project.year]
      .filter(Boolean)
      .filter((part, i, all) =>
        all.every((other, j) => {
          if (i === j || typeof other !== 'string') return true;
          const a = String(part).toLowerCase();
          const b = other.toLowerCase();
          return !(b.includes(a) && b.length > a.length);
        })
      )
      .join('  /  ');

    const cover = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${BG}"/>
  <rect x="0" y="0" width="${width}" height="6" fill="${ACCENT}"/>

  <g stroke="#ffffff" stroke-opacity="0.035" stroke-width="1">
    ${Array.from({ length: 13 }, (_, i) => `<line x1="${i * 128}" y1="0" x2="${i * 128}" y2="${height}"/>`).join('\n    ')}
    ${Array.from({ length: 8 }, (_, i) => `<line x1="0" y1="${i * 128}" x2="${width}" y2="${i * 128}"/>`).join('\n    ')}
  </g>

  <text x="104" y="184" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="26" fill="${ACCENT}" letter-spacing="3.4">${esc(eyebrow.toUpperCase())}</text>

  <text x="104" y="${titleSize > 80 ? 316 : 300}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="${titleSize}" font-weight="700" fill="${FG}" letter-spacing="-3">${esc(project.name)}</text>

  ${tagline
    .map(
      (line, i) =>
        `<text x="104" y="${404 + i * 52}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="38" font-weight="400" fill="${MUTED}">${esc(line)}</text>`
    )
    .join('\n  ')}

  ${metricColumns
    .map(
      ({ m, x }) =>
        `<text x="${x}" y="596" font-family="Inter, Helvetica, Arial, sans-serif" font-size="52" font-weight="700" fill="${FG}" letter-spacing="-1.4">${esc(m.value)}</text>
  <text x="${x}" y="636" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="20" fill="${MUTED}" letter-spacing="1">${esc(m.label.toUpperCase())}</text>`
    )
    .join('\n  ')}

  <line x1="104" y1="700" x2="${width - 104}" y2="700" stroke="#ffffff" stroke-opacity="0.1" stroke-width="1"/>
  <text x="104" y="758" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="24" fill="${MUTED}" letter-spacing="1.2">${esc(stack)}</text>
  <text x="104" y="812" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="22" fill="#5b626d" letter-spacing="1.6">${esc(DOMAIN)}/projects/${esc(project.slug)}</text>
</svg>`;

    await sharp(Buffer.from(cover))
      .jpeg({ quality: 88, mozjpeg: true })
      .toFile(path.join(PUBLIC, 'projects', out));

    /* ── Browse tile ──────────────────────────────────────────────────────
       A second, near-textless plate at /projects/<slug>-tile.jpg.

       The cover above cannot double as a browse-row poster. It IS a title
       card — name, tagline, metrics, stack — and the browse card and the info
       overlay render every one of those in the DOM directly beneath it, so
       reusing the cover prints the project name twice and the tagline twice,
       once as unselectable pixels. The DOM copy is the one that has to stay:
       it is what search, screen readers, and translation see.

       So the poster's job here is texture, not information. Deliberately no
       words: any label put on the plate collides with something drawn over it —
       the status pill sits top-left of a card, the close button top-right of the
       overlay, and the caption covers the bottom third — and a label surviving
       all three would still repeat the text over it.

       Each project gets a DIFFERENT motif, keyed off its index. The first
       version drew one near-black plate for all five, and a row of them read as
       five images that had failed to load: the tile is the largest element on a
       browse card, so an empty tile makes the whole page look empty no matter
       how the layout is tuned. Distinct geometry per project also means a
       returning visitor can find a project by its shape before reading a word,
       which is the job a poster does on a shelf.

       Still strictly within the palette — one accent, neutrals, no second hue.
       tokens.css is explicit that emphasis is carried by a single colour, and
       five differently-tinted tiles would break that for a placeholder.

       The plate is the FALLBACK, not the rule: a slug listed in TILE_SOURCES
       gets a real image instead, and a project with a screen recording uses
       that recording's poster frame ahead of both (see `video.poster` in
       projects.js). */
    const source = TILE_SOURCES[project.slug];
    let tile;

    if (source?.mode === 'slice') {
      tile = await composeSlice(width, height, 0.5);
    } else if (source) {
      tile = await sourceTile(source, width, height);
    } else {
      tile = await sharp(Buffer.from(plateSvg(index, width, height)))
        .jpeg({ quality: 82, mozjpeg: true })
        .toBuffer();
    }

    await fs.writeFile(path.join(PUBLIC, 'projects', `${project.slug}-tile.jpg`), tile);
    if (source) real += 1;
  }
  written.push(
    `${PROJECTS.length} project covers + tiles 1600×900 (${real} from real imagery)`
  );

  /* ── MRI hero shot ──────────────────────────────────────────────────────
     The same slice as the tile above, recomposed for a different frame.

     A second file rather than reusing <slug>-tile.jpg because the two crop
     nothing alike: the hero dissolves its left 42% into the text column, so the
     brain sits right of centre here and dead centre there. One image cannot
     satisfy both without being wrong in one of them. */
  try {
    const w = 1120;
    const h = 622;

    await fs.writeFile(
      path.join(PUBLIC, 'projects', 'mri-tumor-viewer-shot.jpg'),
      await composeSlice(w, h, 0.66)
    );

    written.push(`MRI hero shot ${w}×${h}`);
  } catch (err) {
    console.log(`! MRI slice missing or unreadable — hero shot skipped (${err.message})`);
  }

  /* ── Repo tiles ─────────────────────────────────────────────────────────
     One plate per public GitHub repo, for the browse rows built from the
     snapshot in src/data/generated/github.json.

     Same generator as the project tiles, offset in the motif cycle so a repo
     tile never sits next to a project tile wearing identical geometry. There is
     no real imagery for any of these and there will not be: a repo has a
     description and a language, not a screenshot, and inventing one would
     misrepresent it. The plate is honest about being a placeholder.

     Read defensively — the slug rule here must match the one in
     src/data/githubProjects.js, since that is what the <img src> points at. */
  try {
    const gh = await readJsonFile(path.join(ROOT, 'src', 'data', 'generated', 'github.json'));

    const repos = gh.repos || [];
    if (repos.length) {
      await ensureDir(path.join(PUBLIC, 'repos'));

      for (const [i, repo] of repos.entries()) {
        const slug = `gh-${repo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
        await sharp(Buffer.from(plateSvg(i + 1, 1600, 900)))
          .jpeg({ quality: 82, mozjpeg: true })
          .toFile(path.join(PUBLIC, 'repos', `${slug}-tile.jpg`));
      }

      written.push(`${repos.length} repo tiles 1600×900`);
    }
  } catch (err) {
    console.log(`! no github.json yet — repo tiles skipped this pass (${err.message})`);
  }

  /* ── Taste-index artwork ────────────────────────────────────────────────
     Sleeve and poster art for the /about rows, each normalised to one shape.

     Sources arrive at wildly different sizes — anywhere from a 300px PNG to a
     640px JPEG, and one album source is a storefront product photo rather than
     a sleeve — so each is normalised here instead of being trusted to already
     be the right shape. `fit: 'cover'` with a centre crop leaves correctly
     shaped art untouched (a square sleeve into a square, a one-sheet into 2:3)
     and crops the edges off anything else, which is the right failure: the
     alternative is letterboxing that makes a row look broken.

     Both output sizes are 2x what the card renders at.

     Filenames say what each image IS, not which list entry it was meant for —
     three of the five album sources did not match the entry they arrived for,
     and naming them after the intended slot would have buried that. */
  for (const art of ARTWORK) {
    const dir = path.join(ROOT, 'src', 'assets', art.dir);
    try {
      const files = (await fs.readdir(dir)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
      if (!files.length) continue;

      await ensureDir(path.join(PUBLIC, art.dir));

      for (const file of files) {
        const slug = file.replace(/\.[^.]+$/, '');
        await sharp(path.join(dir, file))
          .resize(art.width, art.height, { fit: 'cover', position: 'centre' })
          .jpeg({ quality: 86, mozjpeg: true })
          .toFile(path.join(PUBLIC, art.dir, `${slug}.jpg`));
      }

      written.push(`${files.length} ${art.label} ${art.width}×${art.height}`);
    } catch {
      console.log(`! no src/assets/${art.dir} yet — ${art.label} skipped this pass`);
    }
  }

  /* ── Blog tiles ─────────────────────────────────────────────────────────
     The writing row on /projects shows posters the same way the project rows
     do, and posts carry no image of their own (`image` is null in every
     frontmatter today). Rather than repeat one placeholder down the row, each
     post gets its own plate from the same family as the project tiles, offset
     in the motif cycle so a blog tile never sits next to a project tile
     wearing identical geometry.

     Read defensively: `npm run images` runs BEFORE `npm run content` in the
     build script, so on a clean checkout posts.json may not exist yet. Missing
     is not an error — the row falls back to no image, and the next build (with
     the file present) fills them in. A post that sets `image:` in its
     frontmatter overrides all of this. */
  try {
    const posts = await readJsonFile(path.join(ROOT, 'src', 'content', 'generated', 'posts.json'));

    await ensureDir(path.join(PUBLIC, 'blog'));

    const ordered = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));
    for (const [i, post] of ordered.entries()) {
      await sharp(Buffer.from(plateSvg(i + 2, 1600, 900)))
        .jpeg({ quality: 82, mozjpeg: true })
        .toFile(path.join(PUBLIC, 'blog', `${post.slug}-tile.jpg`));
    }
    written.push(`${ordered.length} blog tiles 1600×900`);
  } catch {
    console.log('! no posts.json yet — blog tiles skipped this pass');
  }

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
