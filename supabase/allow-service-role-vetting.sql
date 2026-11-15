-- 15 Nov 2026: let the scraper (service role) approve scraped jobs.
--
-- lock_vetted_status() silently keeps the old vetted_status on UPDATE unless
-- is_admin(). The service role has no auth.uid(), so is_admin() is false and
-- the daily scraper's "approve every verified scraped company" step was a
-- no-op. Only the service role key (server-side, never shipped to browsers)
-- gets the extra pass; companies and candidates are still locked out.
--
-- Same function body as fix-security-hardening.sql section 4, plus the
-- service_role check. Safe to re-run. Triggers don't need recreating.

CREATE OR REPLACE FUNCTION public.lock_vetted_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_admin()
     AND coalesce(auth.role(), '') <> 'service_role'
     AND NEW.vetted_status IS DISTINCT FROM OLD.vetted_status THEN
    NEW.vetted_status := OLD.vetted_status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
