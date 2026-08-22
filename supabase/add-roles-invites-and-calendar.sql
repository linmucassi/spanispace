-- Platform roles + general invite system + company org/RBAC + interview
-- scheduling & calendar. Run ONCE in the Supabase SQL Editor against the
-- LIVE project. Idempotent.
--
-- After running this, promote your own account to super_admin manually --
-- bootstrapping the first super_admin can't happen through the app itself,
-- same as how the very first admin was always provisioned out of band
-- (see fix-security-hardening.sql):
--
--   UPDATE users SET role = 'super_admin' WHERE email = 'your-email@example.com';
--
-- =====================================================================
-- PART A: Platform roles (super_admin / admin split)
-- =====================================================================

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('candidate', 'company', 'admin', 'super_admin'));

-- Every existing "Admin full access X" policy in this app keys off
-- is_admin(), so widening it here means super_admin automatically inherits
-- all of them -- zero other RLS changes needed for that inheritance.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

-- "Admin full access users" (existing policy) is FOR ALL with no column
-- restriction, which would let any admin -- not just super_admin -- change
-- role via a plain UPDATE. RLS has no native per-column enforcement, so
-- this is gated the same way jobs/events/trainings.vetted_status already
-- are (fix-security-hardening.sql's lock_vetted_status()): silently keep
-- the old value instead of raising, unless the actor is super_admin.
-- auth.uid() is NULL under the service-role connection (no JWT), which is
-- exactly the trusted path /api/invites/accept uses to grant admin via
-- accepted invite -- that path is gated by matching an unguessable token to
-- the right email server-side, not by RLS/auth.uid() at all, the same trust
-- model every other service-role script in this app already relies on
-- (lib/supabase/admin.ts: "Bypasses RLS -- never expose this on the
-- client"). Only an authenticated non-super-admin gets silently reverted.
CREATE OR REPLACE FUNCTION public.lock_user_role()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_super_admin() AND NEW.role IS DISTINCT FROM OLD.role THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS lock_user_role_trigger ON users;
CREATE TRIGGER lock_user_role_trigger BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION public.lock_user_role();

-- =====================================================================
-- PART B: General invite system
-- =====================================================================
-- Deliberately NOT wired into handle_new_user() -- that trigger already
-- caused a full production outage this session (the search_path bug,
-- supabase/fix-candidate-signup-search-path.sql). Invite acceptance is an
-- explicit POST /api/invites/accept call the client makes AFTER
-- supabase.auth.signUp() succeeds, using the service-role client -- the
-- signup trigger itself is never touched by any of this.
CREATE TABLE IF NOT EXISTS platform_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  email TEXT NOT NULL,
  invite_type TEXT NOT NULL CHECK (invite_type IN ('platform_admin', 'company_member', 'referral')),
  company_id UUID REFERENCES company_profiles(id) ON DELETE CASCADE,
  company_role TEXT CHECK (company_role IN ('owner', 'admin', 'manager', 'member', 'viewer')),
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  CHECK (invite_type != 'company_member' OR (company_id IS NOT NULL AND company_role IS NOT NULL))
);
ALTER TABLE platform_invites ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated SELECT by token -- an unauthenticated visitor must
-- never be able to enumerate invites. Acceptance goes through the
-- service-role-backed /api/invites/accept route instead.
DROP POLICY IF EXISTS "Users manage own sent invites" ON platform_invites;
CREATE POLICY "Users manage own sent invites" ON platform_invites FOR ALL USING (
  invited_by = auth.uid()
) WITH CHECK (
  invited_by = auth.uid()
);
DROP POLICY IF EXISTS "Admin full access platform_invites" ON platform_invites;
CREATE POLICY "Admin full access platform_invites" ON platform_invites FOR ALL USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_platform_invites_token ON platform_invites(token);
CREATE INDEX IF NOT EXISTS idx_platform_invites_email ON platform_invites(email);

-- =====================================================================
-- PART C: Company org / RBAC
-- =====================================================================
-- Today a "company" is exactly one login (company_profiles.user_id is
-- UNIQUE). This adds a real membership table with a 5-tier role
-- hierarchy, additively -- every existing company_profiles.user_id-based
-- RLS policy is left completely untouched, and a NEW permissive policy is
-- layered alongside it per table. Postgres ORs multiple permissive
-- policies together, so nothing that already works can break; this is the
-- same pattern already used twice this session (opted-in candidates,
-- company_has_applicant() for job_invites).
CREATE TABLE IF NOT EXISTS company_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES company_profiles(id) ON DELETE CASCADE NOT NULL,
  -- One person belongs to at most one company at a time in v1 -- keeps
  -- "which company am I acting as" unambiguous everywhere in the app.
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member', 'viewer')),
  added_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (company_id, user_id)
);
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;

