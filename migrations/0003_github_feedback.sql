-- GitHub collaboration feedback: reviews, comments, and issue/PR/discussion descriptions.
-- Rows are loaded by scripts/import-github-feedback.mjs; the data itself never lives in git
-- because some entries come from private repositories.
--
-- Sentiment and attribution are independent columns. `suggested_*` holds the automated label
-- from the import; `sentiment*` holds the current label, which a manual edit can change.

CREATE TABLE gh_accounts (
  login TEXT PRIMARY KEY,
  account_type TEXT NOT NULL CHECK (account_type IN ('User', 'Organization', 'Bot')),
  avatar_url TEXT NOT NULL,
  profile_url TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE gh_repositories (
  full_name TEXT PRIMARY KEY,
  owner_login TEXT NOT NULL REFERENCES gh_accounts (login),
  name TEXT NOT NULL,
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private', 'internal', 'unknown')),
  url TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE gh_threads (
  url TEXT PRIMARY KEY,
  repository TEXT NOT NULL REFERENCES gh_repositories (full_name),
  kind TEXT NOT NULL CHECK (kind IN ('pull_request', 'issue', 'discussion')),
  number INTEGER NOT NULL CHECK (number > 0),
  title TEXT NOT NULL,
  -- open/closed as of the latest import; NULL when the thread description was not collected.
  state TEXT CHECK (state IN ('open', 'closed')),
  updated_at TEXT NOT NULL
);

CREATE TABLE gh_feedback (
  id TEXT PRIMARY KEY,                        -- first 24 hex chars of sha256(url)
  url TEXT NOT NULL UNIQUE,
  thread_url TEXT NOT NULL REFERENCES gh_threads (url),
  repository TEXT NOT NULL REFERENCES gh_repositories (full_name),
  author_login TEXT NOT NULL REFERENCES gh_accounts (login),
  feedback_type TEXT NOT NULL CHECK (feedback_type IN (
    'pull_request_description', 'issue_description', 'discussion_description',
    'comment', 'review', 'review_comment'
  )),
  is_thread_description INTEGER NOT NULL CHECK (is_thread_description IN (0, 1)),
  attribution TEXT NOT NULL CHECK (attribution IN ('Human', 'Organization')),
  is_own INTEGER NOT NULL CHECK (is_own IN (0, 1)),
  review_state TEXT CHECK (review_state IN ('APPROVED', 'CHANGES_REQUESTED', 'COMMENTED', 'DISMISSED')),
  body TEXT NOT NULL DEFAULT '',              -- raw GitHub markdown; render as text, never as HTML
  file_path TEXT,
  line INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  suggested_sentiment TEXT NOT NULL CHECK (suggested_sentiment IN ('Positive', 'Neutral', 'Negative')),
  suggested_reason TEXT NOT NULL,
  sentiment TEXT NOT NULL CHECK (sentiment IN ('Positive', 'Neutral', 'Negative')),
  sentiment_reason TEXT NOT NULL,
  sentiment_source TEXT NOT NULL CHECK (sentiment_source IN ('auto', 'manual')),
  sentiment_edited_at TEXT,
  sentiment_edited_by TEXT,
  imported_at TEXT NOT NULL
);

CREATE INDEX gh_feedback_created ON gh_feedback (created_at);
CREATE INDEX gh_feedback_repository ON gh_feedback (repository, created_at);
CREATE INDEX gh_feedback_author ON gh_feedback (author_login, created_at);
CREATE INDEX gh_feedback_sentiment ON gh_feedback (sentiment, created_at);
CREATE INDEX gh_feedback_thread ON gh_feedback (thread_url);

-- Every manual change to a sentiment label, newest last.
CREATE TABLE gh_sentiment_edits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feedback_id TEXT NOT NULL REFERENCES gh_feedback (id) ON DELETE CASCADE,
  previous_sentiment TEXT NOT NULL,
  previous_reason TEXT NOT NULL,
  sentiment TEXT NOT NULL CHECK (sentiment IN ('Positive', 'Neutral', 'Negative')),
  reason TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('auto', 'manual')),
  edited_by TEXT,
  edited_at TEXT NOT NULL
);

CREATE INDEX gh_sentiment_edits_feedback ON gh_sentiment_edits (feedback_id, edited_at);

CREATE TABLE gh_feedback_imports (
  id TEXT PRIMARY KEY,
  source_file TEXT NOT NULL,
  imported_at TEXT NOT NULL,
  row_count INTEGER NOT NULL,
  period_start TEXT,
  period_end TEXT,
  notes_json TEXT NOT NULL DEFAULT '{}'
);

-- One row per entry with its thread, repository, owner, and author joined in.
CREATE VIEW gh_feedback_entries AS
SELECT
  f.id,
  f.url,
  f.thread_url,
  t.title AS thread_title,
  t.kind AS thread_kind,
  t.number AS thread_number,
  t.state AS thread_state,
  f.repository,
  r.owner_login AS repository_owner,
  r.visibility AS repository_visibility,
  owner.account_type AS owner_type,
  owner.avatar_url AS owner_avatar_url,
  owner.profile_url AS owner_profile_url,
  f.author_login,
  author.account_type AS author_type,
  author.avatar_url AS author_avatar_url,
  author.profile_url AS author_profile_url,
  f.feedback_type,
  f.is_thread_description,
  f.attribution,
  f.is_own,
  f.review_state,
  f.body,
  f.file_path,
  f.line,
  f.created_at,
  f.updated_at,
  f.suggested_sentiment,
  f.suggested_reason,
  f.sentiment,
  f.sentiment_reason,
  f.sentiment_source,
  f.sentiment_edited_at,
  f.sentiment_edited_by
FROM gh_feedback f
JOIN gh_threads t ON t.url = f.thread_url
JOIN gh_repositories r ON r.full_name = f.repository
JOIN gh_accounts owner ON owner.login = r.owner_login
JOIN gh_accounts author ON author.login = f.author_login;
