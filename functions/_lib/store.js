// D1 implementation of the store used by the ingest logic and the public/admin routes.
import { publicPhotos } from "../../src/photography-core/library.js";

export function rowToPhoto(row, tags = []) {
  return {
    id: row.id,
    origin: row.origin,
    status: row.status,
    hidden: row.hidden === 1,
    deletedAt: row.deleted_at,
    alt: row.alt,
    caption: row.caption,
    src: row.src,
    originalKey: row.original_key,
    width: row.width,
    height: row.height,
    orientation: row.orientation,
    colors: JSON.parse(row.colors_json || "[]"),
    tags,
    uploadedAt: row.uploaded_at,
  };
}

export async function loadLibrary(db) {
  const { results: rows } = await db.prepare("SELECT * FROM photos WHERE deleted_at IS NULL").all();
  const { results: tagRows } = await db.prepare("SELECT photo_id, tag FROM photo_tags").all();
  const tagsById = new Map();
  for (const { photo_id, tag } of tagRows) {
    if (!tagsById.has(photo_id)) tagsById.set(photo_id, []);
    tagsById.get(photo_id).push(tag);
  }
  return rows.map(row => rowToPhoto(row, tagsById.get(row.id) ?? []));
}

// Returns full records filtered to public ones. Views are built only at the response boundary,
// because selection and ranking re-check visibility and need the status and hidden fields.
export async function loadPublicLibrary(db) {
  return publicPhotos(await loadLibrary(db));
}

export function d1Store(db, now = () => new Date().toISOString()) {
  return {
    async getPhoto(id) {
      const row = await db.prepare("SELECT * FROM photos WHERE id = ?").bind(id).first();
      return row ? rowToPhoto(row) : null;
    },
    async replaceTags(id, tags, source) {
      const statements = [db.prepare("DELETE FROM photo_tags WHERE photo_id = ?").bind(id)];
      for (const tag of tags) {
        statements.push(db.prepare("INSERT INTO photo_tags (photo_id, tag, source) VALUES (?, ?, ?)").bind(id, tag, source));
      }
      await db.batch(statements);
    },
    async setCaption(id, caption) {
      await db.prepare("UPDATE photos SET caption = ?, updated_at = ? WHERE id = ?").bind(caption, now(), id).run();
    },
    async recordRun(id, runId) {
      await db
        .prepare("INSERT OR IGNORE INTO processing_runs (photo_id, run_id, processed_at) VALUES (?, ?, ?)")
        .bind(id, runId, now())
        .run();
    },
    async markReady(id) {
      await db.prepare("UPDATE photos SET status = 'ready', updated_at = ? WHERE id = ? AND deleted_at IS NULL").bind(now(), id).run();
    },
  };
}