-- Backfill: every existing company keeps working exactly as before, now
-- also expressed as an 'owner' membership row. Safe to re-run -- ON
-- CONFLICT (user_id) DO NOTHING skips anyone already migrated.
INSERT INTO company_members (company_id, user_id, role)
SELECT id, user_id, 'owner' FROM company_profiles
WHERE user_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.company_member_role(p_company_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.company_members
  WHERE company_id = p_company_id AND user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.company_is_member(p_company_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = p_company_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.company_can_operate(p_company_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = p_company_id AND user_id = auth.uid()
      AND role IN ('owner', 'admin', 'manager', 'member')
  );
$$;

CREATE OR REPLACE FUNCTION public.company_can_manage(p_company_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = p_company_id AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
$$;

-- Ownership transfer is out of scope for v1 (not exposed in the UI) --
-- block editing or removing an 'owner' row outright, mirroring
-- lock_vetted_status()'s "keep the old value silently" idiom.
CREATE OR REPLACE FUNCTION public.protect_company_owner()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.role = 'owner' THEN
      RAISE EXCEPTION 'Cannot remove the company owner.';
    END IF;
    RETURN OLD;
  END IF;
  IF OLD.role = 'owner' AND NEW.role IS DISTINCT FROM OLD.role THEN
    NEW.role := 'owner';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS protect_company_owner_update ON company_members;
CREATE TRIGGER protect_company_owner_update BEFORE UPDATE ON company_members
  FOR EACH ROW EXECUTE FUNCTION public.protect_company_owner();
DROP TRIGGER IF EXISTS protect_company_owner_delete ON company_members;
CREATE TRIGGER protect_company_owner_delete BEFORE DELETE ON company_members
  FOR EACH ROW EXECUTE FUNCTION public.protect_company_owner();

DROP POLICY IF EXISTS "Members read own company roster" ON company_members;
CREATE POLICY "Members read own company roster" ON company_members FOR SELECT USING (
  public.company_is_member(company_id)
);
DROP POLICY IF EXISTS "Managers manage company roster" ON company_members;
CREATE POLICY "Managers manage company roster" ON company_members FOR ALL USING (
  public.company_can_manage(company_id)
) WITH CHECK (
  public.company_can_manage(company_id)
);
DROP POLICY IF EXISTS "Admin full access company_members" ON company_members;
CREATE POLICY "Admin full access company_members" ON company_members FOR ALL USING (public.is_admin());

-- Additive policies: team members beyond the owner get the same access the
-- owner-only policies already grant, gated by role.
DROP POLICY IF EXISTS "Team members read own company jobs" ON jobs;
CREATE POLICY "Team members read own company jobs" ON jobs FOR SELECT USING (
  public.company_is_member(company_id)
);
DROP POLICY IF EXISTS "Team members update own company jobs" ON jobs;
CREATE POLICY "Team members update own company jobs" ON jobs FOR UPDATE USING (
  public.company_can_operate(company_id)
);

DROP POLICY IF EXISTS "Team members insert own company trainings" ON trainings;
CREATE POLICY "Team members insert own company trainings" ON trainings FOR INSERT WITH CHECK (
  public.company_can_operate(company_id)
);
DROP POLICY IF EXISTS "Team members read own company trainings" ON trainings;
CREATE POLICY "Team members read own company trainings" ON trainings FOR SELECT USING (
  public.company_is_member(company_id)
);
DROP POLICY IF EXISTS "Team members update own company trainings" ON trainings;
CREATE POLICY "Team members update own company trainings" ON trainings FOR UPDATE USING (
  public.company_can_operate(company_id)
);

DROP POLICY IF EXISTS "Team members insert own company events" ON events;
CREATE POLICY "Team members insert own company events" ON events FOR INSERT WITH CHECK (
  public.company_can_operate(company_id)
);
DROP POLICY IF EXISTS "Team members read own company events" ON events;
CREATE POLICY "Team members read own company events" ON events FOR SELECT USING (
  public.company_is_member(company_id)
);
DROP POLICY IF EXISTS "Team members update own company events" ON events;
CREATE POLICY "Team members update own company events" ON events FOR UPDATE USING (
  public.company_can_operate(company_id)
);

DROP POLICY IF EXISTS "Team members read own company job applications" ON applications;
CREATE POLICY "Team members read own company job applications" ON applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM jobs j WHERE j.id = applications.job_id AND public.company_is_member(j.company_id))
);
DROP POLICY IF EXISTS "Team members update own company job applications" ON applications;
CREATE POLICY "Team members update own company job applications" ON applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM jobs j WHERE j.id = applications.job_id AND public.company_can_operate(j.company_id))
);

