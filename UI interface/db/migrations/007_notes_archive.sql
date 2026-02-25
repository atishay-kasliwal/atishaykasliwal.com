-- Add archive-style flag to notes so they can be moved to an archive view.
ALTER TABLE daily_notes
  ADD COLUMN IF NOT EXISTS is_done BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_daily_notes_is_done ON daily_notes(is_done);

