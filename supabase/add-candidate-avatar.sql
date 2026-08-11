-- add-candidate-avatar.sql
-- No avatar/photo concept existed anywhere before this -- every "avatar" in
-- the UI was a letter-initial circle. Adds the column the new avatars
-- storage bucket (create-avatar-bucket.sql) writes its public URL into.
--
-- Idempotent. Safe to run more than once.

ALTER TABLE candidate_profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;
