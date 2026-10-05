CREATE TABLE photos (
  id TEXT PRIMARY KEY,
  origin TEXT NOT NULL CHECK (origin IN ('r2', 'external')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'ready', 'failed')),
  hidden INTEGER NOT NULL DEFAULT 0 CHECK (hidden IN (0, 1)),
  deleted_at TEXT,
  alt TEXT NOT NULL,
  caption TEXT,
  src TEXT NOT NULL,
  original_key TEXT,
  width INTEGER NOT NULL CHECK (width > 0),
  height INTEGER NOT NULL CHECK (height > 0),
  orientation TEXT NOT NULL CHECK (orientation IN ('landscape', 'portrait', 'square')),
  colors_json TEXT NOT NULL DEFAULT '[]',
  uploaded_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX photos_public ON photos (status, hidden, deleted_at);

CREATE TABLE photo_tags (
  photo_id TEXT NOT NULL REFERENCES photos (id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  source TEXT NOT NULL,
  PRIMARY KEY (photo_id, tag)
);

CREATE TABLE tag_vocabulary (
  tag TEXT PRIMARY KEY,
  synonyms_json TEXT NOT NULL DEFAULT '[]',
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL
);

CREATE TABLE processing_runs (
  photo_id TEXT NOT NULL REFERENCES photos (id) ON DELETE CASCADE,
  run_id TEXT NOT NULL,
  processed_at TEXT NOT NULL,
  PRIMARY KEY (photo_id, run_id)
);
