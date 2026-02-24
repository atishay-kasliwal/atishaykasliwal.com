-- Add application_status column to jobs
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS application_status TEXT NOT NULL DEFAULT 'Applied';

CREATE INDEX IF NOT EXISTS idx_jobs_application_status ON jobs(application_status);
