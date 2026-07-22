-- Fix: candidates never see the jobs they applied for, and can apply to the
-- same job over and over.
-- Run this once in Supabase Dashboard > SQL Editor. Idempotent, safe to re-run.
--
-- Reported in GitHub issue linmucassi/spanispace#4 by a tester who applied to
-- the same job four times, received nothing, and saw an empty dashboard.
--
-- Root cause, three separate faults stacked on top of each other:
--
--   1. `applications` has exactly two RLS policies, "Anyone can apply"
--      (FOR INSERT WITH CHECK (true)) and "Admin full access applications"
--      (FOR ALL USING (is_admin())). Nothing grants SELECT to the candidate
--      who applied or to the company that owns the job, so under RLS every
--      non-admin read of `applications` returns zero rows:
--        - /candidate/applications and /candidate/dashboard say "You have not
--          submitted any applications yet" after four real applications
--        - /company/applications, /company/dashboard and the per-job counts on
--          /company/jobs are silently empty for the owning company, so nobody
--          can act on a lead either
--        - the apply page cannot detect a prior application, so nothing can
--          tell a candidate they already applied
--      Companies also have no UPDATE policy, so the status buttons on
--      /company/applications save nothing and still report success, the same
--      class of bug fix-company-jobs-rls.sql was written for.
--
--   2. `handle_new_user()` creates a `users` row for everyone and a
--      `company_profiles` row for companies, but never a `candidate_profiles`
--      row. The only thing in the whole codebase that creates one is the Save
--      button on /candidate/profile. Until a candidate finds that page and
--      saves it, ApplyForm resolves `candidate_id` to NULL, so the application
--      is written with no owner and can never appear on anyone's dashboard and
--      can never be deduplicated.
--
--   3. There is no uniqueness on (candidate_id, job_id), unlike enrollments,
--      message_threads and application_matches which all have one. The
--      duplicate rows are real, not just invisible.
--
-- What it does:
--   1. Teaches handle_new_user() to create the candidate profile, and
--      backfills every candidate who signed up without one
--   2. Claims orphaned applications back to their owner by confirmed email
--   3. Collapses pre-existing duplicates so step 4 cannot fail
--   4. Adds a partial unique index, one application per candidate per job
--   5. Adds the missing candidate SELECT policy on `applications`
--   6. Adds the missing company SELECT and UPDATE policies on `applications`
--   7. Lets a candidate read a job they applied to even after it closes
--
-- Depends on fix-company-jobs-rls.sql having been run, because the company
-- policies below reach `applications` through `jobs`, and a company can only
-- see its own non-active jobs once that migration is in place.


-- 1. Create the candidate profile at signup, mirroring the company branch.
--    full_name is NOT NULL on candidate_profiles, and the register page marks
--    it required for candidates, so the email local part is only a last resort
--    for accounts created outside the form.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT := COALESCE(NEW.raw_user_meta_data->>'role', 'candidate');
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, v_role);

  IF v_role = 'company' THEN
    INSERT INTO public.company_profiles (user_id, company_name, industry, location)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'Unnamed Company'),
      NEW.raw_user_meta_data->>'industry',
      NEW.raw_user_meta_data->>'location'
    );
  ELSIF v_role = 'candidate' THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

--    Backfill every existing candidate who has no profile row. Guarded, so
--    re-running this file changes nothing.
INSERT INTO public.candidate_profiles (user_id, full_name, phone, location)
SELECT
  u.id,
  COALESCE(NULLIF(TRIM(au.raw_user_meta_data->>'full_name'), ''), split_part(u.email, '@', 1)),
  au.raw_user_meta_data->>'phone',
  au.raw_user_meta_data->>'location'
FROM public.users u
JOIN auth.users au ON au.id = u.id
WHERE u.role = 'candidate'
  AND NOT EXISTS (
    SELECT 1 FROM public.candidate_profiles cd WHERE cd.user_id = u.id
  );


-- 2. Claim orphaned applications.
--
--    The unique index from step 4 is dropped first. On a re-run it already
--    exists, and signed-out applications keep arriving in the meantime, so
--    claiming an orphan whose owner already has a row for that job would
--    violate the index mid-statement and roll the whole script back. Dropping
--    it here means the claim, the collapse and the recreate always run in that
--    order, on every run.
DROP INDEX IF EXISTS public.idx_applications_candidate_job_unique;

