-- Add dashboard authentication + per-user data ownership.
-- Existing rows are assigned to owner email (default: katishay@gmail.com).

CREATE TABLE IF NOT EXISTS dashboard_users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  password_salt TEXT,
  password_iterations INTEGER NOT NULL DEFAULT 210000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dashboard_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES dashboard_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dashboard_sessions_user_id ON dashboard_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_sessions_expires_at ON dashboard_sessions(expires_at);

INSERT INTO dashboard_users (email)
SELECT 'katishay@gmail.com'
WHERE NOT EXISTS (
  SELECT 1 FROM dashboard_users WHERE email = 'katishay@gmail.com'
);

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS user_id BIGINT;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS user_id BIGINT;
ALTER TABLE daily_notes ADD COLUMN IF NOT EXISTS user_id BIGINT;
ALTER TABLE pending_items ADD COLUMN IF NOT EXISTS user_id BIGINT;

UPDATE jobs
SET user_id = (SELECT id FROM dashboard_users WHERE email = 'katishay@gmail.com' LIMIT 1)
WHERE user_id IS NULL;

UPDATE referrals
SET user_id = (SELECT id FROM dashboard_users WHERE email = 'katishay@gmail.com' LIMIT 1)
WHERE user_id IS NULL;

UPDATE daily_notes
SET user_id = (SELECT id FROM dashboard_users WHERE email = 'katishay@gmail.com' LIMIT 1)
WHERE user_id IS NULL;

UPDATE pending_items
SET user_id = (SELECT id FROM dashboard_users WHERE email = 'katishay@gmail.com' LIMIT 1)
WHERE user_id IS NULL;

ALTER TABLE jobs ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE referrals ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE daily_notes ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE pending_items ALTER COLUMN user_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_user_id ON referrals(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_notes_user_id ON daily_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_items_user_id ON pending_items(user_id);
