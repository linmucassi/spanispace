-- Fix: company users get stuck in a redirect loop to /company/profile
-- showing "Profile Not Found. Please contact support."
-- Run this once in Supabase Dashboard > SQL Editor.
--
-- Root cause: company_profiles has RLS policies for SELECT and UPDATE only --
-- there was never an INSERT policy, unlike candidate_profiles which has
-- "Candidates insert own profile". Combined with handle_new_user() only ever
-- inserting into public.users (never company_profiles), a company signup had
-- no row in company_profiles and no way to create one client-side. Every
-- company page (dashboard/jobs/applications/candidates) redirects to
-- /company/profile when the row is missing, and the profile page itself
-- could only UPDATE an existing row, not create one -- dead end.

-- 1. Allow companies to create their own profile row.
CREATE POLICY "Companies insert own profile" ON company_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. Auto-provision the company_profiles row at signup so new company
--    accounts never hit the missing-profile redirect in the first place.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'role', 'candidate'));

  IF COALESCE(NEW.raw_user_meta_data->>'role', 'candidate') = 'company' THEN
    INSERT INTO public.company_profiles (user_id, company_name, industry, location)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'Unnamed Company'),
      NEW.raw_user_meta_data->>'industry',
      NEW.raw_user_meta_data->>'location'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Backfill: create a company_profiles row for any existing company user
--    that is missing one (this is what unblocks the currently affected user).
INSERT INTO public.company_profiles (user_id, company_name, industry, location)
SELECT
  u.id,
  COALESCE(au.raw_user_meta_data->>'company_name', 'Unnamed Company'),
  au.raw_user_meta_data->>'industry',
  au.raw_user_meta_data->>'location'
FROM public.users u
JOIN auth.users au ON au.id = u.id
WHERE u.role = 'company'
  AND NOT EXISTS (
    SELECT 1 FROM public.company_profiles cp WHERE cp.user_id = u.id
  );
