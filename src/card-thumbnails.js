// Card thumbnails chosen in Admin (admin.atishaykasliwal.com → /api/admin/thumbnails). Every card in
// the work and open source carousels has an id, `<section>:<slug>`; a thumbnail replaces that
// card's built-in image (or its HTML composition) with a 1080×664 WebP and its 640px copy, stored
// in the public photos bucket. See docs/card-thumbnails.md.
//
// The homepage Function (functions/index.js) swaps the image in the prerendered cards and inlines
// the current choices as JSON in #card-thumbnails, which this module reads so the preview window
// and any re-rendered track agree. Without that JSON (the build, tests, a Function failure) every
// card keeps its built-in image.

export const SECTIONS = { project: "Projects", "open-source": "Open source", volunteer: "Volunteer and events" };

export const slugify = name =>
  String(name)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const cardId = (section, slug) => `${section}:${slug}`;
export const CARD_ID = /^(project|open-source|volunteer):[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Only these URLs are ever written into the page: content-addressed copies under cards/ on the
// photos domain. The Function checks the same before inlining anything.
export const THUMBNAIL_URL = /^https:\/\/photos\.atishaykasliwal\.com\/cards\/[a-f0-9]{24}-(?:1080|640)\.webp$/;
export const FULL = { width: 1080, height: 664 };
export const SMALL = { width: 640, height: 394 };

export const validThumbnail = value =>
  Boolean(value) && typeof value === "object" && THUMBNAIL_URL.test(value.src) && THUMBNAIL_URL.test(value.small);

export const thumbnailImg = ({ src, small }) =>
  `<img src="${src}" srcset="${small} 640w, ${src} 1080w" sizes="305px" width="${FULL.width}" height="${FULL.height}" alt="" decoding="async" />`;

function readInlined() {
  try {
    const element = globalThis.document?.getElementById("card-thumbnails");
    const parsed = element ? JSON.parse(element.textContent) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
let inlined;

// Gives every entry its id, and its chosen thumbnail when there is one. `art` also replaces the
// preview window's image, for cards whose preview is the same picture (open source, volunteer).
export function withThumbnails(section, entries, { art = false } = {}) {
  inlined ??= readInlined();
  return entries.map(entry => {
    const id = cardId(section, entry.slug ?? slugify(entry.name));
    const chosen = inlined[id];
    if (!validThumbnail(chosen)) return { ...entry, id };
    const img = thumbnailImg(chosen);
    return { ...entry, id, card: img, ...(art ? { art: img } : {}) };
  });
}

// What Admin lists: every card, its section and name, and its built-in image (null for a card
// drawn in HTML, such as Kaggriculture).
export function catalogOf(section, entries) {
  return entries.map(entry => {
    const builtIn = /^\s*<img\b[^>]*\bsrc="([^"]+)"/.exec(entry.card ?? "");
    return { id: entry.id, section, name: entry.name, builtIn: builtIn ? builtIn[1] : null };
  });
}
