/**
 * Shared video helpers for the browse page.
 *
 * Two concerns, both of which every video surface here needs and neither of
 * which belongs in a component: what <source> elements to emit, and whether to
 * play anything at all.
 */

const EXT_TYPES = {
  webm: 'video/webm',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
};

/**
 * Turn a `video.preview` / `video.trailer` value into <source> descriptors.
 *
 * Accepts two forms so one field can serve both the interim placeholder and
 * the eventual build output:
 *
 *   '/video/atriveo-card'      → webm + mp4, in that order
 *   '/featured-project.mp4'    → exactly that file
 *
 * The extensionless form is what scripts/build-video.mjs will emit, and webm
 * comes first because the browser picks the first type it can play — putting
 * mp4 first means Chrome and Firefox never see the smaller VP9 file.
 */
export function mediaSources(value) {
  if (!value) return [];

  const ext = value.split('.').pop()?.toLowerCase();
  if (EXT_TYPES[ext]) return [{ src: value, type: EXT_TYPES[ext] }];

  return [
    { src: `${value}.webm`, type: 'video/webm' },
    { src: `${value}.mp4`, type: 'video/mp4' },
  ];
}

/**
 * Whether autoplaying decorative video is appropriate right now.
 *
 * Three independent reasons to decline, checked in cost order:
 *
 *   1. Reduced motion. An honoured preference, not a hint — a looping preview
 *      is exactly the kind of unrequested motion the setting exists for.
 *   2. Data Saver. The user has said, at OS or browser level, not to spend
 *      bytes on things they did not ask for.
 *   3. A slow connection. A preview that buffers for six seconds is worse than
 *      the poster it replaced.
 *
 * Read at interaction time rather than cached at module load, because all three
 * can change during a session — a laptop moving onto a tethered phone flips the
 * third without a reload.
 */
export function canPlayPreview() {
  if (typeof window === 'undefined') return false;

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;

  const connection = navigator.connection;
  if (connection?.saveData) return false;
  if (connection?.effectiveType && /(^|-)2g$|^3g$/.test(connection.effectiveType)) {
    return false;
  }

  return true;
}

/** Hover previews are pointer-only; a tap should navigate, not preview. */
export function hasFinePointer() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(hover: hover) and (pointer: fine)').matches ?? false;
}
