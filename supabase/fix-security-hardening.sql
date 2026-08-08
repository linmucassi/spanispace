-- =====================================================================
-- Security hardening migration  (audit of 16 July 2026)
-- Run ONCE in the Supabase SQL Editor against the LIVE project.
-- Every statement is idempotent and safe to re-run.
--
-- Closes: privilege escalation via signup role, the missing applications
-- read/update policies, unvetted job injection into the public feed, and
-- company self-verification of events and trainings.
--
-- NOTE: the candidate documents bucket fix (public files) is a separate,
-- code-coupled change and is described at the bottom of this file. Do not
-- run that part until the signed-URL app code ships, or document viewing
-- will break.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Signup can no longer grant admin  (blocker B1)
--    The trigger trusted raw_user_meta_data->>'role' verbatim, so anyone
--    calling the anon SDK with role:"admin" became a full admin. The anon key
--    is public in every page bundle by design, so this needs no insider.
--    Force the role from an allowlist. Admins are provisioned out of band
--    with the service role, never through public signup.
--
--    CORRECTED 8 August 2026, and read this before running anything.
--    This section originally shipped the 16 July version of the function,
--    which had no candidate_profiles branch because that branch did not exist
--    yet. Since then PR #5 merged supabase/fix-application-visibility.sql,
--    which redefined the SAME function to create candidate_profiles at signup
--    and, because it was written for a different problem, went back to taking
--    the role verbatim. So the two migrations overwrite each other:
--
--      * run the 16 July version last  -> admin hole closed, but no candidate
--        profile is created, so every application is written with a NULL
--        candidate_id and is invisible on every dashboard. That is exactly
--        the bug PR #5 existed to fix.
--      * run the PR #5 version last    -> applications work, admin hole open.
--
--    Neither file was safe on its own. The definition below is the merge of
--    both: the allowlist from this file, and the candidate_profiles branch
--    from fix-application-visibility.sql, byte for byte on the insert. It is
--    safe to run whatever order the previous two were run in, and it must be
--    the last word on this function. Any future edit to handle_new_user has
--    to keep BOTH halves.
-- ---------------------------------------------------------------------
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
    -- From fix-application-visibility.sql. full_name is NOT NULL on
    -- candidate_profiles and the register page marks it required, so the email
    -- local part is only a last resort for accounts created outside the form.
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

-- Anyone who already walked through the hole keeps their admin row, because
-- closing the door does not evict whoever is already inside. RUN THIS, read
-- the list, and demote by hand anything that is not you or Linda:
--
--   SELECT id, email, role, created_at FROM public.users WHERE role = 'admin'
--   ORDER BY created_at;
--
--   -- then, for each one that should not be there:
--   -- UPDATE public.users SET role = 'candidate' WHERE id = '<uuid>';
--
-- Do the same check again after this migration. A new admin appearing after
-- this point means something other than signup is granting the role.


-- ---------------------------------------------------------------------
-- 2. Applications become readable by the right people  (blocker B4)
--    The table had only an insert policy and an admin policy, so companies
--    saw zero applicants and candidates never saw their own applications,
--    while status updates silently changed nothing.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Companies read applications to own jobs" ON applications;
CREATE POLICY "Companies read applications to own jobs" ON applications FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM jobs j
    JOIN company_profiles cp ON cp.id = j.company_id
    WHERE j.id = applications.job_id AND cp.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Companies update applications to own jobs" ON applications;
CREATE POLICY "Companies update applications to own jobs" ON applications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM jobs j
    JOIN company_profiles cp ON cp.id = j.company_id
    WHERE j.id = applications.job_id AND cp.user_id = auth.uid()
  )
)
WITH CHECK (
  -- The row must still belong to one of the company's jobs after the update,
  -- so an application cannot be re-parented to another company's job.
  EXISTS (
    SELECT 1 FROM jobs j
    JOIN company_profiles cp ON cp.id = j.company_id
    WHERE j.id = applications.job_id AND cp.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Candidates read own applications" ON applications;
CREATE POLICY "Candidates read own applications" ON applications FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM candidate_profiles cd
    WHERE cd.id = applications.candidate_id AND cd.user_id = auth.uid()
  )
);


