-- Email notification queue + candidate profile-completeness scoring.
-- Run this once in the Supabase SQL Editor against the LIVE project.
-- Idempotent, safe to re-run.
--
-- Must run AFTER add-messaging.sql (this file's new-message trigger reads
-- message_threads/messages). Safe to run before or after add-informal-jobs.sql
-- (adds candidate_profiles.professional_summary) — the scoring trigger below
-- reads that column dynamically via to_jsonb(NEW) so a missing column reads
-- as NULL instead of failing the whole trigger.
--
-- What it does:
--   1. email_notifications — a generic outbox. Rows are inserted either
--      instantly by a DB trigger (application status change, new message,
--      event registration) or periodically by a scripts/run-*.ts job (expiry
--      alerts, weekly digest, profile nudges). scripts/run-notification-sender.ts
--      drains it on an hourly GitHub Actions cron and sends via Resend
--      (lib/email.ts). Periodic producers dedupe via `dedupe_key` so a script
--      that reruns (or a cron that overlaps) never double-sends.
--   2. candidate_profiles.profile_score, which existed but was never written
--      by anything, is now kept current by a BEFORE INSERT/UPDATE trigger.
-- =====================================================================

-- 1. Notification outbox
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'application_status', 'new_message', 'event_registration',
    'expiry_alert_7d', 'expiry_alert_1d', 'weekly_digest', 'profile_nudge'
  )),
  dedupe_key TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- Lets periodic producers `INSERT ... ON CONFLICT (user_id, type, dedupe_key)
-- DO NOTHING`. Only applies when dedupe_key is set — event-triggered rows
-- (application_status/new_message/event_registration) leave it null and are
-- never deduped against each other, since every one of those is a distinct
-- real event.
CREATE UNIQUE INDEX IF NOT EXISTS email_notifications_dedupe_idx
  ON email_notifications (user_id, type, dedupe_key)
  WHERE dedupe_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS email_notifications_pending_idx
  ON email_notifications (created_at) WHERE status = 'pending';

ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access email_notifications" ON email_notifications;
CREATE POLICY "Admin full access email_notifications" ON email_notifications FOR ALL USING (is_admin());
-- No policy for anon/authenticated: writers are DB triggers (run as the
-- table owner) and scripts/*.ts (service-role client, bypasses RLS). Nothing
-- in the browser ever needs to read or write this table directly.

-- 2. Application status change -> notify the applicant
CREATE OR REPLACE FUNCTION public.notify_application_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient_email TEXT;
  v_recipient_user UUID;
  v_job_title TEXT;
  v_company TEXT;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  -- Applications can be submitted by a guest (candidate_id nullable); the
  -- email typed on the application itself is the reliable address, falling
  -- back to the account email for portal-submitted applications.
  SELECT COALESCE(NEW.email, u.email), u.id, j.title, COALESCE(cp.company_name, j.poster_name, 'the employer')
  INTO v_recipient_email, v_recipient_user, v_job_title, v_company
  FROM jobs j
  LEFT JOIN company_profiles cp ON cp.id = j.company_id
  LEFT JOIN candidate_profiles candp ON candp.id = NEW.candidate_id
  LEFT JOIN users u ON u.id = candp.user_id
  WHERE j.id = NEW.job_id;

  IF v_recipient_email IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO email_notifications (user_id, recipient_email, type, payload)
  VALUES (v_recipient_user, v_recipient_email, 'application_status',
    jsonb_build_object('jobTitle', v_job_title, 'company', v_company, 'status', NEW.status));

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_application_status ON applications;
CREATE TRIGGER trg_notify_application_status
  AFTER UPDATE OF status ON applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_application_status();

-- 3. New message -> notify whichever party didn't send it
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_user UUID;
  v_candidate_user UUID;
  v_recipient_id UUID;
  v_recipient_email TEXT;
  v_sender_name TEXT;
BEGIN
  SELECT cp.user_id, candp.user_id
  INTO v_company_user, v_candidate_user
  FROM message_threads mt
  JOIN company_profiles cp ON cp.id = mt.company_id
  JOIN candidate_profiles candp ON candp.id = mt.candidate_id
  WHERE mt.id = NEW.thread_id;

  v_recipient_id := CASE WHEN NEW.sender_id = v_company_user THEN v_candidate_user ELSE v_company_user END;

  SELECT email INTO v_recipient_email FROM users WHERE id = v_recipient_id;
  IF v_recipient_email IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(cp.company_name, candp.full_name, 'Someone')
  INTO v_sender_name
  FROM users u
  LEFT JOIN company_profiles cp ON cp.user_id = u.id
  LEFT JOIN candidate_profiles candp ON candp.user_id = u.id
  WHERE u.id = NEW.sender_id;

  INSERT INTO email_notifications (user_id, recipient_email, type, payload)
  VALUES (v_recipient_id, v_recipient_email, 'new_message',
    jsonb_build_object('senderName', v_sender_name, 'preview', left(NEW.body, 140)));

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_message ON messages;
CREATE TRIGGER trg_notify_new_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

-- 4. Event registration -> confirmation to the registrant
CREATE OR REPLACE FUNCTION public.notify_event_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient_email TEXT;
  v_event_title TEXT;
  v_event_date TEXT;
BEGIN
  IF NEW.status <> 'registered' OR NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT email INTO v_recipient_email FROM users WHERE id = NEW.user_id;
  IF v_recipient_email IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT title, to_char(start_date, 'DD Mon YYYY') INTO v_event_title, v_event_date
  FROM events WHERE id = NEW.event_id;

  INSERT INTO email_notifications (user_id, recipient_email, type, payload)
  VALUES (NEW.user_id, v_recipient_email, 'event_registration',
    jsonb_build_object('eventTitle', v_event_title, 'eventDate', v_event_date));

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_event_registration ON event_registrations;
CREATE TRIGGER trg_notify_event_registration
  AFTER INSERT ON event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.notify_event_registration();

-- 5. Candidate profile completeness score (was declared in schema.sql,
-- defaulted to 0, and nothing ever wrote to it — company search has been
-- sorting/badging on a column that was always zero).
CREATE OR REPLACE FUNCTION public.compute_profile_score()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_score INT := 0;
  -- professional_summary is added by add-informal-jobs.sql, which may not
  -- have run yet on this database. NEW.professional_summary would fail to
  -- compile ("record NEW has no field...") if the column doesn't exist;
  -- reading it via to_jsonb(NEW) resolves at runtime instead, so a missing
  -- column just reads as NULL rather than breaking every profile save.
  v_professional_summary TEXT := to_jsonb(NEW) ->> 'professional_summary';
BEGIN
  IF NEW.full_name IS NOT NULL AND length(trim(NEW.full_name)) > 0 THEN v_score := v_score + 15; END IF;
  IF NEW.phone IS NOT NULL AND length(trim(NEW.phone)) > 0 THEN v_score := v_score + 10; END IF;
  IF NEW.location IS NOT NULL AND length(trim(NEW.location)) > 0 THEN v_score := v_score + 10; END IF;
  IF NEW.skills IS NOT NULL AND array_length(NEW.skills, 1) > 0 THEN v_score := v_score + 20; END IF;
  IF NEW.cv_url IS NOT NULL AND length(trim(NEW.cv_url)) > 0 THEN v_score := v_score + 25; END IF;
  IF NEW.portfolio_url IS NOT NULL AND length(trim(NEW.portfolio_url)) > 0 THEN v_score := v_score + 10; END IF;
  IF v_professional_summary IS NOT NULL AND length(trim(v_professional_summary)) > 0 THEN v_score := v_score + 10; END IF;

  NEW.profile_score := v_score;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_compute_profile_score ON candidate_profiles;
CREATE TRIGGER trg_compute_profile_score
  BEFORE INSERT OR UPDATE ON candidate_profiles
  FOR EACH ROW EXECUTE FUNCTION public.compute_profile_score();

-- Backfill existing rows so scores aren't stuck at 0 until the next edit.
UPDATE candidate_profiles SET updated_at = updated_at;