DROP POLICY IF EXISTS "Team members manage own company invites" ON job_invites;
CREATE POLICY "Team members manage own company invites" ON job_invites FOR ALL USING (
  public.company_can_operate(company_id)
) WITH CHECK (
  public.company_can_operate(company_id)
  AND EXISTS (
    SELECT 1 FROM candidate_profiles c WHERE c.id = job_invites.candidate_id
    AND (c.open_to_offers = true OR public.company_has_applicant(c.id))
  )
);

-- Any team member can see the company's own profile/branding; only
-- owner/admin can edit it.
DROP POLICY IF EXISTS "Team members read own company profile" ON company_profiles;
CREATE POLICY "Team members read own company profile" ON company_profiles FOR SELECT USING (
  public.company_is_member(id)
);
DROP POLICY IF EXISTS "Managers update own company profile" ON company_profiles;
CREATE POLICY "Managers update own company profile" ON company_profiles FOR UPDATE USING (
  public.company_can_manage(id)
);

-- Messaging: widen the existing thread-party check at the function level
-- (CREATE OR REPLACE, safe -- the policies that call it don't change) so
-- any team member who can operate can read/send in the company's threads,
-- not just the original owner.
CREATE OR REPLACE FUNCTION public.is_thread_party(p_company_id UUID, p_candidate_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.company_can_operate(p_company_id)
    OR EXISTS (
      SELECT 1 FROM public.candidate_profiles cd WHERE cd.id = p_candidate_id AND cd.user_id = auth.uid()
    );
$$;

CREATE INDEX IF NOT EXISTS idx_company_members_company ON company_members(company_id);

-- =====================================================================
-- PART D: Interview scheduling + calendar
-- =====================================================================
CREATE TABLE IF NOT EXISTS interviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES company_profiles(id) ON DELETE CASCADE NOT NULL,
  candidate_id UUID REFERENCES candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  scheduled_by UUID REFERENCES users(id) ON DELETE SET NULL,
  proposed_start TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 30,
  location TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'confirmed', 'declined', 'rescheduled', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team members manage own company interviews" ON interviews;
CREATE POLICY "Team members manage own company interviews" ON interviews FOR ALL USING (
  public.company_can_operate(company_id)
) WITH CHECK (
  public.company_can_operate(company_id)
);
DROP POLICY IF EXISTS "Candidates read own interviews" ON interviews;
CREATE POLICY "Candidates read own interviews" ON interviews FOR SELECT USING (
  EXISTS (SELECT 1 FROM candidate_profiles c WHERE c.id = interviews.candidate_id AND c.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Candidates respond to own interviews" ON interviews;
CREATE POLICY "Candidates respond to own interviews" ON interviews FOR UPDATE USING (
  EXISTS (SELECT 1 FROM candidate_profiles c WHERE c.id = interviews.candidate_id AND c.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Admin full access interviews" ON interviews;
CREATE POLICY "Admin full access interviews" ON interviews FOR ALL USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_interviews_company ON interviews(company_id);
CREATE INDEX IF NOT EXISTS idx_interviews_candidate ON interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_application ON interviews(application_id);
