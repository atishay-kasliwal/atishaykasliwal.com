-- Add "referred by name" to referrals (person who referred you)
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referred_by_name TEXT;
