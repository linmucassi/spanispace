-- add-candidate-education.sql
-- candidate_profiles.matric_grad_year / university were single flat fields,
-- so a candidate with more than one qualification had nowhere to put the
-- second one. Splits education out into its own one-to-many table, the same
-- shape work_experiences already took in add-informal-jobs.sql.
--
-- matric_grad_year and university are left in place on candidate_profiles,
-- unused from here on -- nothing else in the app reads them, and dropping
-- columns is unnecessary risk for zero benefit. Their existing values are
-- backfilled into candidate_education below instead, so nothing a candidate
-- already entered quietly disappears from view.
--
-- Idempotent. Safe to run more than once.

CREATE TABLE IF NOT EXISTS candidate_education (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  institution TEXT NOT NULL,
  qualification TEXT,
  field_of_study TEXT,
  duration_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidate_education_user ON candidate_education(user_id);

ALTER TABLE candidate_education ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Candidates manage own education" ON candidate_education;
CREATE POLICY "Candidates manage own education" ON candidate_education
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- One-time backfill. Guarded so re-running this file doesn't duplicate rows:
-- only inserts where this user has no candidate_education rows yet at all.
INSERT INTO candidate_education (user_id, institution, qualification, duration_text)
SELECT cp.user_id, cp.university, NULL, NULL
FROM candidate_profiles cp
WHERE cp.university IS NOT NULL
  AND length(trim(cp.university)) > 0
  AND NOT EXISTS (SELECT 1 FROM candidate_education ce WHERE ce.user_id = cp.user_id);

INSERT INTO candidate_education (user_id, institution, qualification, duration_text)
SELECT cp.user_id, 'Matric', 'Matric', cp.matric_grad_year::text
FROM candidate_profiles cp
WHERE cp.matric_grad_year IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM candidate_education ce
    WHERE ce.user_id = cp.user_id AND ce.institution = 'Matric'
  );
