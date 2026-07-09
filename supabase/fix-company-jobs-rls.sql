-- Fix: companies could not reliably manage their own jobs.
-- Run this once in Supabase Dashboard > SQL Editor.
--
-- Root cause: `jobs` had a public SELECT policy scoped to status = 'active'
-- only, an open INSERT policy, and an admin-only ALL policy -- but no
-- SELECT/UPDATE policy for the owning company. Effects on a company signed
-- in as the owner of a job:
--   - /company/jobs/[id]/edit fetches the job with
--     .eq('id', jobId).eq('company_id', company.id).single() -- for a
--     closed or draft job this silently fails RLS and shows "Job not
--     found", even though the company owns it.
--   - The edit form's .update(...) call and JobActions.tsx's close/reopen
--     .update({status}) call both silently affect zero rows under RLS
--     (Supabase JS does not error on a zero-row RLS-filtered update), so
--     the UI shows "Job Updated" / toggles the button label while nothing
--     was actually saved.

CREATE POLICY "Companies read own jobs" ON jobs FOR SELECT USING (
  EXISTS (SELECT 1 FROM company_profiles cp WHERE cp.id = jobs.company_id AND cp.user_id = auth.uid())
);
CREATE POLICY "Companies update own jobs" ON jobs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM company_profiles cp WHERE cp.id = jobs.company_id AND cp.user_id = auth.uid())
);
