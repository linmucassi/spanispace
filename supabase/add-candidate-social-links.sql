-- add-candidate-social-links.sql
-- "Portfolio / LinkedIn / GitHub URL" was one field. Splits it into three, so
-- a candidate can list any combination without cramming them into one input.
-- portfolio_url is untouched; linkedin_url and github_url are new.
--
-- Idempotent. Safe to run more than once, and safe regardless of whether
-- add-notifications-and-profile-scoring.sql has run yet on this database.

ALTER TABLE candidate_profiles
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS github_url TEXT;

-- The "online presence" bucket in the profile-score trigger counted only
-- portfolio_url. Widen it to any of the three, without changing its weight
-- (10) or disturbing the other buckets, which still sum to 100.
CREATE OR REPLACE FUNCTION public.compute_profile_score()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_score INT := 0;
  -- professional_summary is added by add-informal-jobs.sql, which may not
  -- have run yet on this database. Read dynamically so a missing column
  -- reads as NULL rather than breaking every profile save.
  v_professional_summary TEXT := to_jsonb(NEW) ->> 'professional_summary';
BEGIN
  IF NEW.full_name IS NOT NULL AND length(trim(NEW.full_name)) > 0 THEN v_score := v_score + 15; END IF;
  IF NEW.phone IS NOT NULL AND length(trim(NEW.phone)) > 0 THEN v_score := v_score + 10; END IF;
  IF NEW.location IS NOT NULL AND length(trim(NEW.location)) > 0 THEN v_score := v_score + 10; END IF;
  IF NEW.skills IS NOT NULL AND array_length(NEW.skills, 1) > 0 THEN v_score := v_score + 20; END IF;
  IF NEW.cv_url IS NOT NULL AND length(trim(NEW.cv_url)) > 0 THEN v_score := v_score + 25; END IF;
  IF (NEW.portfolio_url IS NOT NULL AND length(trim(NEW.portfolio_url)) > 0)
     OR (NEW.linkedin_url IS NOT NULL AND length(trim(NEW.linkedin_url)) > 0)
     OR (NEW.github_url IS NOT NULL AND length(trim(NEW.github_url)) > 0)
  THEN v_score := v_score + 10; END IF;
  IF v_professional_summary IS NOT NULL AND length(trim(v_professional_summary)) > 0 THEN v_score := v_score + 10; END IF;

  NEW.profile_score := v_score;
  RETURN NEW;
END;
$$;

-- Backfill so a candidate whose only presence link was LinkedIn/GitHub isn't
-- left showing a stale, lower score until their next edit.
UPDATE candidate_profiles SET updated_at = updated_at;
