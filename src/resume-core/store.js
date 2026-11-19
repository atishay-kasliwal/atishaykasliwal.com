// D1 access for résumé versions, the active pointer and the audit log (migrations/0005).
import { versionIdOf } from "./constants.js";

export class ResumeRequestError extends Error {
  constructor(message, status = 400, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

const parse = (text, fallback) => {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
};

export function rowToVersion(row, activeId = null) {
  if (!row) return null;
  return {
    id: row.id,
    sha256: row.sha256,
    filename: row.filename,
    sizeBytes: row.size_bytes,
    pages: row.page_count,
    textChars: row.text_chars,
    title: row.pdf_title,
    producer: row.pdf_producer,
    uploadedAt: row.uploaded_at,
    uploadedBy: row.uploaded_by,
    firstPublishedAt: row.first_published_at,
    lastPublishedAt: row.last_published_at,
    active: row.id === activeId,
    report: parse(row.report_json, null),
  };
}

const summaryOnly = version => version && { ...version, report: version.report ? { summary: version.report.consistency?.summary ?? null, warnings: version.report.validation?.warnings ?? [] } : null };

// The public route calls this on every request, so it is one indexed read.
export async function activeResume(db) {
  return db
    .prepare(
      `SELECT v.id, v.sha256, v.r2_key, v.size_bytes, v.page_count, a.published_at, a.published_by
         FROM resume_active a JOIN resume_versions v ON v.id = a.version_id
        WHERE a.slot = 'public'`,
    )
    .first();
}

export async function getVersion(db, id) {
  if (!/^[0-9a-f]{16}$/.test(String(id))) throw new ResumeRequestError("unknown version", 404);
  const row = await db.prepare("SELECT * FROM resume_versions WHERE id = ?").bind(id).first();
  if (!row) throw new ResumeRequestError("unknown version", 404);
  const active = await activeResume(db);
  return { row, version: rowToVersion(row, active?.id ?? null) };
}

export async function listState(db, { auditLimit = 200 } = {}) {
  const active = await activeResume(db);
  const { results: rows } = await db.prepare("SELECT * FROM resume_versions ORDER BY uploaded_at DESC, id").all();
  const { results: audit } = await db.prepare("SELECT * FROM resume_audit ORDER BY at DESC, id DESC LIMIT ?").bind(auditLimit).all();
  const versions = rows.map(row => summaryOnly(rowToVersion(row, active?.id ?? null)));
  return {
    active: active
      ? { ...versions.find(version => version.id === active.id), publishedAt: active.published_at, publishedBy: active.published_by }
      : null,
    versions,
    audit: audit.map(row => ({ id: row.id, at: row.at, actor: row.actor, action: row.action, versionId: row.version_id, sha256: row.sha256, detail: parse(row.detail_json, {}) })),
  };
}

const auditStatement = (db, { at, actor, action, versionId = null, sha256 = null, detail = {} }) =>
  db
    .prepare("INSERT INTO resume_audit (at, actor, action, version_id, sha256, detail_json) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(at, actor, action, versionId, sha256, JSON.stringify(detail));

export async function recordAudit(db, entry) {
  await auditStatement(db, entry).run();
}

export async function findBySha(db, sha256) {
  return db.prepare("SELECT * FROM resume_versions WHERE sha256 = ?").bind(sha256).first();
}

export async function insertVersion(db, { sha256, r2Key, filename, sizeBytes, pages, textChars, title, producer, report, at, actor }) {
  const id = versionIdOf(sha256);
  await db.batch([
    db
      .prepare(
        `INSERT INTO resume_versions (id, sha256, r2_key, filename, size_bytes, page_count, text_chars, pdf_title, pdf_producer, report_json, uploaded_at, uploaded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(id, sha256, r2Key, filename, sizeBytes, pages, textChars, title, producer, JSON.stringify(report), at, actor),
    auditStatement(db, { at, actor, action: "upload", versionId: id, sha256, detail: { filename, sizeBytes, pages, consistency: report.consistency?.summary ?? null } }),
  ]);
  return id;
}

export async function updateReport(db, id, report, { at, actor }) {
  const row = await db.prepare("SELECT sha256 FROM resume_versions WHERE id = ?").bind(id).first();
  await db.batch([
    db.prepare("UPDATE resume_versions SET report_json = ? WHERE id = ?").bind(JSON.stringify(report), id),
    auditStatement(db, { at, actor, action: "recheck", versionId: id, sha256: row?.sha256 ?? null, detail: { consistency: report.consistency?.summary ?? null } }),
  ]);
}

// Points the public URL at a version. The pointer, the version's timestamps and the audit row
// change in one D1 transaction, so history can never disagree with what is served.
export async function publishVersion(db, id, { at, actor, reason = null }) {
  const row = await db.prepare("SELECT * FROM resume_versions WHERE id = ?").bind(id).first();
  if (!row) throw new ResumeRequestError("unknown version", 404);
  const previous = await activeResume(db);
  if (previous?.id === id) throw new ResumeRequestError("this version is already published", 409);
  const action = row.first_published_at ? "restore" : "publish";
  await db.batch([
    db
      .prepare(
        `INSERT INTO resume_active (slot, version_id, published_at, published_by) VALUES ('public', ?, ?, ?)
         ON CONFLICT (slot) DO UPDATE SET version_id = excluded.version_id, published_at = excluded.published_at, published_by = excluded.published_by`,
      )
      .bind(id, at, actor),
    db.prepare("UPDATE resume_versions SET first_published_at = COALESCE(first_published_at, ?), last_published_at = ? WHERE id = ?").bind(at, at, id),
    auditStatement(db, {
      at,
      actor,
      action,
      versionId: id,
      sha256: row.sha256,
      detail: { previousVersionId: previous?.id ?? null, previousSha256: previous?.sha256 ?? null, reason },
    }),
  ]);
  return { action, previous: previous?.id ?? null };
}
