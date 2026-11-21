-- Card thumbnails chosen in Admin (docs/card-thumbnails.md). One row per card that has one; a
-- card without a row shows its built-in image. Files live in the public photos bucket under
-- cards/<sha>-1080.webp and cards/<sha>-640.webp and are never overwritten.
CREATE TABLE card_thumbnails (
  card_id TEXT PRIMARY KEY,
  sha TEXT NOT NULL,
  src TEXT NOT NULL,
  small_src TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL
);

-- Every replace and reset, with what it replaced, so an earlier thumbnail can be found again.
CREATE TABLE card_thumbnail_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('replace', 'reset')),
  sha TEXT,
  previous_sha TEXT,
  actor TEXT NOT NULL,
  at TEXT NOT NULL
);
CREATE INDEX card_thumbnail_audit_card ON card_thumbnail_audit (card_id, at);
