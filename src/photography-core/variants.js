// Smaller WebP copies of an uploaded photo, so the gallery never sends a phone the 2400px display
// JPEG. The admin page makes them in the browser (no server image processing on the Free plan);
// the server only checks them. Widths are below the display width, at its aspect ratio.
import { readDimensions, sniffImageType } from "./upload.js";

export const VARIANT_WIDTHS = [640, 1280, 1920];
export const MAX_VARIANT_BYTES = 2 * 1024 * 1024;

export const variantWidthsFor = displayWidth => VARIANT_WIDTHS.filter(width => width < displayWidth);
export const variantHeightFor = (width, displayWidth, displayHeight) => Math.round((displayHeight * width) / displayWidth);

// files: Map of width -> bytes. Every expected width must be present, and nothing else.
export function validateVariants(files, { width: displayWidth, height: displayHeight }) {
  const errors = [];
  const expected = variantWidthsFor(displayWidth);
  if (!expected.length) errors.push("This photo is too small to need smaller copies.");
  for (const width of files.keys()) if (!expected.includes(width)) errors.push(`Unexpected ${width}px copy.`);
  for (const width of expected) {
    const bytes = files.get(width);
    if (!bytes) { errors.push(`The ${width}px copy is missing.`); continue; }
    if (bytes.length > MAX_VARIANT_BYTES) { errors.push(`The ${width}px copy is larger than 2 MB.`); continue; }
    if (sniffImageType(bytes) !== "webp") { errors.push(`The ${width}px copy is not WebP.`); continue; }
    const dimensions = readDimensions(bytes, "webp");
    const height = variantHeightFor(width, displayWidth, displayHeight);
    if (!dimensions || dimensions.width !== width || Math.abs(dimensions.height - height) > 2) {
      errors.push(`The ${width}px copy should be ${width}x${height}${dimensions ? `, not ${dimensions.width}x${dimensions.height}` : ""}.`);
    }
  }
  return { ok: errors.length === 0, errors };
}

// The stored list, defensively: only https URLs with a known width.
export function parseVariants(json) {
  let list;
  try {
    list = JSON.parse(json || "[]");
  } catch {
    return [];
  }
  if (!Array.isArray(list)) return [];
  return list
    .filter(item => item && VARIANT_WIDTHS.includes(item.width) && typeof item.src === "string" && /^https:\/\//.test(item.src))
    .map(item => ({ src: item.src, width: item.width }))
    .sort((a, b) => a.width - b.width);
}
