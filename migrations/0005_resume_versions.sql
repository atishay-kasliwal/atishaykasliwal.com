-- Résumé versions managed from /admin/resume. The PDFs live in the private RESUMES R2 bucket; these
-- tables hold their metadata, which version the public URL serves, and an audit log of every
-- administrative action. See docs/resume-admin.md.

CREATE TABLE resume_versions (
  id TEXT PRIMARY KEY CHECK (length(id) = 16),     -- first 16 hex chars of sha256
  sha256 TEXT NOT NULL UNIQUE CHECK (length(sha256) = 64),
  r2_key TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  page_count INTEGER NOT NULL CHECK (page_count > 0),
  text_chars INTEGER NOT NULL,
  pdf_title TEXT,
  pdf_producer TEXT,
  -- Validation checks and the consistency report against the canonical profile, as JSON.
  report_json TEXT NOT NULL,
  uploaded_at TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  first_published_at TEXT,
  last_published_at TEXT
);

-- Exactly one row once anything has been published; absent means the bundled PDF is served.
CREATE TABLE resume_active (
  slot TEXT PRIMARY KEY CHECK (slot = 'public'),
  version_id TEXT NOT NULL REFERENCES resume_versions (id),
  published_at TEXT NOT NULL,
  published_by TEXT NOT NULL
);

CREATE TABLE resume_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('upload', 'upload_duplicate', 'upload_rejected', 'publish', 'restore', 'recheck')),
  version_id TEXT,
  sha256 TEXT,
  detail_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX resume_audit_at ON resume_audit (at DESC, id DESC);
CREATE INDEX resume_versions_uploaded_at ON resume_versions (uploaded_at DESC);
