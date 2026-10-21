-- Spanispace Services, step S1: service providers, enrolment, verification.
-- Run this once in Supabase Dashboard > SQL Editor. Safe to re-run.
--
-- Spec: docs/project-details.md §7 (plan: docs/ROADMAP.md Phase 2b, S1).
--
-- Trust model, same shape as candidate verification
-- (add-talent-sourcing-and-verification.sql):
--   * A provider is a CAPABILITY on an existing candidate account, not a new
--     users.role -- one service_providers row per user, created explicitly
--     by POST /api/services/provider after signup. handle_new_user() is
--     deliberately untouched (it caused a production outage on 22 Aug 2026).
--   * Providers write their own enrolment, but every admin-owned column
--     (verification outcome, police clearance dates, ratings) is protected by
--     a BEFORE trigger, mirroring the users.role guard in
--     add-roles-invites-and-calendar.sql. RLS alone can't restrict columns.
--   * Verification documents (ID, selfie, SAPS police clearance, proof of
--     address, trade certificates) live in a PRIVATE bucket,
--     'provider-documents', NOT the public 'documents' bucket. Police
--     clearance is POPIA s26 special personal information. Admins view files
--     through short-lived signed URLs only.
--   * There is NO public/anon read policy on service_providers yet. A row
--     holds date_of_birth and review notes, and RLS is row-level, not
--     column-level. S2 (public search) adds a safe-columns view instead.

-- =====================================================================
-- PART A: Categories and their pricing units
-- =====================================================================

CREATE TABLE IF NOT EXISTS service_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  -- Regulated trades: a provider's listing for this category only goes live
  -- once an admin approves a trade certificate for it.
  requires_qualification BOOLEAN NOT NULL DEFAULT FALSE,
  qualification_hint TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_category_units (
  category_id UUID REFERENCES service_categories(id) ON DELETE CASCADE NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('hour', 'day', 'job', 'm2', 'room', 'load', 'kg', 'item', 'visit', 'callout', 'point', 'metre')),
  PRIMARY KEY (category_id, unit)
);

ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_category_units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads service categories" ON service_categories;
CREATE POLICY "Anyone reads service categories" ON service_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin full access service_categories" ON service_categories;
CREATE POLICY "Admin full access service_categories" ON service_categories FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Anyone reads service category units" ON service_category_units;
CREATE POLICY "Anyone reads service category units" ON service_category_units FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin full access service_category_units" ON service_category_units;
CREATE POLICY "Admin full access service_category_units" ON service_category_units FOR ALL USING (public.is_admin());

-- All categories launch together (Linda, 20 Oct 2026).
INSERT INTO service_categories (slug, name, requires_qualification, qualification_hint, sort_order) VALUES
  ('cleaning',          'Cleaning',                    FALSE, NULL, 10),
  ('laundry',           'Laundry & ironing',           FALSE, NULL, 20),
  ('painting',          'Painting',                    FALSE, NULL, 30),
  ('plumbing',          'Plumbing',                    TRUE,  'PIRB registration card, or a plumbing trade certificate', 40),
  ('electrical',        'Electrical',                  TRUE,  'Wireman''s licence / Department of Employment and Labour electrical registration', 50),
  ('gas',               'Gas installation & repair',   TRUE,  'SAQCC Gas registration card', 60),
  ('solar',             'Solar & backup power',        TRUE,  'Wireman''s licence, or PV GreenCard certification', 70),
  ('gardening',         'Gardening & landscaping',     FALSE, NULL, 80),
  ('handyman',          'Handyman & small repairs',    FALSE, NULL, 90),
  ('carpentry',         'Carpentry & furniture',       FALSE, NULL, 100),
  ('tiling',            'Tiling',                      FALSE, NULL, 110),
  ('building',          'Building, brickwork & paving', FALSE, NULL, 120),
  ('roofing',           'Roofing & waterproofing',     FALSE, NULL, 130),
  ('welding',           'Welding & burglar bars',      FALSE, NULL, 140),
  ('appliance-repair',  'Appliance repair',            FALSE, NULL, 150),
  ('moving',            'Moving & delivery help',      FALSE, NULL, 160),
  ('pool',              'Pool cleaning',               FALSE, NULL, 170),
  ('car-wash',          'Car wash & valet',            FALSE, NULL, 180),
  ('window-cleaning',   'Window cleaning',             FALSE, NULL, 190),
  ('pest-control',      'Pest control',                TRUE,  'Pest control operator registration (Act 36 of 1947)', 200),
  ('childminding',      'Childminding & babysitting',  FALSE, NULL, 210),
  ('elderly-care',      'Elderly & home care',         FALSE, NULL, 220),
  ('cooking',           'Cooking & catering',          FALSE, NULL, 230),
  ('sewing',            'Sewing & alterations',        FALSE, NULL, 240),
  ('hair-beauty',       'Hair & beauty (home visits)', FALSE, NULL, 250),
  ('tech-help',         'Phone, computer & TV help',   FALSE, NULL, 260),
  ('dstv-install',      'DSTV & aerial installation',  FALSE, NULL, 270),
  ('security',          'Security guarding',           TRUE,  'PSIRA registration certificate', 280),
  ('tutoring',          'Tutoring & lessons',          FALSE, NULL, 290)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_category_units (category_id, unit)
