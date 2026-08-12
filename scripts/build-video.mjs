/**
 * Transcodes raw screen recordings into the browse page's video assets.
 *
 *   media/raw/<slug>.(mov|mp4|webm|mkv)   →   public/video/<slug>-*.{mp4,webm,jpg}
 *
 * ── Why this is NOT part of `npm run build` ─────────────────────────────────
 *
 * Two reasons, either sufficient. ffmpeg is not installed in the Cloudflare
 * Pages build image, so wiring this into the build would break deploys on a
 * machine that cannot run it. And transcoding is expensive and the inputs
 * almost never change — re-encoding ten videos on every deploy would add
 * minutes to each build to produce bytes identical to last time.
 *
 * So: run `npm run video` locally when a recording changes, and commit the
 * output. The generated files in public/video/ are build inputs, like the
 * project covers from build-images.mjs.
 *
 * ── Encoding decisions ──────────────────────────────────────────────────────
 *
 * Two sizes, because the two uses have nothing in common. A card preview is
 * ~320px wide on screen and plays for a few seconds under a cursor; a hero
 * trailer is full-bleed. Serving the hero file to a card wastes roughly 5x the
 * bytes for pixels no one can see.
 *
 * Both are silent (`-an`). Every playback on the page is muted — autoplay
 * policy guarantees it — so an audio track is bytes that can never be heard.
 * It is typically 10-15% of the file.
 *
 * `-movflags +faststart` moves the moov atom to the front of the mp4. Without
 * it the browser must download the whole file before it can render frame one,
 * which converts a progressive load into a stall.
 *
 * VP9 is offered first and H.264 second (see mediaSources() in
 * components/browse/videoSupport.js). VP9 is meaningfully smaller at equal
 * quality; H.264 is the fallback for Safari versions that will not take it.
 */

import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RAW = path.join(ROOT, 'media', 'raw');
const OUT = path.join(ROOT, 'public', 'video');

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

const SOURCE_EXT = /\.(mov|mp4|m4v|webm|mkv)$/i;

/**
 * `seconds` caps the clip. A preview is glanced at, not watched — past about
 * eight seconds it is costing bytes for frames nobody reaches, because the
 * cursor has moved on. The trailer gets longer to show an actual flow.
 */
const VARIANTS = [
  { name: 'card', width: 640, seconds: 8, crf: { h264: 30, vp9: 36 } },
  { name: 'trailer', width: 1280, seconds: 20, crf: { h264: 26, vp9: 34 } },
];

/** Scale to an even width (both encoders reject odd dimensions) preserving AR. */
const scale = (width) => `scale=${width}:-2:flags=lanczos`;

async function ffmpeg(args) {
  /* maxBuffer raised because ffmpeg is chatty on stderr and a long encode can
     otherwise blow the default 1 MB and reject with ENOBUFS after doing all
     the work. */
  await run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], {
    maxBuffer: 32 * 1024 * 1024,
  });
}

const kb = async (file) => Math.round((await fs.stat(file)).size / 1024);

async function main() {
  try {
    await run('ffmpeg', ['-version']);
  } catch {
    console.error(
      `${YELLOW}!${RESET} ffmpeg not found. Install it (\`brew install ffmpeg\`) and re-run.`
    );
    process.exitCode = 1;
    return;
  }

  let sources;
  try {
    sources = (await fs.readdir(RAW)).filter((f) => SOURCE_EXT.test(f));
  } catch {
    console.log(
      `${YELLOW}!${RESET} no ${DIM}media/raw/${RESET} directory — nothing to transcode.\n` +
        `  Drop recordings there named after the project slug, e.g. media/raw/atriveo.mov,\n` +
        `  then set that project's \`video\` field in src/data/projects.js.`
    );
    return;
  }

  if (!sources.length) {
    console.log(`${YELLOW}!${RESET} media/raw/ is empty — nothing to transcode.`);
    return;
  }

  await fs.mkdir(OUT, { recursive: true });

  for (const file of sources) {
    const slug = path.basename(file, path.extname(file));
    const input = path.join(RAW, file);
    const sizes = [];

    /* Poster frame at 1s rather than 0s: the first frame of a screen recording
       is very often a half-painted window or a cursor mid-move, and the poster
       is what a visitor stares at until they hover. */
    const poster = path.join(OUT, `${slug}-poster.jpg`);
    await ffmpeg([
      '-ss', '1',
      '-i', input,
      '-frames:v', '1',
      '-vf', scale(1600),
      '-q:v', '4',
      poster,
    ]);
    sizes.push(`poster ${await kb(poster)}kb`);

    for (const variant of VARIANTS) {
      const mp4 = path.join(OUT, `${slug}-${variant.name}.mp4`);
      await ffmpeg([
        '-i', input,
        '-t', String(variant.seconds),
        '-an',
        '-vf', scale(variant.width),
        '-c:v', 'libx264',
        '-profile:v', 'high',
        '-crf', String(variant.crf.h264),
        '-preset', 'slow',
        /* Caps how far apart keyframes can be. A loop that restarts on a
           non-keyframe shows a smeared frame before it resolves. */
        '-g', '60',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        mp4,
      ]);

      const webm = path.join(OUT, `${slug}-${variant.name}.webm`);
      await ffmpeg([
        '-i', input,
        '-t', String(variant.seconds),
        '-an',
        '-vf', scale(variant.width),
        '-c:v', 'libvpx-vp9',
        '-crf', String(variant.crf.vp9),
        '-b:v', '0',
        '-row-mt', '1',
        '-deadline', 'good',
        '-cpu-used', '2',
        webm,
      ]);

      sizes.push(`${variant.name} ${await kb(webm)}/${await kb(mp4)}kb`);
    }

    console.log(`${GREEN}✓${RESET} ${slug} ${DIM}${sizes.join(' · ')}${RESET}`);
  }

  console.log(
    `\n${GREEN}✓${RESET} ${sources.length} recording(s) → public/video/\n` +
      `${DIM}  Point each project at them in src/data/projects.js:\n` +
      `    video: { poster: '/video/<slug>-poster.jpg',\n` +
      `             preview: '/video/<slug>-card',\n` +
      `             trailer: '/video/<slug>-trailer' }\n` +
      `  (preview/trailer are extensionless — .webm and .mp4 are both offered.)${RESET}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
