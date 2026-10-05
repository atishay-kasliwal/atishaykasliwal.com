// Applies one Colab batch. Idempotent: running the same batch twice leaves the same state.
// Tags for a photo are replaced as a set, never appended, and captions are overwritten.
// Processing records are keyed by (photo, run) so a repeated run is recorded once.
export const MAX_INGEST_ITEMS = 200;
export const MAX_TAGS_PER_PHOTO = 40;
export const MAX_CAPTION_LENGTH = 400;

export function validateIngestBatch(batch) {
  const errors = [];
  if (!batch || typeof batch.runId !== "string" || !/^[A-Za-z0-9_-]{6,80}$/.test(batch.runId)) {
    errors.push("runId must be 6-80 characters: letters, digits, dash or underscore.");
  }
  if (!Array.isArray(batch?.photos) || batch.photos.length === 0) errors.push("photos must be a non-empty array.");
  if (Array.isArray(batch?.photos) && batch.photos.length > MAX_INGEST_ITEMS) {
    errors.push(`A batch may contain at most ${MAX_INGEST_ITEMS} photos.`);
  }
  for (const item of batch?.photos ?? []) {
    if (typeof item?.id !== "string" || !item.id) errors.push("Every item needs an id.");
    if (!Array.isArray(item?.tags) || item.tags.length > MAX_TAGS_PER_PHOTO) errors.push(`Tags must be an array of at most ${MAX_TAGS_PER_PHOTO}.`);
    if (typeof item?.caption !== "string" || item.caption.length > MAX_CAPTION_LENGTH) errors.push("Caption must be a string of at most 400 characters.");
  }
  return { ok: errors.length === 0, errors };
}

export function normalizeTags(tags, vocabulary) {
  const allowed = new Set(vocabulary);
  return [...new Set(tags.map(tag => String(tag).trim().toLowerCase()))].filter(tag => allowed.has(tag)).sort();
}

export async function applyIngest(store, batch, vocabulary) {
  const applied = [];
  const skipped = [];
  for (const item of batch.photos) {
    const photo = await store.getPhoto(item.id);
    if (!photo || photo.deletedAt) {
      skipped.push({ id: item.id, reason: "unknown" });
      continue;
    }
    const tags = normalizeTags(item.tags, vocabulary);
    await store.replaceTags(item.id, tags, "colab");
    await store.setCaption(item.id, item.caption.trim());
    await store.recordRun(item.id, batch.runId);
    await store.markReady(item.id);
    applied.push({ id: item.id, tags: tags.length });
  }
  return { runId: batch.runId, applied, skipped };
}
