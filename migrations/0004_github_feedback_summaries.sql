-- Display paraphrases stay separate from source feedback and sentiment labels.
CREATE TABLE gh_feedback_summaries (
  feedback_id TEXT PRIMARY KEY REFERENCES gh_feedback(id) ON DELETE CASCADE,
  source_body TEXT NOT NULL,
  summary TEXT NOT NULL CHECK (length(summary) <= 500),
  omit_reason TEXT,
  style_version TEXT NOT NULL,
  generated_at TEXT NOT NULL
);

-- A changed source body hides its old paraphrase until it has been reviewed again.
CREATE VIEW gh_feedback_display_entries AS
SELECT e.*, s.summary AS display_summary, s.omit_reason AS summary_omit_reason,
  s.style_version AS summary_style_version, s.generated_at AS summary_generated_at
FROM gh_feedback_entries e
LEFT JOIN gh_feedback_summaries s ON s.feedback_id = e.id AND s.source_body = e.body;
