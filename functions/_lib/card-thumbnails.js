// Card thumbnails: Admin's list, replace and reset (functions/api/admin/thumbnails/), and the
// homepage's swap (functions/index.js). See docs/card-thumbnails.md.
import catalog from "../_generated/card-catalog.js";
import { FULL, SMALL, thumbnailImg, validThumbnail } from "../../src/card-thumbnails.js";
import { readDimensions, sniffImageType } from "../../src/photography-core/upload.js";

export const MAX_FULL_BYTES = 2 * 1024 * 1024;
export const MAX_SMALL_BYTES = 1024 * 1024;
export const MAX_REQUEST_BYTES = MAX_FULL_BYTES + MAX_SMALL_BYTES + 64 * 1024;

export class ThumbnailError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const cards = new Map(catalog.map(card => [card.id, card]));
export const findCard = id => cards.get(id) ?? null;

export async function listCards(env) {
  const { results } = await env.DB.prepare("SELECT card_id, src, small_src, updated_at, updated_by FROM card_thumbnails").all();
  const chosen = new Map(results.map(row => [row.card_id, row]));
  return catalog.map(card => {
    const row = chosen.get(card.id);
    return { ...card, thumbnail: row ? { src: row.src, small: row.small_src, updatedAt: row.updated_at, updatedBy: row.updated_by } : null };
  });
}

// The browser's MIME type and file name are never trusted: the bytes must be a WebP of exactly the
// card's size. Admin crops and encodes both copies before uploading.
function checkImage(bytes, expected, max, label) {
  if (!bytes?.length) throw new ThumbnailError(`${label} is missing.`);
  if (bytes.length > max) throw new ThumbnailError(`${label} is larger than ${max / 1024 / 1024} MB.`, 413);
  if (sniffImageType(bytes) !== "webp") throw new ThumbnailError(`${label} must be a WebP image.`);
  const size = readDimensions(bytes, "webp");
  if (!size || size.width !== expected.width || size.height !== expected.height) {
    throw new ThumbnailError(`${label} must be ${expected.width}×${expected.height} pixels${size ? `, not ${size.width}×${size.height}` : ""}.`);
  }
}

async function shaOf(bytes) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return [...digest.slice(0, 12)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

// Stores both copies under a content address (an identical upload reuses the same files) and points
// the card at them. Earlier files stay in the bucket; the audit log names them.
export async function saveThumbnail(env, id, { full, small }, actor) {
  if (!findCard(id)) throw new ThumbnailError("There's no card with that id.", 404);
  checkImage(full, FULL, MAX_FULL_BYTES, "The 1080px image");
  checkImage(small, SMALL, MAX_SMALL_BYTES, "The 640px copy");
  const sha = await shaOf(full);
  const base = String(env.PHOTO_PUBLIC_BASE ?? "").replace(/\/+$/, "");
  const thumbnail = { src: `${base}/cards/${sha}-1080.webp`, small: `${base}/cards/${sha}-640.webp` };
  if (!validThumbnail(thumbnail)) throw new ThumbnailError("PHOTO_PUBLIC_BASE isn't https://photos.atishaykasliwal.com.", 500);

  const stored = { httpMetadata: { contentType: "image/webp", cacheControl: "public, max-age=31536000, immutable" } };
  await env.PHOTOS.put(`cards/${sha}-1080.webp`, full, stored);
  await env.PHOTOS.put(`cards/${sha}-640.webp`, small, stored);

  const previous = await env.DB.prepare("SELECT sha FROM card_thumbnails WHERE card_id = ?").bind(id).first();
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO card_thumbnails (card_id, sha, src, small_src, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (card_id) DO UPDATE SET sha = excluded.sha, src = excluded.src, small_src = excluded.small_src,
         updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
    ).bind(id, sha, thumbnail.src, thumbnail.small, now, actor),
    env.DB.prepare("INSERT INTO card_thumbnail_audit (card_id, action, sha, previous_sha, actor, at) VALUES (?, 'replace', ?, ?, ?, ?)")
      .bind(id, sha, previous?.sha ?? null, actor, now),
  ]);
  forgetChosen();
  return { id, thumbnail: { ...thumbnail, updatedAt: now, updatedBy: actor } };
}

// Back to the built-in image.
export async function resetThumbnail(env, id, actor) {
  if (!findCard(id)) throw new ThumbnailError("There's no card with that id.", 404);
  const previous = await env.DB.prepare("SELECT sha FROM card_thumbnails WHERE card_id = ?").bind(id).first();
  if (previous) {
    await env.DB.batch([
      env.DB.prepare("DELETE FROM card_thumbnails WHERE card_id = ?").bind(id),
      env.DB.prepare("INSERT INTO card_thumbnail_audit (card_id, action, sha, previous_sha, actor, at) VALUES (?, 'reset', NULL, ?, ?, ?)")
        .bind(id, previous.sha, actor, new Date().toISOString()),
    ]);
  }
  forgetChosen();
  return { id, thumbnail: null };
}

// ---------- The homepage ----------

// The current choices, for cards that still exist and URLs on the photos domain only. Kept in this
// isolate for 30 seconds, so most homepage requests skip D1; a change shows within that time.
const CACHE_MS = 30_000;
let cached = null;
export const forgetChosen = () => {
  cached = null;
};
export async function loadChosen(env, now = Date.now()) {
  if (cached && now - cached.at < CACHE_MS) return cached.value;
  const { results } = await env.DB.prepare("SELECT card_id, src, small_src FROM card_thumbnails").all();
  const value = {};
  for (const row of results) {
    const thumbnail = { src: row.src, small: row.small_src };
    if (cards.has(row.card_id) && validThumbnail(thumbnail)) value[row.card_id] = thumbnail;
  }
  cached = { at: now, value };
  return value;
}

// Swaps the chosen images into the prerendered cards (all three copies of each, for the loop) and
// inlines the choices for src/card-thumbnails.js. An image card keeps its own <img>, so its
// loading and fetchpriority stay; a card drawn in HTML gets a lazy <img> instead.
export function rewriteHomepage(response, chosen, Rewriter = globalThis.HTMLRewriter) {
  const json = JSON.stringify(chosen).replace(/</g, "\\u003c");
  const rewriter = new Rewriter().on("head", {
    element(head) {
      head.append(`<script type="application/json" id="card-thumbnails">${json}</script>`, { html: true });
    },
  });
  for (const [id, thumbnail] of Object.entries(chosen)) {
    if (findCard(id).builtIn) {
      rewriter.on(`[data-card="${id}"] .project-art > img`, {
        element(img) {
          img.setAttribute("src", thumbnail.src);
          img.setAttribute("srcset", `${thumbnail.small} 640w, ${thumbnail.src} 1080w`);
        },
      });
    } else {
      rewriter.on(`[data-card="${id}"] .project-art`, {
        element(art) {
          art.setInnerContent(thumbnailImg(thumbnail).replace("<img ", '<img loading="lazy" '), { html: true });
        },
      });
    }
  }
  return rewriter.transform(response);
}
