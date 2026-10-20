-- Company <-> candidate messaging: who sent what, and team access.
-- Run once in Supabase Dashboard > SQL Editor. Safe to re-run.
--
-- Problems this fixes (Linda, 20 Oct 2026):
--   1. Candidates saw "Company" instead of the company's name. They have no
--      RLS read on company_profiles, so the thread's company join came back
--      null and the page fell back to "Company". Companies had the same
--      problem with candidate names for anyone who hadn't applied to them.
--   2. Company team members (company_members) had no access to their
--      company's threads at all. is_thread_party() only recognised the
--      company OWNER's login, so team members saw an empty inbox.
--   3. Nothing said which team member wrote a message.
--
-- Rules:
--   * The owner login (company_profiles.user_id) speaks as the company:
--     "Spanispace Curated".
--   * A team member speaks as the company plus their first name to the
--     candidate ("Spanispace Curated · Sipho"), and by full name to their
--     own colleagues, so the team can see who said what.
--   * The candidate is shown by name to the company.
--   * Names only. These functions never return emails, phone numbers or ids
--     the caller couldn't already see, and only for threads the caller is in.

-- ---------------------------------------------------------------------
-- 1. Team access. Every member can read their company's threads; viewers
--    are read-only, everyone else can send.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_thread_party(p_company_id UUID, p_candidate_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_profiles cp WHERE cp.id = p_company_id AND cp.user_id = auth.uid()
  ) OR public.company_is_member(p_company_id)
  OR EXISTS (
    SELECT 1 FROM public.candidate_profiles cd WHERE cd.id = p_candidate_id AND cd.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_send_in_thread(p_thread_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.message_threads mt
    WHERE mt.id = p_thread_id
      AND (
        EXISTS (SELECT 1 FROM public.company_profiles cp WHERE cp.id = mt.company_id AND cp.user_id = auth.uid())
        OR public.company_can_operate(mt.company_id)
        OR EXISTS (SELECT 1 FROM public.candidate_profiles cd WHERE cd.id = mt.candidate_id AND cd.user_id = auth.uid())
      )
  );
$$;

DROP POLICY IF EXISTS "Participants send messages" ON messages;
CREATE POLICY "Participants send messages" ON messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND public.can_send_in_thread(thread_id)
);

-- ---------------------------------------------------------------------
-- 2. Thread titles: company name for the candidate, candidate name for
--    the company. Only rows for threads the caller is part of.
-- ---------------------------------------------------------------------
-- Return columns changed (pictures added, 20 Oct 2026), and CREATE OR
-- REPLACE can't change them, so drop first. Nothing else depends on these.
DROP FUNCTION IF EXISTS public.message_thread_names(UUID[]);
DROP FUNCTION IF EXISTS public.message_sender_labels(UUID);

CREATE OR REPLACE FUNCTION public.message_thread_names(p_thread_ids UUID[])
RETURNS TABLE (thread_id UUID, company_name TEXT, company_logo_url TEXT, candidate_name TEXT, candidate_avatar_url TEXT)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT mt.id, cp.company_name, cp.logo_url, cd.full_name, cd.avatar_url
  FROM public.message_threads mt
  JOIN public.company_profiles cp ON cp.id = mt.company_id
  JOIN public.candidate_profiles cd ON cd.id = mt.candidate_id
  WHERE mt.id = ANY (p_thread_ids)
    AND public.is_thread_participant(mt.id);
$$;

-- ---------------------------------------------------------------------
-- 3. Per-sender labels for one thread, worded for whoever is asking.
--    side = which side of the conversation the sender is on.
--    avatar_url = the picture to show: the company logo whenever the
--    candidate is looking at the company side, the person's own avatar
--    otherwise.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.message_sender_labels(p_thread_id UUID)
RETURNS TABLE (sender_id UUID, side TEXT, label TEXT, avatar_url TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_company_name TEXT;
  v_owner_id UUID;
  v_candidate_user UUID;
  v_candidate_name TEXT;
  v_candidate_avatar TEXT;
  v_company_logo TEXT;
  v_viewer_is_candidate BOOLEAN;
BEGIN
  IF NOT public.is_thread_participant(p_thread_id) THEN
    RETURN;
  END IF;

  SELECT mt.company_id, cp.company_name, cp.logo_url, cp.user_id, cd.user_id, cd.full_name, cd.avatar_url
  INTO v_company_id, v_company_name, v_company_logo, v_owner_id, v_candidate_user, v_candidate_name, v_candidate_avatar
  FROM public.message_threads mt
  JOIN public.company_profiles cp ON cp.id = mt.company_id
  JOIN public.candidate_profiles cd ON cd.id = mt.candidate_id
  WHERE mt.id = p_thread_id;

  v_viewer_is_candidate := (auth.uid() = v_candidate_user);

  RETURN QUERY
  SELECT
    s.sender_id,
    CASE WHEN s.sender_id = v_candidate_user THEN 'candidate' ELSE 'company' END,
    CASE
      WHEN s.sender_id = v_candidate_user THEN COALESCE(NULLIF(trim(v_candidate_name), ''), 'Candidate')
      WHEN s.sender_id = v_owner_id THEN v_company_name
      WHEN cm.user_id IS NOT NULL THEN
        CASE
          WHEN v_viewer_is_candidate THEN
            v_company_name || COALESCE(' · ' || NULLIF(split_part(trim(mp.full_name), ' ', 1), ''), '')
          ELSE COALESCE(NULLIF(trim(mp.full_name), ''), split_part(u.email, '@', 1), 'Team member')
        END
      -- Someone who has since left the team.
      WHEN v_viewer_is_candidate THEN v_company_name
      ELSE 'Former team member'
    END,
    CASE
      WHEN s.sender_id = v_candidate_user THEN v_candidate_avatar
      WHEN s.sender_id = v_owner_id OR v_viewer_is_candidate THEN v_company_logo
      ELSE mp.avatar_url
    END
  FROM (SELECT DISTINCT m.sender_id FROM public.messages m WHERE m.thread_id = p_thread_id) s
  LEFT JOIN public.company_members cm ON cm.company_id = v_company_id AND cm.user_id = s.sender_id
  LEFT JOIN public.candidate_profiles mp ON mp.user_id = s.sender_id
  LEFT JOIN public.users u ON u.id = s.sender_id;
END;
$$;

REVOKE ALL ON FUNCTION public.message_thread_names(UUID[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.message_sender_labels(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.message_thread_names(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.message_sender_labels(UUID) TO authenticated;
