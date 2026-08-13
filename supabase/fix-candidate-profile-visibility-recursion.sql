-- Fix: infinite recursion in "Companies read applicant profiles" policy
-- Run once in Supabase Dashboard > SQL Editor against the LIVE project.
--
-- Root cause: fix-security-hardening.sql (section 5) added a candidate_profiles
-- SELECT policy that queries `applications` directly:
--
--   candidate_profiles SELECT policy -> EXISTS (... FROM applications ...)
--
-- But `applications` already has its own SELECT policy that queries back into
-- candidate_profiles:
--
--   "Candidates read own applications" ON applications
--     -> EXISTS (SELECT 1 FROM candidate_profiles cd WHERE cd.id = applications.candidate_id ...)
--
-- Any SELECT on candidate_profiles (including the ones RLS runs implicitly
-- during an UPDATE/UPSERT, e.g. from the onboarding "save profile" step)
-- evaluates every SELECT policy, which pulls in applications, which pulls in
-- candidate_profiles again -> infinite recursion. This is the same class of
-- bug fix-rls-recursion.sql already fixed for admin policies; that fix used a
-- SECURITY DEFINER function to bypass RLS on the inner lookup. This applies
-- the same pattern here.

CREATE OR REPLACE FUNCTION public.company_has_applicant(p_candidate_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.applications a
    JOIN public.jobs j ON j.id = a.job_id
    JOIN public.company_profiles cp ON cp.id = j.company_id
    WHERE a.candidate_id = p_candidate_id AND cp.user_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "Companies read applicant profiles" ON candidate_profiles;
CREATE POLICY "Companies read applicant profiles" ON candidate_profiles FOR SELECT USING (
  public.company_has_applicant(id)
);
