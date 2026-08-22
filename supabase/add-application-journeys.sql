-- Application journeys: internal vs external, source tracking, university
-- interest capture. Run ONCE in the Supabase SQL Editor against the LIVE
-- project. Idempotent (safe to re-run).
--
-- Context: candidates need a consistent "apply on Spanispace" vs "redirect to
-- an external site" journey across jobs and learnerships (learnerships are
-- being merged into `jobs`, job_type = 'Learnership' -- the standalone
-- `learnerships` table is left in place but no longer written to). Admins
-- need to see every application everywhere; companies only their own.
-- Colleges/Universities (`late_uni_apps`) stays a fully separate system, with
-- its own lightweight interest-capture table.
--
-- Also fixes a live bug: scraped jobs (daily cron) were auto-verified with no
-- admin review, and owned by a shared "Spanispace Curated" company account --
-- meaning whoever controls that one company login could see applicant data
-- for every scraped job. This migration retroactively strips that ownership
-- and re-queues existing scraped jobs for admin review.

-- ---------------------------------------------------------------------
-- 1. jobs.origin / jobs.apply_mode
--    origin: who owns/posted it, drives dashboard visibility.
--    apply_mode: how the candidate finishes -- on_platform (today's full
--    form) or redirect (short capture form, then off to apply_link).
-- ---------------------------------------------------------------------
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'company'
    CHECK (origin IN ('company', 'admin_curated', 'scraped')),
  ADD COLUMN IF NOT EXISTS apply_mode TEXT NOT NULL DEFAULT 'on_platform'
    CHECK (apply_mode IN ('on_platform', 'redirect'));

-- Backfill: rows owned by the shared "Spanispace Curated" company are scraper
-- output -- reassign to source='scraped', strip the shared ownership (the
-- actual bug fix), force apply_mode='redirect' since they all carry a real
-- external apply_link already.
UPDATE jobs j
SET origin = 'scraped',
    apply_mode = 'redirect',
    company_id = NULL
FROM company_profiles cp
WHERE j.company_id = cp.id
  AND cp.company_name = 'Spanispace Curated';

-- Backfill: remaining rows with no company owner were created directly by an
-- admin via /admin/jobs/new (or the old standalone learnerships table, once
-- migrated by hand -- see supabase/fix-application-journeys-notes below).
UPDATE jobs
SET origin = 'admin_curated'
WHERE company_id IS NULL
  AND origin = 'company'; -- only rows still on the default, so this is safe to re-run

-- Every other row (company_id IS NOT NULL, not ex-"Spanispace Curated")
-- already defaulted to origin='company' above -- nothing else to do.

-- ---------------------------------------------------------------------
-- 2. University application interest (fully separate from jobs/learnerships)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS university_application_interests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  late_uni_app_id UUID REFERENCES late_uni_apps(id) ON DELETE CASCADE NOT NULL,
  candidate_id UUID REFERENCES candidate_profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE university_application_interests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access university_application_interests" ON university_application_interests;
CREATE POLICY "Admin full access university_application_interests" ON university_application_interests FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Candidates insert own university interest" ON university_application_interests;
CREATE POLICY "Candidates insert own university interest" ON university_application_interests FOR INSERT WITH CHECK (
  candidate_id IS NULL OR EXISTS (
    SELECT 1 FROM candidate_profiles cd WHERE cd.id = university_application_interests.candidate_id AND cd.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Candidates read own university interest" ON university_application_interests;
CREATE POLICY "Candidates read own university interest" ON university_application_interests FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM candidate_profiles cd WHERE cd.id = university_application_interests.candidate_id AND cd.user_id = auth.uid()
  )
);

CREATE INDEX IF NOT EXISTS idx_university_interest_late_uni_app ON university_application_interests(late_uni_app_id);
CREATE INDEX IF NOT EXISTS idx_jobs_origin ON jobs(origin);
