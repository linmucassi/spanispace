-- Clean up orphaned public.users rows and stop new ones appearing.
-- Written 20 Oct 2026 after a read-only audit. REVIEW BEFORE RUNNING.
-- Run in Supabase Dashboard > SQL Editor, one part at a time.
--
-- What happened: public.users.id should be a foreign key to auth.users(id)
-- ON DELETE CASCADE (see schema.sql), so deleting a sign-in account removes
-- its app rows. In production that didn't happen. 7 public.users rows have
-- no sign-in account. 3 of them share an email with a live account, which
-- is how a SQL lookup by email on 20 Oct picked the dead account and put a
-- message thread on a profile nobody can log into.
--
-- Audit (20 Oct 2026), 18 auth.users vs 25 public.users:
--   lin…@gmail.com  orphan 802cf3ff (11 Aug)  CV + 5 work experiences, live 5e35e357 has none -> MOVED below
--   per…@gmail.com  orphan 9d361dd4 (4 Sep)   empty profile, live 485f8268
--   com…@spanispace.com orphan 5c994152 (26 Jun) company role, no profile
--   4 × dia…@example.com (22 Aug, 4 Sep)       diagnostic test signups whose auth
--                                              users were deleted (incl. "Diag Co",
--                                              "Diag Co 2" companies + member rows)
-- No orphan has applications, threads, messages, jobs, events or enrollments.

-- =====================================================================
-- PART 0: PREVIEW. Run this alone first and compare with the list above.
-- =====================================================================

SELECT
  u.id,
  u.email,
  u.role,
  u.created_at::date AS created,
  (SELECT a.id FROM auth.users a WHERE lower(a.email) = lower(u.email)) AS live_account_with_same_email,
  (SELECT count(*) FROM public.work_experiences w WHERE w.user_id = u.id) AS work_experiences,
  (SELECT count(*) FROM public.candidate_education e WHERE e.user_id = u.id) AS education,
  (SELECT count(*) FROM public.candidate_documents d WHERE d.user_id = u.id) AS documents
FROM public.users u
WHERE NOT EXISTS (SELECT 1 FROM auth.users a WHERE a.id = u.id)
ORDER BY u.created_at;

-- Is the users -> auth.users foreign key there at all? (Expect no row, or
-- convalidated = false; that's why orphans could exist.)
SELECT conname, convalidated, confdeltype
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass AND contype = 'f';

-- =====================================================================
-- PART 1: MERGE + DELETE + PROTECT. One transaction: any error undoes all.
-- =====================================================================

BEGIN;

-- Guard: stop if the picture has changed since the audit.
DO $$
DECLARE n INT;
BEGIN
  SELECT count(*) INTO n FROM public.users u
  WHERE NOT EXISTS (SELECT 1 FROM auth.users a WHERE a.id = u.id);
  IF n <> 7 THEN
    RAISE EXCEPTION 'Expected 7 orphaned users, found %. Re-run the PART 0 preview and review before continuing.', n;
  END IF;
END $$;

-- 1. Move profile data from an orphan to the live account with the same
--    email, so nothing a real person entered is lost. (Only Linda's has any:
--    her CV and 5 work experiences.) The CV file itself stays where it is in
--    Storage, and its existing URL keeps working.
CREATE TEMP TABLE orphan_pairs ON COMMIT DROP AS
SELECT o.id AS orphan_id, a.id AS live_id
FROM public.users o
JOIN auth.users a ON lower(a.email) = lower(o.email)
WHERE NOT EXISTS (SELECT 1 FROM auth.users x WHERE x.id = o.id);

UPDATE public.work_experiences t SET user_id = p.live_id FROM orphan_pairs p WHERE t.user_id = p.orphan_id;
UPDATE public.candidate_education t SET user_id = p.live_id FROM orphan_pairs p WHERE t.user_id = p.orphan_id;
UPDATE public.candidate_documents t SET user_id = p.live_id FROM orphan_pairs p WHERE t.user_id = p.orphan_id;

-- 2. Delete the orphans. ON DELETE CASCADE removes their candidate/company
--    profiles and company_members rows. Nothing else references them (checked).
DELETE FROM public.users u
WHERE NOT EXISTS (SELECT 1 FROM auth.users a WHERE a.id = u.id);

-- 3. Put the foreign key back, so deleting a sign-in account removes its
--    app rows from now on. Skipped if a valid one already exists. An unvalidated
--    one is validated now that no orphans remain.
DO $$
DECLARE
  v_name TEXT;
  v_valid BOOLEAN;
BEGIN
  SELECT conname, convalidated INTO v_name, v_valid
  FROM pg_constraint
  WHERE conrelid = 'public.users'::regclass AND contype = 'f' AND confrelid = 'auth.users'::regclass
  LIMIT 1;

  IF v_name IS NULL THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  ELSIF NOT v_valid THEN
    EXECUTE format('ALTER TABLE public.users VALIDATE CONSTRAINT %I', v_name);
  END IF;
END $$;

-- 4. Check: both should be 0.
SELECT
  (SELECT count(*) FROM public.users u WHERE NOT EXISTS (SELECT 1 FROM auth.users a WHERE a.id = u.id)) AS orphans_left,
  (SELECT count(*) FROM auth.users a WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = a.id)) AS accounts_missing_rows;

COMMIT;

-- =====================================================================
-- PART 2 (not SQL): Storage leftovers under the deleted orphan's folders.
-- =====================================================================
-- avatars/802cf3ff-6236-48d4-8c7d-23ea74f43075/ holds 4 old avatar images
-- that nothing references once the orphan is gone. They're harmless; remove
-- them from Dashboard > Storage > avatars if you want. Do NOT delete
-- documents/802cf3ff-.../ : that's the CV moved to the live account above,
-- and its URL still points there.