SELECT c.id, u.unit
FROM service_categories c
JOIN (VALUES
  ('cleaning', 'hour'), ('cleaning', 'room'), ('cleaning', 'day'), ('cleaning', 'job'),
  ('laundry', 'load'), ('laundry', 'kg'), ('laundry', 'item'), ('laundry', 'hour'),
  ('painting', 'm2'), ('painting', 'room'), ('painting', 'day'), ('painting', 'job'),
  ('plumbing', 'callout'), ('plumbing', 'hour'), ('plumbing', 'job'),
  ('electrical', 'callout'), ('electrical', 'hour'), ('electrical', 'point'), ('electrical', 'job'),
  ('gas', 'callout'), ('gas', 'hour'), ('gas', 'job'),
  ('solar', 'job'), ('solar', 'day'), ('solar', 'callout'),
  ('gardening', 'hour'), ('gardening', 'visit'), ('gardening', 'm2'), ('gardening', 'day'),
  ('handyman', 'hour'), ('handyman', 'callout'), ('handyman', 'job'),
  ('carpentry', 'hour'), ('carpentry', 'item'), ('carpentry', 'job'),
  ('tiling', 'm2'), ('tiling', 'day'), ('tiling', 'job'),
  ('building', 'm2'), ('building', 'day'), ('building', 'job'), ('building', 'metre'),
  ('roofing', 'm2'), ('roofing', 'day'), ('roofing', 'job'),
  ('welding', 'metre'), ('welding', 'item'), ('welding', 'job'), ('welding', 'hour'),
  ('appliance-repair', 'callout'), ('appliance-repair', 'item'), ('appliance-repair', 'hour'),
  ('moving', 'hour'), ('moving', 'job'), ('moving', 'day'),
  ('pool', 'visit'), ('pool', 'job'),
  ('car-wash', 'item'), ('car-wash', 'job'),
  ('window-cleaning', 'item'), ('window-cleaning', 'hour'), ('window-cleaning', 'job'),
  ('pest-control', 'room'), ('pest-control', 'job'), ('pest-control', 'callout'),
  ('childminding', 'hour'), ('childminding', 'day'),
  ('elderly-care', 'hour'), ('elderly-care', 'day'),
  ('cooking', 'hour'), ('cooking', 'day'), ('cooking', 'job'),
  ('sewing', 'item'), ('sewing', 'hour'),
  ('hair-beauty', 'item'), ('hair-beauty', 'visit'),
  ('tech-help', 'hour'), ('tech-help', 'callout'), ('tech-help', 'job'),
  ('dstv-install', 'job'), ('dstv-install', 'callout'),
  ('security', 'hour'), ('security', 'day'),
  ('tutoring', 'hour'), ('tutoring', 'visit')
) AS u(slug, unit) ON u.slug = c.slug
ON CONFLICT DO NOTHING;

-- =====================================================================
-- PART B: Service providers
-- =====================================================================

