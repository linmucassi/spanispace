-- Spanispace Services, step S3: service requests + guarded messaging.
-- Run this once in Supabase Dashboard > SQL Editor, AFTER
-- add-service-marketplace.sql. Safe to re-run.
--
-- Spec: docs/project-details.md §7.4-§7.6 (plan: docs/ROADMAP.md Phase 2b, S3).
--
-- Trust model:
--   * A service_request is the requester's need ("paint lounge + 2 bedrooms").
--     One request can have a conversation (service_thread) with several
--     providers, one thread per provider.
--   * Clients can READ their own requests/threads/messages through RLS, but
--     can't WRITE any of them. There are no INSERT/UPDATE policies at all.
--     Every write goes through app/api/services/* with the service role,
--     after the server has checked who the caller is and, for messages, run
--     lib/services/contactGuard.ts. That route is the real enforcement of the
--     "no contact details before payment" rule. A client-side check alone
--     could be bypassed with a direct PostgREST insert.
--   * contact_unlocked on a thread is false until a booking on it is paid
--     (S4). Only the server may set it.
--   * Kept separate from the company<->candidate message_threads/messages
--     tables, whose RLS is untouched.

CREATE TABLE IF NOT EXISTS service_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  -- Company hiring (S5) sets this. NULL for individual requesters.
  company_id UUID REFERENCES company_profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES service_categories(id) ON DELETE RESTRICT NOT NULL,
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 2000),
  province TEXT,
  city TEXT,
  -- Suburb only. The full address is shared after payment (S4), never here.
  suburb TEXT,
  preferred_start DATE,
  preferred_end DATE,
  timing_notes TEXT CHECK (char_length(timing_notes) <= 200),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'booked', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (preferred_end IS NULL OR preferred_start IS NULL OR preferred_end >= preferred_start)
);

CREATE INDEX IF NOT EXISTS idx_service_requests_requester ON service_requests(requester_user_id, status);

CREATE TABLE IF NOT EXISTS service_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES service_requests(id) ON DELETE CASCADE NOT NULL,
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE NOT NULL,
  -- Denormalised from the request so RLS checks are a single-row lookup.
  requester_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'declined', 'closed', 'booked')),
  closed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  closed_reason TEXT,
  -- Flipped to true only by the payment webhook (S4).
  contact_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  requester_last_read_at TIMESTAMPTZ,
  provider_last_read_at TIMESTAMPTZ,
  -- Email throttle for new-message notifications (lib/services/notify.ts):
  -- one email per unread batch, not one per message.
  requester_last_emailed_at TIMESTAMPTZ,
  provider_last_emailed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (request_id, provider_id)
);

-- For a database where an earlier version of this file already ran.
ALTER TABLE service_threads
  ADD COLUMN IF NOT EXISTS requester_last_emailed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS provider_last_emailed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_service_threads_provider ON service_threads(provider_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_threads_requester ON service_threads(requester_user_id, last_message_at DESC);

CREATE TABLE IF NOT EXISTS service_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID REFERENCES service_threads(id) ON DELETE CASCADE NOT NULL,
  -- NULL for system messages.
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  -- 'offer' arrives with S4.
  kind TEXT NOT NULL DEFAULT 'text' CHECK (kind IN ('text', 'system', 'offer')),
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_messages_thread ON service_messages(thread_id, created_at);

-- Blocked send attempts. The blocked text is kept for admin review (it's
-- the evidence when an account is suspended for circumvention). It never
-- reaches the other party. Admin-only.
CREATE TABLE IF NOT EXISTS contact_violations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  thread_id UUID REFERENCES service_threads(id) ON DELETE CASCADE,
  reasons TEXT[] NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_violations_user ON contact_violations(user_id, created_at);

-- ---------------------------------------------------------------------
-- Helpers (SECURITY DEFINER so policies don't recurse through each
-- other's RLS -- the lesson of fix-candidate-profile-visibility-recursion.sql)
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_service_thread_party(p_thread_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.service_threads t
    JOIN public.service_providers sp ON sp.id = t.provider_id
    WHERE t.id = p_thread_id
      AND (t.requester_user_id = auth.uid() OR sp.user_id = auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.is_provider_on_request(p_request_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.service_threads t
    JOIN public.service_providers sp ON sp.id = t.provider_id
    WHERE t.request_id = p_request_id AND sp.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------
-- RLS: read-only for parties, everything for admins, no client writes.
-- ---------------------------------------------------------------------

ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_violations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parties read service requests" ON service_requests;
CREATE POLICY "Parties read service requests" ON service_requests FOR SELECT
  USING (requester_user_id = auth.uid() OR public.is_provider_on_request(id));
DROP POLICY IF EXISTS "Admin full access service_requests" ON service_requests;
CREATE POLICY "Admin full access service_requests" ON service_requests FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Parties read service threads" ON service_threads;
CREATE POLICY "Parties read service threads" ON service_threads FOR SELECT
  USING (public.is_service_thread_party(id));
DROP POLICY IF EXISTS "Admin full access service_threads" ON service_threads;
CREATE POLICY "Admin full access service_threads" ON service_threads FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Parties read service messages" ON service_messages;
CREATE POLICY "Parties read service messages" ON service_messages FOR SELECT
  USING (public.is_service_thread_party(thread_id));
DROP POLICY IF EXISTS "Admin full access service_messages" ON service_messages;
CREATE POLICY "Admin full access service_messages" ON service_messages FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin full access contact_violations" ON contact_violations;
CREATE POLICY "Admin full access contact_violations" ON contact_violations FOR ALL USING (public.is_admin());

-- Providers need to see the requester's first name in their inbox. They
-- can't read candidate_profiles for someone who hasn't applied to them, so
-- expose just the display name, and only to the other party in a thread.
CREATE OR REPLACE FUNCTION public.service_thread_requester_name(p_thread_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN NOT public.is_service_thread_party(p_thread_id) THEN NULL
    ELSE COALESCE(
      (SELECT split_part(trim(cp.full_name), ' ', 1)
       FROM public.service_threads t
       JOIN public.candidate_profiles cp ON cp.user_id = t.requester_user_id
       WHERE t.id = p_thread_id),
      'Customer')
  END;
$$;

REVOKE ALL ON FUNCTION public.service_thread_requester_name(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.service_thread_requester_name(UUID) TO authenticated;
