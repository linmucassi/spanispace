-- Direct Talent Sourcing + Candidate Document Verification. Run ONCE in the
-- Supabase SQL Editor against the LIVE project. Idempotent.
--
-- Context: companies could previously only see candidates who had already
-- applied to one of their jobs (company_has_applicant(), a deliberate S3
-- hardening pass in fix-security-hardening.sql, not an oversight). This adds
-- an opt-in talent pool (candidate-controlled, independent of verification),
-- an invite mechanism, and a document-verification workflow that finally
-- wires up candidate_profiles.verified, which has existed and been displayed
-- since the base schema but nothing has ever set it to true.

-- ---------------------------------------------------------------------
-- 1. Opt-in talent pool visibility
-- ---------------------------------------------------------------------
ALTER TABLE candidate_profiles
  ADD COLUMN IF NOT EXISTS open_to_offers BOOLEAN NOT NULL DEFAULT FALSE;

-- Additive: Postgres OR's multiple permissive SELECT policies together, so
-- this adds to (never replaces) "Companies read applicant profiles". A
-- company still can't see anyone who hasn't either applied to one of their
-- jobs OR opted in here.
DROP POLICY IF EXISTS "Companies read opted-in candidates" ON candidate_profiles;
CREATE POLICY "Companies read opted-in candidates" ON candidate_profiles
  FOR SELECT USING (open_to_offers = true);

-- ---------------------------------------------------------------------
-- 2. Invites: a company inviting a specific candidate to apply for a
--    specific job. Deliberately separate from `applications` -- an invite
--    is a signal, not an application; accepting one routes the candidate
--    through the normal /jobs/[id]/apply flow (respecting that job's
--    on_platform vs redirect apply_mode), so `applications` stays the
--    single source of truth for the hiring pipeline.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES company_profiles(id) ON DELETE CASCADE NOT NULL,
  candidate_id UUID REFERENCES candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE (job_id, candidate_id)
);
ALTER TABLE job_invites ENABLE ROW LEVEL SECURITY;

-- Company can only invite someone it's already allowed to see (applicant OR
-- opted-in) -- reuses company_has_applicant() so this can't become a second
-- way to enumerate arbitrary candidates.
DROP POLICY IF EXISTS "Companies manage own invites" ON job_invites;
CREATE POLICY "Companies manage own invites" ON job_invites FOR ALL USING (
  EXISTS (SELECT 1 FROM company_profiles cp WHERE cp.id = job_invites.company_id AND cp.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM company_profiles cp WHERE cp.id = job_invites.company_id AND cp.user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM candidate_profiles c WHERE c.id = job_invites.candidate_id
    AND (c.open_to_offers = true OR public.company_has_applicant(c.id))
  )
);

DROP POLICY IF EXISTS "Candidates read own invites" ON job_invites;
CREATE POLICY "Candidates read own invites" ON job_invites FOR SELECT USING (
  EXISTS (SELECT 1 FROM candidate_profiles c WHERE c.id = job_invites.candidate_id AND c.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Candidates respond to own invites" ON job_invites;
CREATE POLICY "Candidates respond to own invites" ON job_invites FOR UPDATE USING (
  EXISTS (SELECT 1 FROM candidate_profiles c WHERE c.id = job_invites.candidate_id AND c.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admin full access job_invites" ON job_invites;
CREATE POLICY "Admin full access job_invites" ON job_invites FOR ALL USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_job_invites_candidate ON job_invites(candidate_id);
CREATE INDEX IF NOT EXISTS idx_job_invites_company ON job_invites(company_id);

-- ---------------------------------------------------------------------
-- 3. Document verification -- new doc types, admin-only review.
--    verification_status/note are nullable and not defaulted -- only
--    meaningful for the 3 new doc types below, which the app sets to
--    'pending' explicitly on upload. cv/certificate/etc. stay NULL, so
--    nothing renders a stray verification badge on unrelated docs.
-- ---------------------------------------------------------------------
ALTER TABLE candidate_documents
  DROP CONSTRAINT IF EXISTS candidate_documents_doc_type_check;
ALTER TABLE candidate_documents
  ADD CONSTRAINT candidate_documents_doc_type_check CHECK (
    doc_type IN ('cv', 'certificate', 'cover_letter', 'motivational_letter', 'other',
                 'id_document', 'qualification', 'transcript')
  );
ALTER TABLE candidate_documents
  ADD COLUMN IF NOT EXISTS verification_status TEXT
    CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS verification_note TEXT;

-- candidate_documents currently has only the owner-only policy plus
-- fix-cv-completeness.sql's cv-only company policy -- no admin blanket
-- access exists yet, needed here for the review queue.
DROP POLICY IF EXISTS "Admin full access candidate_documents" ON candidate_documents;
CREATE POLICY "Admin full access candidate_documents" ON candidate_documents FOR ALL USING (public.is_admin());

-- candidate_profiles.verified already exists (base schema, DEFAULT FALSE) --
-- no column change needed. It's flipped by an explicit admin action in
-- app/admin/candidate-verification, matching how every other vetted_status
-- workflow in this app (jobs/trainings/events/learnerships) is a deliberate
-- click, not auto-derived from document counts.
