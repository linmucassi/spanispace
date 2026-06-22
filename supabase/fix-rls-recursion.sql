-- Fix: infinite recursion in admin RLS policies
-- Run this once in Supabase Dashboard > SQL Editor
--
-- Root cause: every admin policy does SELECT FROM users to check role,
-- but the users table itself has an admin policy that also SELECTs FROM users
-- → infinite recursion on any DB query.
--
-- Fix: a SECURITY DEFINER function reads users as the db owner (bypassing RLS),
-- so the recursion never starts.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Recreate every admin policy to use the function instead of an inline subquery

DROP POLICY IF EXISTS "Admin full access users" ON users;
CREATE POLICY "Admin full access users" ON users
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin full access jobs" ON jobs;
CREATE POLICY "Admin full access jobs" ON jobs
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin full access applications" ON applications;
CREATE POLICY "Admin full access applications" ON applications
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin full access trainings" ON trainings;
CREATE POLICY "Admin full access trainings" ON trainings
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin full access learnerships" ON learnerships;
CREATE POLICY "Admin full access learnerships" ON learnerships
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin full access late_uni_apps" ON late_uni_apps;
CREATE POLICY "Admin full access late_uni_apps" ON late_uni_apps
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin full access events" ON events;
CREATE POLICY "Admin full access events" ON events
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin full access waitlist" ON waitlist;
CREATE POLICY "Admin full access waitlist" ON waitlist
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin full access newsletter" ON newsletter;
CREATE POLICY "Admin full access newsletter" ON newsletter
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin full access enrollments" ON enrollments;
CREATE POLICY "Admin full access enrollments" ON enrollments
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin full access event_registrations" ON event_registrations;
CREATE POLICY "Admin full access event_registrations" ON event_registrations
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin full access candidate_profiles" ON candidate_profiles;
CREATE POLICY "Admin full access candidate_profiles" ON candidate_profiles
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin full access company_profiles" ON company_profiles;
CREATE POLICY "Admin full access company_profiles" ON company_profiles
  FOR ALL USING (public.is_admin());
