-- Add candidate <-> company messaging.
-- Run this once in Supabase Dashboard > SQL Editor.
--
-- One thread per (company, candidate) pair. Either side can start a
-- thread (from a company reaching out via candidate search/applications,
-- or a candidate replying); RLS restricts read/write to the two
-- participants plus admin.

CREATE TABLE IF NOT EXISTS message_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES company_profiles(id) ON DELETE CASCADE NOT NULL,
  candidate_id UUID REFERENCES candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (company_id, candidate_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID REFERENCES message_threads(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_thread_party(p_company_id UUID, p_candidate_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_profiles cp WHERE cp.id = p_company_id AND cp.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.candidate_profiles cd WHERE cd.id = p_candidate_id AND cd.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_thread_participant(p_thread_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.is_thread_party(mt.company_id, mt.candidate_id)
  FROM public.message_threads mt
  WHERE mt.id = p_thread_id;
$$;

CREATE POLICY "Participants read own threads" ON message_threads FOR SELECT USING (
  public.is_thread_party(company_id, candidate_id)
);
CREATE POLICY "Participants create threads" ON message_threads FOR INSERT WITH CHECK (
  public.is_thread_party(company_id, candidate_id)
);
CREATE POLICY "Participants update own threads" ON message_threads FOR UPDATE USING (
  public.is_thread_party(company_id, candidate_id)
);
CREATE POLICY "Participants read own messages" ON messages FOR SELECT USING (
  public.is_thread_participant(thread_id)
);
CREATE POLICY "Participants send messages" ON messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND public.is_thread_participant(thread_id)
);
CREATE POLICY "Participants update own messages" ON messages FOR UPDATE USING (
  public.is_thread_participant(thread_id)
);

CREATE POLICY "Admin full access message_threads" ON message_threads FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access messages" ON messages FOR ALL USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_message_threads_company ON message_threads(company_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_candidate ON message_threads(candidate_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
