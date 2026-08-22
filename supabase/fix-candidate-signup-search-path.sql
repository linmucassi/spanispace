-- Fix: "Database error saving new user" on every candidate signup
-- (Google sign-in and the email/password candidate form both hit this --
-- company signup was unaffected). Run ONCE in the Supabase SQL Editor
-- against the LIVE project. Idempotent.
--
-- Root cause: schema.sql's handle_new_user() was edited on 13 Aug 2026 and
-- lost the `SET search_path = public` clause that supabase/fix-security-
-- hardening.sql (8 Aug 2026) had added, along with that migration's
-- signup-role allowlist. handle_new_user() is SECURITY DEFINER, called by
-- Supabase's `supabase_auth_admin` role, whose own search_path does not
-- include `public` (a deliberate Supabase hardening default). Company
-- signups never noticed because company_profiles has no trigger of its
-- own. Candidate signups insert into candidate_profiles, which fires
-- compute_profile_score() (supabase/fix-cv-completeness.sql) -- and THAT
-- function reads an unqualified `candidate_documents`, which fails to
-- resolve without `public` on the search path, aborting the whole
-- transaction. Restoring `SET search_path = public` here fixes it; this is
-- byte-for-byte the fix-security-hardening.sql definition, re-run so it is
-- the last word again. Any future edit to handle_new_user must keep it.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  requested_role text := NEW.raw_user_meta_data->>'role';
  safe_role text;
BEGIN
  -- Only 'company' or 'candidate' may come from signup. Anything else,
  -- including 'admin', collapses to 'candidate'.
  safe_role := CASE WHEN requested_role = 'company' THEN 'company' ELSE 'candidate' END;

  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, safe_role);

  IF safe_role = 'company' THEN
    INSERT INTO public.company_profiles (user_id, company_name, industry, location)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'Unnamed Company'),
      NEW.raw_user_meta_data->>'industry',
      NEW.raw_user_meta_data->>'location'
    );
  ELSE
    INSERT INTO public.candidate_profiles (user_id, full_name, phone, location)
    VALUES (
      NEW.id,
      COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), split_part(NEW.email, '@', 1)),
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'location'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
