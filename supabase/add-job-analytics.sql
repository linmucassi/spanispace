-- Add job view + application drop-off tracking.
-- Run this once in Supabase Dashboard > SQL Editor.
--
-- Companies asked for visibility into job visits and unfinished applications.
-- Two lightweight event tables: one row per job-detail-page view, one row
-- per apply-form load ("started" an application). Compared against
-- `applications` (actual submissions), this gives companies a views ->
-- started -> submitted funnel per job.

CREATE TABLE IF NOT EXISTS job_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS application_starts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE job_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_starts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a job view" ON job_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can log an application start" ON application_starts FOR INSERT WITH CHECK (true);

CREATE POLICY "Companies read own job views" ON job_views FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM jobs j JOIN company_profiles cp ON cp.id = j.company_id
    WHERE j.id = job_views.job_id AND cp.user_id = auth.uid()
  )
);
CREATE POLICY "Companies read own application starts" ON application_starts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM jobs j JOIN company_profiles cp ON cp.id = j.company_id
    WHERE j.id = application_starts.job_id AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Admin full access job_views" ON job_views FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access application_starts" ON application_starts FOR ALL USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_job_views_job ON job_views(job_id);
CREATE INDEX IF NOT EXISTS idx_application_starts_job ON application_starts(job_id);
