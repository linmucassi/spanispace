-- Add candidate auto-apply automation (free opt-in for now, no billing).
-- Run this once in Supabase Dashboard > SQL Editor.
--
-- Candidates set preferences (fields of interest, excluded companies, work
-- types, preferred locations); a daily server-side matcher script (service
-- role, bypasses RLS) finds newly-qualifying jobs and stages them in
-- application_matches for the candidate to review. Nothing is submitted to
-- `applications` without the candidate clicking "Apply" on a specific match
-- -- this is a review queue, not a fully autonomous auto-submit.

CREATE TABLE IF NOT EXISTS candidate_automation_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES candidate_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  fields_of_interest TEXT[] DEFAULT '{}',
  excluded_companies TEXT[] DEFAULT '{}',
  work_types TEXT[] DEFAULT '{}',
  preferred_locations TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS application_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'dismissed')),
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (candidate_id, job_id)
);

ALTER TABLE candidate_automation_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates insert own automation prefs" ON candidate_automation_preferences FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM candidate_profiles cd WHERE cd.id = candidate_automation_preferences.candidate_id AND cd.user_id = auth.uid())
);
CREATE POLICY "Candidates read own automation prefs" ON candidate_automation_preferences FOR SELECT USING (
  EXISTS (SELECT 1 FROM candidate_profiles cd WHERE cd.id = candidate_automation_preferences.candidate_id AND cd.user_id = auth.uid())
);
CREATE POLICY "Candidates update own automation prefs" ON candidate_automation_preferences FOR UPDATE USING (
  EXISTS (SELECT 1 FROM candidate_profiles cd WHERE cd.id = candidate_automation_preferences.candidate_id AND cd.user_id = auth.uid())
);
CREATE POLICY "Candidates read own application matches" ON application_matches FOR SELECT USING (
  EXISTS (SELECT 1 FROM candidate_profiles cd WHERE cd.id = application_matches.candidate_id AND cd.user_id = auth.uid())
);
CREATE POLICY "Candidates update own application matches" ON application_matches FOR UPDATE USING (
  EXISTS (SELECT 1 FROM candidate_profiles cd WHERE cd.id = application_matches.candidate_id AND cd.user_id = auth.uid())
);

CREATE POLICY "Admin full access candidate_automation_preferences" ON candidate_automation_preferences FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access application_matches" ON application_matches FOR ALL USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_automation_prefs_enabled ON candidate_automation_preferences(enabled);
CREATE INDEX IF NOT EXISTS idx_application_matches_candidate ON application_matches(candidate_id, status);
