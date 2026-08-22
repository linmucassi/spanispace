-- ============================================================
-- Informal work as a first-class citizen (July 2026)
-- Run this in the Supabase SQL Editor BEFORE merging the
-- feature/sa-first-jobs-informal-work branch. Idempotent, safe to re-run.
--
-- What it does:
--   1. Adds 'Piece Job' and 'Temporary' to the jobs.job_type CHECK
--   2. Adds jobs.duration (e.g. '3 months', 'Weekends')
--   3. Adds candidate_profiles.professional_summary
--   4. Creates work_experiences — informal and piece job work history
--      that candidates turn into a professional profile
--   5. Indexes jobs.apply_link (the scraper's dedupe key)
--
-- 22 Aug 2026: this file used to also seed 12 fabricated example job
-- listings (Harbour View Restaurant, Kasi Flavours Kitchen, etc.) directly
-- into the live `jobs` table as vetted_status='verified', status='active' --
-- meaning they displayed to real visitors as genuine jobs, and two real
-- people submitted real applications to them before this was caught in
-- production and removed. That seed block (and the seed_history table it
-- used) has been deleted from this file. The 'informal-jobs-2026-07' row
-- still exists in seed_history on the live database as a tombstone -- do
-- not reintroduce a seed block keyed to that same marker.
-- ============================================================

-- 1. Widen jobs.job_type
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_job_type_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_job_type_check
  CHECK (job_type IN (
    'Remote', 'Hybrid', 'On-site', 'Learnership', 'Internship',
    'Contract', 'Full-time', 'Part-time', 'Once-off',
    'Piece Job', 'Temporary'
  ));

-- 2. How long the work lasts — informal work is often fixed-length
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS duration TEXT;

-- 3. The AI-written professional summary lives on the profile
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS professional_summary TEXT;

-- 4. Work experience — every job counts, including piece jobs and
--    informal work. References are how informal work is verified in SA,
--    so the table carries a reference name and phone per entry.
CREATE TABLE IF NOT EXISTS work_experiences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  job_title TEXT NOT NULL,
  employer TEXT,
  work_type TEXT NOT NULL DEFAULT 'informal' CHECK (
    work_type IN ('formal', 'informal', 'piece_job', 'part_time', 'volunteer', 'self_employed')
  ),
  location TEXT,
  duration_text TEXT,
  duties TEXT,
  skills_gained TEXT[] DEFAULT '{}',
  reference_name TEXT,
  reference_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_experiences_user ON work_experiences(user_id);

ALTER TABLE work_experiences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Candidates manage own work experiences" ON work_experiences;
CREATE POLICY "Candidates manage own work experiences" ON work_experiences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. The scraper dedupes on apply_link every run — keep that lookup fast
--    as the table grows.
CREATE INDEX IF NOT EXISTS idx_jobs_apply_link ON jobs(apply_link);
