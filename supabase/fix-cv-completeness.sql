-- Fix: profile-completeness checklist and profile_score never reflected an
-- uploaded CV, and companies could never see a candidate's CV either.
-- Run once in Supabase Dashboard > SQL Editor. Idempotent.
--
-- Root cause: candidate_profiles.cv_url predates the multi-document library
-- (candidate_documents, supabase/add-documents-table.sql). Nothing in the app
-- writes to that column anymore -- uploading a CV inserts a candidate_documents
-- row with doc_type='cv' instead. But compute_profile_score() (the trigger
-- behind profile_score) still reads the dead cv_url column, and the app's
-- checklist (lib/profileCompleteness.ts) has been fixed to match this
-- migration's new source of truth. Separately, even a correct check would
-- never have fired: compute_profile_score() is a BEFORE trigger on
-- candidate_profiles, and a CV upload only ever touches candidate_documents,
-- so the score was never recalculated at upload time regardless.
--
-- Section 4 fixes a second, separate symptom of the same root cause:
-- candidate_documents has exactly one RLS policy, owner-only ("Candidates
-- manage own documents"), so no company could ever read any candidate's CV
-- row, even one who had applied to their own job -- CandidateSearch.tsx's
-- "Download CV" link was reading the same dead cv_url column and had never
-- actually been reachable by RLS either way.

-- 1. Score the CV bucket off candidate_documents instead of the dead cv_url
--    column.
CREATE OR REPLACE FUNCTION public.compute_profile_score()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_score INT := 0;
  -- professional_summary is added by add-informal-jobs.sql, which may not
  -- have run yet on this database. Read dynamically so a missing column
  -- reads as NULL rather than breaking every profile save.
  v_professional_summary TEXT := to_jsonb(NEW) ->> 'professional_summary';
  v_has_cv BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM candidate_documents WHERE user_id = NEW.user_id AND doc_type = 'cv'
  ) INTO v_has_cv;

  IF NEW.full_name IS NOT NULL AND length(trim(NEW.full_name)) > 0 THEN v_score := v_score + 15; END IF;
  IF NEW.phone IS NOT NULL AND length(trim(NEW.phone)) > 0 THEN v_score := v_score + 10; END IF;
  IF NEW.location IS NOT NULL AND length(trim(NEW.location)) > 0 THEN v_score := v_score + 10; END IF;
  IF NEW.skills IS NOT NULL AND array_length(NEW.skills, 1) > 0 THEN v_score := v_score + 20; END IF;
  IF v_has_cv THEN v_score := v_score + 25; END IF;
  IF (NEW.portfolio_url IS NOT NULL AND length(trim(NEW.portfolio_url)) > 0)
     OR (NEW.linkedin_url IS NOT NULL AND length(trim(NEW.linkedin_url)) > 0)
     OR (NEW.github_url IS NOT NULL AND length(trim(NEW.github_url)) > 0)
  THEN v_score := v_score + 10; END IF;
  IF v_professional_summary IS NOT NULL AND length(trim(v_professional_summary)) > 0 THEN v_score := v_score + 10; END IF;

  NEW.profile_score := v_score;
  RETURN NEW;
END;
$$;

-- 2. candidate_documents has no relationship to candidate_profiles that would
--    fire the BEFORE UPDATE trigger above, so uploading or deleting a CV
--    must explicitly re-touch the owner's candidate_profiles row.
CREATE OR REPLACE FUNCTION public.touch_profile_score_on_document_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE candidate_profiles
  SET updated_at = updated_at
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_profile_score_on_document_change ON candidate_documents;
CREATE TRIGGER trg_touch_profile_score_on_document_change
  AFTER INSERT OR DELETE ON candidate_documents
  FOR EACH ROW EXECUTE FUNCTION public.touch_profile_score_on_document_change();

-- 3. Backfill: recompute every existing profile now that the CV bucket's
--    source of truth has changed, so candidates who already uploaded a CV
--    don't have to re-save their profile to see it counted.
UPDATE candidate_profiles SET updated_at = updated_at;

-- 4. Let a company read the `cv` document (only that doc_type, never
--    certificates/cover letters/other) of a candidate who applied to one of
--    their jobs -- the same "applicant, and only an applicant" scope
--    "Companies read applicant profiles" already uses on candidate_profiles,
--    via the same company_has_applicant() helper (13 Aug 2026 RLS-recursion
--    fix) so this can't reopen that recursion.
DROP POLICY IF EXISTS "Companies read applicant CVs" ON candidate_documents;
CREATE POLICY "Companies read applicant CVs" ON candidate_documents FOR SELECT USING (
  doc_type = 'cv' AND EXISTS (
    SELECT 1 FROM candidate_profiles cd
    WHERE cd.user_id = candidate_documents.user_id
      AND public.company_has_applicant(cd.id)
  )
);
