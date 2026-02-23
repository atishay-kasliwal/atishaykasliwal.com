CREATE TABLE IF NOT EXISTS jobs (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'import',
  source_row INTEGER,
  date_saved TIMESTAMPTZ,
  role TEXT,
  company TEXT,
  location_raw TEXT,
  job_link TEXT,
  oa_status TEXT,
  referral_status TEXT,
  response_status TEXT,
  application_count INTEGER,
  applied_time_raw TEXT,
  applicant_count_raw TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
CREATE INDEX IF NOT EXISTS idx_jobs_date_saved ON jobs(date_saved DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_referral_status ON jobs(referral_status);
CREATE INDEX IF NOT EXISTS idx_jobs_response_status ON jobs(response_status);

CREATE TABLE IF NOT EXISTS referrals (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'import',
  source_row INTEGER,
  company TEXT NOT NULL,
  request_log TEXT,
  request_date DATE,
  updated_date DATE,
  request_link TEXT,
  referral_received TEXT,
  comment TEXT,
  message_ready TEXT,
  resume_ready TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_company ON referrals(company);
CREATE INDEX IF NOT EXISTS idx_referrals_request_date ON referrals(request_date DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(referral_received);

CREATE TABLE IF NOT EXISTS daily_notes (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'import',
  source_row INTEGER,
  note_date TEXT,
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pending_items (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'import',
  source_row INTEGER,
  company TEXT NOT NULL,
  position_name TEXT,
  pending_date DATE,
  updated_date DATE,
  comment TEXT,
  link TEXT,
  drafted_message TEXT,
  is_done BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pending_done ON pending_items(is_done);

CREATE TABLE IF NOT EXISTS import_runs (
  id BIGSERIAL PRIMARY KEY,
  source_file TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  details JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS jobs_set_updated_at ON jobs;
CREATE TRIGGER jobs_set_updated_at
BEFORE UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS referrals_set_updated_at ON referrals;
CREATE TRIGGER referrals_set_updated_at
BEFORE UPDATE ON referrals
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS daily_notes_set_updated_at ON daily_notes;
CREATE TRIGGER daily_notes_set_updated_at
BEFORE UPDATE ON daily_notes
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS pending_items_set_updated_at ON pending_items;
CREATE TRIGGER pending_items_set_updated_at
BEFORE UPDATE ON pending_items
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