CREATE TABLE IF NOT EXISTS service_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  candidate_profile_id UUID REFERENCES candidate_profiles(id) ON DELETE SET NULL,
  headline TEXT CHECK (char_length(headline) <= 120),
  bio TEXT CHECK (char_length(bio) <= 2000),
  province TEXT,
  city TEXT,
  suburb TEXT,
  travel_radius_km INT CHECK (travel_radius_km BETWEEN 0 AND 500),
  -- { "mon": true, ..., "sun": false, "notes": "weekdays after 8am" }
  availability JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- How the SERVICE PRICE is paid. The R10 Spanispace fee is always online.
  -- 'online' only takes effect once payouts exist (S4).
  payment_methods TEXT NOT NULL DEFAULT 'cash' CHECK (payment_methods IN ('cash', 'online', 'cash_or_online')),
  -- Data minimisation: the SA ID number itself is never stored. The server
  -- derives the date of birth from it (18+ check) and discards it; the admin
  -- compares against the uploaded document.
  id_kind TEXT CHECK (id_kind IN ('sa_id', 'passport')),
  date_of_birth DATE,
  -- draft -> pending (provider submits) -> verified | rejected (admin);
  -- verified -> suspended (admin); rejected -> pending (provider resubmits).
  verification_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (verification_status IN ('draft', 'pending', 'verified', 'rejected', 'suspended')),
  verification_note TEXT,
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  -- Valid 12 months from issue (Linda, 20 Oct 2026). Set by the admin from
  -- the reviewed certificate.
  police_clearance_issued_at DATE,
  police_clearance_expires_at DATE,
  terms_version TEXT,
  terms_accepted_at TIMESTAMPTZ,
  popia_consent_at TIMESTAMPTZ,
  listing_active BOOLEAN NOT NULL DEFAULT FALSE,
  rating_avg NUMERIC(3, 2),
  jobs_completed INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_providers_status ON service_providers(verification_status);

CREATE TABLE IF NOT EXISTS provider_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES service_categories(id) ON DELETE RESTRICT NOT NULL,
  years_experience INT CHECK (years_experience BETWEEN 0 AND 60),
  description TEXT CHECK (char_length(description) <= 1000),
  -- NULL when the category needs no qualification. Otherwise pending until
  -- an admin approves the matching trade certificate.
  qualification_status TEXT CHECK (qualification_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (provider_id, category_id)
);

