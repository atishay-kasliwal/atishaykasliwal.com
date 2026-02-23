-- Run as database owner after rotating credentials in Neon.
-- Replace app_user and app_password with secure values.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'job_tracker_app') THEN
    CREATE ROLE job_tracker_app LOGIN PASSWORD 'replace_with_strong_password';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE neondb TO job_tracker_app;
GRANT USAGE ON SCHEMA public TO job_tracker_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO job_tracker_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO job_tracker_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO job_tracker_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE, SELECT ON SEQUENCES TO job_tracker_app;
