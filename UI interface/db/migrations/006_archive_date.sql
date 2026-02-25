-- Track when a job was archived (first time it became Rejected).
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS archive_date DATE;

CREATE INDEX IF NOT EXISTS idx_jobs_archive_date ON jobs(archive_date);

