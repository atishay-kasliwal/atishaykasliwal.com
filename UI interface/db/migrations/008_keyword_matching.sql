ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS keyword_matching TEXT;

UPDATE jobs
SET keyword_matching = 'Medium'
WHERE keyword_matching IS NULL OR TRIM(keyword_matching) = '';

ALTER TABLE jobs
ALTER COLUMN keyword_matching SET DEFAULT 'Medium';
