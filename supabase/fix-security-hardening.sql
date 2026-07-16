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
--    The trigger previously trusted raw_user_meta_data->>'role' verbatim,
--    so anyone calling the anon SDK with role:"admin" became a full admin.
--    Force the role from an allowlist. Admins must be provisioned out of
--    band with the service role, never through public signup.
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
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Audit any admin rows that may already have been created through the hole.
-- Review the output by hand before and after running this migration:
--   SELECT id, email, role, created_at FROM public.users WHERE role = 'admin';


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