--    Every row written before this migration has
--    candidate_id NULL unless the applicant had already saved a profile, which
--    is why the tester's four applications are invisible to them. Match on the
--    email they typed, and only against a CONFIRMED address, so an application
--    can never be attached to an account that has not proven it owns the
--    mailbox. Rows with no email stay orphaned, there is nothing to match on.
UPDATE public.applications a
SET candidate_id = cd.id
FROM auth.users au
JOIN public.candidate_profiles cd ON cd.user_id = au.id
WHERE a.candidate_id IS NULL
  AND a.email IS NOT NULL
  AND au.email_confirmed_at IS NOT NULL
  AND LOWER(TRIM(a.email)) = LOWER(au.email);


-- 3. Collapse pre-existing duplicates so step 4 cannot abort with
--    "could not create unique index ... Key is duplicated". Signed-in
--    applications only, rows with candidate_id NULL are anonymous and stay
--    exempt. Keeps the furthest-along row per candidate and job, because a
--    company may already have shortlisted or hired one of the duplicates, and
--    falls back to the oldest on a tie. On a re-run this only touches rows
--    step 2 has just claimed, everything already deduplicated stays put.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY candidate_id, job_id
      ORDER BY
        CASE status
          WHEN 'hired'       THEN 1
          WHEN 'shortlisted' THEN 2
          WHEN 'reviewed'    THEN 3
          WHEN 'pending'     THEN 4
          WHEN 'rejected'    THEN 5
          ELSE 6
        END,
        created_at ASC
    ) AS rn
  FROM public.applications
  WHERE candidate_id IS NOT NULL
)
DELETE FROM public.applications a
USING ranked r
WHERE a.id = r.id AND r.rn > 1;


-- 4. One application per candidate per job. Partial, because candidate_id is
--    nullable by design: the apply page is public and a signed-out visitor
--    inserts NULL, and ON DELETE SET NULL nulls the column on surviving rows
--    when a profile is deleted. A partial unique index cannot be inferred by
--    PostgREST's upsert, so the app catches SQLSTATE 23505 instead of using
--    ON CONFLICT.
CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_candidate_job_unique
  ON public.applications (candidate_id, job_id)
  WHERE candidate_id IS NOT NULL;

--    Both candidate pages and the duplicate check filter on candidate_id, and
--    nothing indexed it.
CREATE INDEX IF NOT EXISTS idx_applications_candidate ON public.applications (candidate_id);


-- 5. Candidates read their own applications. Same idiom as
--    "Candidates read own application matches" in schema.sql.
DROP POLICY IF EXISTS "Candidates read own applications" ON applications;
CREATE POLICY "Candidates read own applications" ON applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM candidate_profiles cd WHERE cd.id = applications.candidate_id AND cd.user_id = auth.uid())
);

-- 6. Companies read and update the applications on their own jobs. Same idiom
--    as "Companies read own application starts" in schema.sql. Without the
--    UPDATE policy the status buttons on /company/applications match zero rows
--    and report success anyway.
DROP POLICY IF EXISTS "Companies read own job applications" ON applications;
CREATE POLICY "Companies read own job applications" ON applications FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM jobs j JOIN company_profiles cp ON cp.id = j.company_id
    WHERE j.id = applications.job_id AND cp.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Companies update own job applications" ON applications;
CREATE POLICY "Companies update own job applications" ON applications FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM jobs j JOIN company_profiles cp ON cp.id = j.company_id
    WHERE j.id = applications.job_id AND cp.user_id = auth.uid()
  )
);


-- 7. A candidate must be able to read the job behind their own application
--    even after it closes or expires. The only public policy on `jobs` is
--    USING (status = 'active'), so without this the embedded job on
--    /candidate/applications comes back NULL and the page renders "Job
--    removed" for exactly the listings a candidate most wants to look back at.
--
--    SECURITY DEFINER, because the reverse is also true: the company policies
--    in step 6 reach `applications` through `jobs`. A plain EXISTS here would
--    make the two tables evaluate each other's policies forever, which is the
--    recursion fix-rls-recursion.sql already had to unpick once.
CREATE OR REPLACE FUNCTION public.has_applied_to_job(p_job_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.applications a
    JOIN public.candidate_profiles cd ON cd.id = a.candidate_id
    WHERE a.job_id = p_job_id AND cd.user_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "Candidates read jobs they applied to" ON jobs;
CREATE POLICY "Candidates read jobs they applied to" ON jobs FOR SELECT USING (
  public.has_applied_to_job(id)
);