-- ---------------------------------------------------------------------
-- 3. The public feed only shows vetted jobs, and public submissions
--    cannot self-verify  (blocker B3)
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read active jobs" ON jobs;
CREATE POLICY "Public read active jobs" ON jobs FOR SELECT USING (
  status = 'active' AND vetted_status = 'verified'
);

DROP POLICY IF EXISTS "Anyone can submit jobs" ON jobs;
CREATE POLICY "Anyone can submit jobs" ON jobs FOR INSERT WITH CHECK (
  -- A submission may only ever enter as pending. Verification is an admin act.
  vetted_status = 'pending'
);


-- ---------------------------------------------------------------------
-- 4. Company events and trainings default to pending and cannot be
--    self-verified  (blocker B6)
-- ---------------------------------------------------------------------
ALTER TABLE trainings ALTER COLUMN vetted_status SET DEFAULT 'pending';
ALTER TABLE events ALTER COLUMN vetted_status SET DEFAULT 'pending';

DROP POLICY IF EXISTS "Companies insert own trainings" ON trainings;
CREATE POLICY "Companies insert own trainings" ON trainings FOR INSERT WITH CHECK (
  vetted_status = 'pending'
  AND EXISTS (SELECT 1 FROM company_profiles cp WHERE cp.id = trainings.company_id AND cp.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Companies insert own events" ON events;
CREATE POLICY "Companies insert own events" ON events FOR INSERT WITH CHECK (
  vetted_status = 'pending'
  AND EXISTS (SELECT 1 FROM company_profiles cp WHERE cp.id = events.company_id AND cp.user_id = auth.uid())
);

-- Prevent a non-admin from flipping vetted_status on update (jobs, events,
-- trainings). This keeps the old value silently rather than raising, so it
-- never breaks a legitimate edit of other fields.
CREATE OR REPLACE FUNCTION public.lock_vetted_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_admin() AND NEW.vetted_status IS DISTINCT FROM OLD.vetted_status THEN
    NEW.vetted_status := OLD.vetted_status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS lock_vetted_status_jobs ON jobs;
CREATE TRIGGER lock_vetted_status_jobs BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION public.lock_vetted_status();

DROP TRIGGER IF EXISTS lock_vetted_status_events ON events;
CREATE TRIGGER lock_vetted_status_events BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION public.lock_vetted_status();

DROP TRIGGER IF EXISTS lock_vetted_status_trainings ON trainings;
CREATE TRIGGER lock_vetted_status_trainings BEFORE UPDATE ON trainings
  FOR EACH ROW EXECUTE FUNCTION public.lock_vetted_status();


-- ---------------------------------------------------------------------
-- 5. A company can see the profiles of candidates who applied to its
--    jobs, and only those  (should-fix S3)
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Companies read applicant profiles" ON candidate_profiles;
CREATE POLICY "Companies read applicant profiles" ON candidate_profiles FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    JOIN company_profiles cp ON cp.id = j.company_id
    WHERE a.candidate_id = candidate_profiles.id AND cp.user_id = auth.uid()
  )
);


-- =====================================================================
-- 6. Candidate documents bucket is public  (blocker B5)  --  DO NOT RUN
--    THIS SECTION UNTIL THE SIGNED-URL APP CODE IS DEPLOYED.
--
--    Every CV, certificate and ID document is currently downloadable by
--    URL because the bucket is public. Flipping it private closes that,
--    but it also breaks every getPublicUrl() call in the app, so the two
--    must ship together.
--
--    App changes required first:
--      a) components/candidate/DocumentLibrary.tsx: store the storage PATH
--         in candidate_documents.file_url (not the public URL), and create
--         a short-lived signed URL on view with
--         supabase.storage.from('documents').createSignedUrl(path, 60).
--         The candidate owns the file, so their session can sign it.
--      b) app/company/applications/ApplicationList.tsx: a company is not
--         the file owner, so add a small server route, e.g.
--         app/api/documents/sign, that authenticates the caller, checks
--         they are admin, the owning candidate, or a company that owns a
--         job the candidate applied to, and returns a signed URL made with
--         the service-role client. Never hand out the public URL.
--      c) A one-off backfill to convert existing file_url values from
--         public URLs to storage paths.
--
--    Then, and only then, run:
--
--      UPDATE storage.buckets SET public = false WHERE id = 'documents';
--
--    The existing "Candidates can read own documents" storage policy only
--    becomes meaningful once the bucket is private.
-- =====================================================================