CREATE TABLE IF NOT EXISTS provider_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_service_id UUID REFERENCES provider_services(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL CHECK (char_length(label) BETWEEN 1 AND 80),
  unit TEXT NOT NULL CHECK (unit IN ('hour', 'day', 'job', 'm2', 'room', 'load', 'kg', 'item', 'visit', 'callout', 'point', 'metre')),
  price_cents INT NOT NULL CHECK (price_cents > 0 AND price_cents <= 100000000),
  minimum_charge_cents INT CHECK (minimum_charge_cents IS NULL OR minimum_charge_cents > 0),
  notes TEXT CHECK (char_length(notes) <= 200),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_services_provider ON provider_services(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_rates_service ON provider_rates(provider_service_id);

CREATE TABLE IF NOT EXISTS provider_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('id_document', 'passport', 'work_permit', 'selfie', 'police_clearance', 'proof_of_address', 'trade_certificate')),
  -- For trade certificates: which category it supports.
  category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL,
  -- Object path inside the private 'provider-documents' bucket. Never a
  -- public URL.
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_kb INT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  review_note TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_documents_provider ON provider_documents(provider_id);

CREATE TABLE IF NOT EXISTS provider_strikes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE NOT NULL,
  -- FK to service_bookings is added in the S4 migration, once that table exists.
  booking_id UUID,
  reason TEXT NOT NULL CHECK (reason IN ('provider_cancel', 'no_show', 'conduct', 'contact_violation', 'other')),
  note TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  removed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_strikes_provider ON provider_strikes(provider_id, created_at);

-- =====================================================================
-- PART C: Helpers + column guards
-- =====================================================================

-- True when the provider row belongs to the caller. SECURITY DEFINER so the
-- child-table policies below don't re-enter service_providers' own RLS.
CREATE OR REPLACE FUNCTION public.owns_service_provider(p_provider_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.service_providers
    WHERE id = p_provider_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_provider_service(p_provider_service_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.provider_services ps
    JOIN public.service_providers sp ON sp.id = ps.provider_id
    WHERE ps.id = p_provider_service_id AND sp.user_id = auth.uid()
  );
$$;

-- Guards admin-owned columns on service_providers. auth.uid() IS NULL means
-- the service role (scripts/cron), which is trusted, same convention as
-- the users.role guard.
CREATE OR REPLACE FUNCTION public.guard_service_provider()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  acting_admin BOOLEAN := auth.uid() IS NULL OR public.is_admin();
BEGIN
  NEW.updated_at := NOW();

  IF NOT acting_admin THEN
    IF TG_OP = 'INSERT' THEN
      NEW.verification_status := 'draft';
      NEW.verification_note := NULL;
      NEW.submitted_at := NULL;
      NEW.verified_at := NULL;
      NEW.verified_by := NULL;
      NEW.police_clearance_issued_at := NULL;
      NEW.police_clearance_expires_at := NULL;
      NEW.listing_active := FALSE;
      NEW.rating_avg := NULL;
      NEW.jobs_completed := 0;
    ELSE
      NEW.user_id := OLD.user_id;
      NEW.verification_note := OLD.verification_note;
      NEW.verified_at := OLD.verified_at;
      NEW.verified_by := OLD.verified_by;
      NEW.police_clearance_issued_at := OLD.police_clearance_issued_at;
      NEW.police_clearance_expires_at := OLD.police_clearance_expires_at;
      NEW.rating_avg := OLD.rating_avg;
      NEW.jobs_completed := OLD.jobs_completed;

      -- The only status change a provider may make is submitting for review.
      IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
        IF NEW.verification_status = 'pending' AND OLD.verification_status IN ('draft', 'rejected') THEN
          IF NEW.terms_accepted_at IS NULL OR NEW.popia_consent_at IS NULL THEN
            RAISE EXCEPTION 'You must accept the Service Provider Agreement and consent to verification before submitting.';
          END IF;
          IF NEW.date_of_birth IS NULL OR NEW.date_of_birth > (CURRENT_DATE - INTERVAL '18 years') THEN
            RAISE EXCEPTION 'Service providers must be 18 or older.';
          END IF;
          NEW.submitted_at := NOW();
        ELSE
          NEW.verification_status := OLD.verification_status;
        END IF;
      END IF;
    END IF;
  ELSIF TG_OP = 'UPDATE' AND NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
    IF NEW.verification_status = 'verified' THEN
      NEW.verified_at := COALESCE(NEW.verified_at, NOW());
      NEW.verified_by := COALESCE(NEW.verified_by, auth.uid());
    END IF;
  END IF;

  -- Applies to everyone, admins included: granting the verified badge (or
  -- changing its clearance dates) requires an in-date police clearance on
  -- record. Only checked on that transition, so a provider whose clearance
  -- has since lapsed can still edit their profile -- the listing check
  -- below keeps them out of search.
  IF NEW.verification_status = 'verified'
     AND (TG_OP = 'INSERT'
          OR OLD.verification_status IS DISTINCT FROM 'verified'
          OR NEW.police_clearance_expires_at IS DISTINCT FROM OLD.police_clearance_expires_at)
     AND (NEW.police_clearance_expires_at IS NULL OR NEW.police_clearance_expires_at < CURRENT_DATE) THEN
    RAISE EXCEPTION 'Cannot verify: record an in-date police clearance first.';
  END IF;

  -- A listing can only be live while verified and in date.
  IF NEW.listing_active AND (
       NEW.verification_status <> 'verified'
       OR NEW.police_clearance_expires_at IS NULL
       OR NEW.police_clearance_expires_at < CURRENT_DATE
     ) THEN
    IF TG_OP = 'UPDATE' AND NOT OLD.listing_active AND NOT acting_admin THEN
      RAISE EXCEPTION 'Your listing can be switched on once your verification is approved.';
    END IF;
    NEW.listing_active := FALSE;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_service_provider ON service_providers;
CREATE TRIGGER trg_guard_service_provider
  BEFORE INSERT OR UPDATE ON service_providers
  FOR EACH ROW EXECUTE FUNCTION public.guard_service_provider();

-- Providers can't approve their own trade qualifications.
CREATE OR REPLACE FUNCTION public.guard_provider_service()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  needs_qualification BOOLEAN;
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    NEW.provider_id := OLD.provider_id;
    NEW.category_id := OLD.category_id;
    NEW.qualification_status := OLD.qualification_status;
    RETURN NEW;
  END IF;

  SELECT requires_qualification INTO needs_qualification
  FROM public.service_categories WHERE id = NEW.category_id;
  NEW.qualification_status := CASE WHEN needs_qualification THEN 'pending' ELSE NULL END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_provider_service ON provider_services;
CREATE TRIGGER trg_guard_provider_service
  BEFORE INSERT OR UPDATE ON provider_services
  FOR EACH ROW EXECUTE FUNCTION public.guard_provider_service();

-- Rate units must be ones the category allows.
CREATE OR REPLACE FUNCTION public.check_provider_rate_unit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.provider_services ps
    JOIN public.service_category_units u ON u.category_id = ps.category_id
    WHERE ps.id = NEW.provider_service_id AND u.unit = NEW.unit
  ) THEN
    RAISE EXCEPTION 'Unit "%" is not available for this service category.', NEW.unit;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_provider_rate_unit ON provider_rates;
CREATE TRIGGER trg_check_provider_rate_unit
  BEFORE INSERT OR UPDATE ON provider_rates
  FOR EACH ROW EXECUTE FUNCTION public.check_provider_rate_unit();

-- Providers upload documents but never review them.
CREATE OR REPLACE FUNCTION public.guard_provider_document()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
      NEW.reviewed_at := NOW();
      NEW.reviewed_by := COALESCE(NEW.reviewed_by, auth.uid());
    END IF;
    RETURN NEW;
  END IF;
  NEW.user_id := auth.uid();
  NEW.status := 'pending';
  NEW.review_note := NULL;
  NEW.reviewed_by := NULL;
  NEW.reviewed_at := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_provider_document ON provider_documents;
CREATE TRIGGER trg_guard_provider_document
  BEFORE INSERT OR UPDATE ON provider_documents
  FOR EACH ROW EXECUTE FUNCTION public.guard_provider_document();

-- =====================================================================
-- PART D: RLS
-- =====================================================================

ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_strikes ENABLE ROW LEVEL SECURITY;

-- service_providers: own row + admin. No DELETE for providers (keeps the
-- verification audit trail); no anon/public read until S2's safe view.
DROP POLICY IF EXISTS "Providers read own row" ON service_providers;
CREATE POLICY "Providers read own row" ON service_providers FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Providers create own row" ON service_providers;
CREATE POLICY "Providers create own row" ON service_providers FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Providers update own row" ON service_providers;
CREATE POLICY "Providers update own row" ON service_providers FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Admin full access service_providers" ON service_providers;
CREATE POLICY "Admin full access service_providers" ON service_providers FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Providers manage own services" ON provider_services;
CREATE POLICY "Providers manage own services" ON provider_services FOR ALL
  USING (public.owns_service_provider(provider_id))
  WITH CHECK (public.owns_service_provider(provider_id));
DROP POLICY IF EXISTS "Admin full access provider_services" ON provider_services;
CREATE POLICY "Admin full access provider_services" ON provider_services FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Providers manage own rates" ON provider_rates;
CREATE POLICY "Providers manage own rates" ON provider_rates FOR ALL
  USING (public.owns_provider_service(provider_service_id))
  WITH CHECK (public.owns_provider_service(provider_service_id));
DROP POLICY IF EXISTS "Admin full access provider_rates" ON provider_rates;
CREATE POLICY "Admin full access provider_rates" ON provider_rates FOR ALL USING (public.is_admin());

-- Documents: providers read/upload their own and may withdraw ones not yet
-- verified. No UPDATE for providers -- re-upload instead.
DROP POLICY IF EXISTS "Providers read own documents" ON provider_documents;
CREATE POLICY "Providers read own documents" ON provider_documents FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Providers add own documents" ON provider_documents;
CREATE POLICY "Providers add own documents" ON provider_documents FOR INSERT
  WITH CHECK (user_id = auth.uid() AND public.owns_service_provider(provider_id));
DROP POLICY IF EXISTS "Providers withdraw unverified documents" ON provider_documents;
CREATE POLICY "Providers withdraw unverified documents" ON provider_documents FOR DELETE
  USING (user_id = auth.uid() AND status <> 'verified');
DROP POLICY IF EXISTS "Admin full access provider_documents" ON provider_documents;
CREATE POLICY "Admin full access provider_documents" ON provider_documents FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Providers read own strikes" ON provider_strikes;
CREATE POLICY "Providers read own strikes" ON provider_strikes FOR SELECT USING (public.owns_service_provider(provider_id));
DROP POLICY IF EXISTS "Admin full access provider_strikes" ON provider_strikes;
CREATE POLICY "Admin full access provider_strikes" ON provider_strikes FOR ALL USING (public.is_admin());

-- =====================================================================
-- PART E: Private storage bucket for verification documents
-- =====================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'provider-documents',
  'provider-documents',
  false,
  10485760,   -- 10 MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Objects are stored under <user_id>/..., so the first folder is the owner.
DROP POLICY IF EXISTS "Providers upload own verification files" ON storage.objects;
CREATE POLICY "Providers upload own verification files" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'provider-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Providers read own verification files" ON storage.objects;
CREATE POLICY "Providers read own verification files" ON storage.objects FOR SELECT
  USING (bucket_id = 'provider-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Providers delete own verification files" ON storage.objects;
CREATE POLICY "Providers delete own verification files" ON storage.objects FOR DELETE
  USING (bucket_id = 'provider-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Admins read verification files" ON storage.objects;
CREATE POLICY "Admins read verification files" ON storage.objects FOR SELECT
  USING (bucket_id = 'provider-documents' AND public.is_admin());
DROP POLICY IF EXISTS "Admins delete verification files" ON storage.objects;
CREATE POLICY "Admins delete verification files" ON storage.objects FOR DELETE
  USING (bucket_id = 'provider-documents' AND public.is_admin());

-- =====================================================================
-- PART F (S2): Public read through safe-columns views
-- =====================================================================
-- service_providers has no public RLS policy (it holds date_of_birth and
-- review notes, and RLS can't hide columns). These views are the only
-- public way in. They are owned by the migration role and do NOT use
-- security_invoker, so they read past RLS by design -- which is exactly why
-- each one selects an explicit, safe column list and filters to providers
-- who are verified, listed, and inside their police clearance date.
-- security_barrier stops a caller's WHERE clause being pushed below that
-- filter.
--
-- Signed-out visitors see a summary only (Linda, 20 Oct 2026): the card view
-- is granted to anon. The full rate card and bio are granted to
-- authenticated users only.

CREATE OR REPLACE VIEW public.service_provider_cards
WITH (security_barrier = true) AS
SELECT
  sp.id,
  CASE
    WHEN position(' ' IN trim(cp.full_name)) > 0
      THEN split_part(trim(cp.full_name), ' ', 1) || ' ' || upper(substring(trim(cp.full_name) FROM '(\S)\S*$')) || '.'
    ELSE trim(cp.full_name)
  END AS display_name,
  cp.avatar_url,
  sp.headline,
  sp.province,
  sp.city,
  sp.suburb,
  sp.travel_radius_km,
  sp.payment_methods,
  sp.verified_at,
  sp.rating_avg,
  sp.jobs_completed,
  svc.category_slugs,
  svc.category_names,
  price.from_price_cents,
  price.from_price_unit
FROM public.service_providers sp
JOIN public.candidate_profiles cp ON cp.user_id = sp.user_id
JOIN LATERAL (
  SELECT
    array_agg(c.slug ORDER BY c.sort_order) AS category_slugs,
    array_agg(c.name ORDER BY c.sort_order) AS category_names
  FROM public.provider_services ps
  JOIN public.service_categories c ON c.id = ps.category_id AND c.active
  WHERE ps.provider_id = sp.id
    AND (ps.qualification_status IS NULL OR ps.qualification_status = 'approved')
) svc ON svc.category_slugs IS NOT NULL
LEFT JOIN LATERAL (
  SELECT r.price_cents AS from_price_cents, r.unit AS from_price_unit
  FROM public.provider_services ps
  JOIN public.provider_rates r ON r.provider_service_id = ps.id
  WHERE ps.provider_id = sp.id
    AND (ps.qualification_status IS NULL OR ps.qualification_status = 'approved')
  ORDER BY r.price_cents
  LIMIT 1
) price ON true
WHERE sp.verification_status = 'verified'
  AND sp.listing_active
  AND sp.police_clearance_expires_at >= CURRENT_DATE;

CREATE OR REPLACE VIEW public.service_provider_rate_cards
WITH (security_barrier = true) AS
SELECT
  ps.provider_id,
  c.slug AS category_slug,
  c.name AS category_name,
  c.sort_order AS category_sort,
  ps.years_experience,
  ps.description,
  r.label,
  r.unit,
  r.price_cents,
  r.minimum_charge_cents,
  r.notes,
  r.sort_order
FROM public.provider_services ps
JOIN public.service_categories c ON c.id = ps.category_id AND c.active
JOIN public.provider_rates r ON r.provider_service_id = ps.id
JOIN public.service_providers sp ON sp.id = ps.provider_id
WHERE sp.verification_status = 'verified'
  AND sp.listing_active
  AND sp.police_clearance_expires_at >= CURRENT_DATE
  AND (ps.qualification_status IS NULL OR ps.qualification_status = 'approved');

CREATE OR REPLACE VIEW public.service_provider_profiles
WITH (security_barrier = true) AS
SELECT sp.id, sp.bio, sp.availability
FROM public.service_providers sp
WHERE sp.verification_status = 'verified'
  AND sp.listing_active
  AND sp.police_clearance_expires_at >= CURRENT_DATE;

REVOKE ALL ON public.service_provider_cards, public.service_provider_rate_cards, public.service_provider_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.service_provider_cards TO anon, authenticated;
GRANT SELECT ON public.service_provider_rate_cards TO authenticated;
GRANT SELECT ON public.service_provider_profiles TO authenticated;
