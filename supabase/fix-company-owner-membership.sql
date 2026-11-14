-- =====================================================================
-- Fix: companies created after 22 Aug 2026 have no owner membership row
-- (GitHub issue #29, "unable to send invite to candidate").
--
-- add-roles-invites-and-calendar.sql moved company permissions onto
-- company_members and backfilled an 'owner' row for every company that
-- existed when it ran (22 Aug 2026). Nothing creates that row for companies
-- that sign up later, so for them company_can_operate() / company_can_manage()
-- are always false and every insert those policies guard fails with
-- "new row violates row-level security policy" (job_invites first).
--
-- Found 14 Nov 2026: 1 of 8 production companies (Test Company, created
-- 20 Oct) had no row. Every future company signup would hit the same thing.
--
-- Safe to re-run: the trigger is replaced, and both inserts skip anyone who
-- already has a membership (company_members.user_id is UNIQUE).
-- =====================================================================

-- 1. Every new company gets its owner membership at the moment it is created.
CREATE OR REPLACE FUNCTION public.add_company_owner_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO public.company_members (company_id, user_id, role)
    VALUES (NEW.id, NEW.user_id, 'owner')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger functions are not meant to be called directly.
REVOKE EXECUTE ON FUNCTION public.add_company_owner_membership() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_add_company_owner_membership ON public.company_profiles;
CREATE TRIGGER trg_add_company_owner_membership
  AFTER INSERT ON public.company_profiles
  FOR EACH ROW EXECUTE FUNCTION public.add_company_owner_membership();

-- 2. Backfill companies created since the original backfill.
INSERT INTO public.company_members (company_id, user_id, role)
SELECT id, user_id, 'owner' FROM public.company_profiles
WHERE user_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- 3. Check: should return 0 rows.
SELECT cp.id, cp.company_name, cp.created_at
FROM public.company_profiles cp
WHERE cp.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.company_members m
    WHERE m.company_id = cp.id AND m.user_id = cp.user_id
  );
