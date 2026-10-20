-- Spanispace Database Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- 1. Users (base table, linked to Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'candidate' CHECK (role IN ('candidate', 'company', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Candidate Profiles
CREATE TABLE candidate_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  location TEXT,
  matric_grad_year INT,
  university TEXT,
  skills TEXT[] DEFAULT '{}',
  portfolio_url TEXT,
  cv_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  profile_score INT DEFAULT 0 CHECK (profile_score >= 0 AND profile_score <= 100),
  -- Candidate-controlled: opts into being visible/invitable by companies who
  -- haven't received an application from them. Independent of `verified` --
  -- see supabase/add-talent-sourcing-and-verification.sql.
  open_to_offers BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Candidate Documents
CREATE TABLE candidate_documents (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name         TEXT        NOT NULL,
  doc_type     TEXT        NOT NULL CHECK (doc_type IN ('cv', 'certificate', 'cover_letter', 'motivational_letter', 'other', 'id_document', 'qualification', 'transcript')),
  file_url     TEXT        NOT NULL,
  file_size_kb INT,
  -- Nullable, only meaningful for id_document/qualification/transcript --
  -- see supabase/add-talent-sourcing-and-verification.sql.
  verification_status TEXT CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_note   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Company Profiles
CREATE TABLE company_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  company_name TEXT NOT NULL,
  industry TEXT,
  location TEXT,
  website TEXT,
  logo_url TEXT,
  subscription_tier TEXT DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'pro', 'enterprise')),
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('active', 'expired', 'trial')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Jobs
CREATE TABLE jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES company_profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  location TEXT NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('Remote', 'Hybrid', 'On-site', 'Learnership', 'Internship', 'Contract', 'Full-time', 'Part-time', 'Once-off')),
  salary_range TEXT,
  apply_link TEXT,
  expiry_date DATE NOT NULL,
  vetted_status TEXT DEFAULT 'pending' CHECK (vetted_status IN ('pending', 'verified', 'rejected')),
  poster_name TEXT,
  poster_phone TEXT,
  poster_whatsapp TEXT,
  poster_email TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
  -- origin: who owns/posted it, drives dashboard visibility (companies only
  -- ever see their own 'company' rows; admin sees everything).
  -- apply_mode: how the candidate finishes -- 'on_platform' is the existing
  -- full form, 'redirect' is a short capture form then off to apply_link.
  -- Scraped rows are always 'scraped'/'redirect'. See
  -- supabase/add-application-journeys.sql.
  origin TEXT NOT NULL DEFAULT 'company' CHECK (origin IN ('company', 'admin_curated', 'scraped')),
  apply_mode TEXT NOT NULL DEFAULT 'on_platform' CHECK (apply_mode IN ('on_platform', 'redirect')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Applications
CREATE TABLE applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES candidate_profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  location TEXT,
  about_you TEXT,
  cover_letter TEXT,
  cv_url TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'rejected', 'hired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5b. Job Invites (company invites a candidate to apply for a specific job --
-- a signal, not an application; deliberately separate from `applications`,
-- since accepting one just routes through that job's normal apply flow)
CREATE TABLE job_invites (
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

-- 6. Trainings / Bootcamps
CREATE TABLE trainings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES company_profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('Bootcamp', 'Short Course', 'Event')),
  start_date DATE,
  duration_weeks INT,
  format TEXT CHECK (format IN ('online', 'hybrid', 'in-person')),
  skills_covered TEXT[] DEFAULT '{}',
  -- Beginner is free, Advanced is paid. is_free is derived from level by the
  -- trainings_enforce_pricing trigger below, never set on its own.
  level TEXT NOT NULL DEFAULT 'Beginner' CHECK (level IN ('Beginner', 'Advanced')),
  is_free BOOLEAN DEFAULT TRUE,
  vetted_status TEXT DEFAULT 'verified' CHECK (vetted_status IN ('pending', 'verified', 'rejected')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'draft')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Enrollments
CREATE TABLE enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  training_id UUID REFERENCES trainings(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'completed', 'dropped')),
  progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(candidate_id, training_id)
);

-- 8. Learnerships (admin-curated)
CREATE TABLE learnerships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  provider TEXT NOT NULL,
  location TEXT,
  stipend TEXT,
  duration TEXT,
  apply_link TEXT,
  expiry_date DATE,
  vetted_status TEXT DEFAULT 'verified' CHECK (vetted_status IN ('verified', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Late University Applications (admin-curated)
CREATE TABLE late_uni_apps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institution TEXT NOT NULL,
  programs TEXT,
  application_type TEXT CHECK (application_type IN ('Late Application', 'Standard', 'Learnership')),
  closing_date DATE,
  notes TEXT,
  apply_link TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9b. University Application Interest (candidate clicked "Apply" on a
-- late_uni_apps card -- always an external redirect, this just captures who
-- before they leave). Fully separate from jobs/learnerships/applications,
-- no company visibility at all -- admin and the candidate themselves only.
CREATE TABLE university_application_interests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  late_uni_app_id UUID REFERENCES late_uni_apps(id) ON DELETE CASCADE NOT NULL,
  candidate_id UUID REFERENCES candidate_profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Events
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES company_profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT CHECK (event_type IN ('webinar', 'workshop', 'hackathon', 'career_fair', 'bootcamp_session', 'networking', 'other')),
  format TEXT CHECK (format IN ('online', 'hybrid', 'in_person')),
  location TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  registration_deadline DATE,
  capacity INT,
  is_public BOOLEAN DEFAULT TRUE,
  skills_focus TEXT[] DEFAULT '{}',
  vetted_status TEXT DEFAULT 'verified' CHECK (vetted_status IN ('pending', 'verified', 'rejected')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Event Registrations
CREATE TABLE event_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES candidate_profiles(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'no_show', 'cancelled')),
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  attended_at TIMESTAMPTZ,
  feedback TEXT
);

-- 12. Job Views (analytics: track detail-page views per job)
CREATE TABLE job_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Application Starts (analytics: track apply-form loads, for drop-off vs `applications`)
CREATE TABLE application_starts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Message Threads (one thread per company<->candidate pair)
CREATE TABLE message_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES company_profiles(id) ON DELETE CASCADE NOT NULL,
  candidate_id UUID REFERENCES candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (company_id, candidate_id)
);

-- 15. Messages
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID REFERENCES message_threads(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Candidate Auto-Apply Preferences (one row per candidate; enabled = opted in)
CREATE TABLE candidate_automation_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES candidate_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  fields_of_interest TEXT[] DEFAULT '{}',
  excluded_companies TEXT[] DEFAULT '{}',
  work_types TEXT[] DEFAULT '{}',
  preferred_locations TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Auto-Apply Match Queue (candidate reviews and one-click confirms each match)
CREATE TABLE application_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'dismissed')),
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (candidate_id, job_id)
);

-- 18. Waitlist
CREATE TABLE waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  interests TEXT,
  source TEXT DEFAULT 'website',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Newsletter
CREATE TABLE newsletter (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE learnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE late_uni_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_application_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_starts ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_automation_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_matches ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER: Admin role check (SECURITY DEFINER breaks RLS recursion)
-- ============================================================
-- All admin policies reference this function instead of querying users directly.
-- Without this, every query recurses: jobs policy → SELECT users → users policy → SELECT users → ∞
-- Defined before any policy below so a fresh top-to-bottom run doesn't fail
-- on a forward reference.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ============================================================
-- HELPER: Messaging participant checks (SECURITY DEFINER breaks RLS recursion)
-- ============================================================
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

-- ============================================================
-- HELPER: Did this candidate apply to this job? (SECURITY DEFINER breaks RLS recursion)
-- ============================================================
-- Lets a candidate read the job behind their own application after it closes.
-- Must be SECURITY DEFINER: the company policies on `applications` reach it
-- through `jobs`, so a plain EXISTS here would make the two tables evaluate
-- each other's policies forever.
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

-- ============================================================
-- HELPER: Did this company receive an application from this candidate?
-- (SECURITY DEFINER breaks RLS recursion)
-- ============================================================
-- Must be SECURITY DEFINER: "Candidates read own applications" on `applications`
-- reaches back into candidate_profiles, so a plain EXISTS here (querying
-- applications from a candidate_profiles policy) makes the two tables
-- evaluate each other's policies forever.
CREATE OR REPLACE FUNCTION public.company_has_applicant(p_candidate_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.applications a
    JOIN public.jobs j ON j.id = a.job_id
    JOIN public.company_profiles cp ON cp.id = j.company_id
    WHERE a.candidate_id = p_candidate_id AND cp.user_id = auth.uid()
  );
$$;

-- Public read for active content
CREATE POLICY "Public read active jobs" ON jobs FOR SELECT USING (status = 'active');
CREATE POLICY "Public read active trainings" ON trainings FOR SELECT USING (status IN ('active', 'completed') AND vetted_status = 'verified');
CREATE POLICY "Public read learnerships" ON learnerships FOR SELECT USING (true);
CREATE POLICY "Public read late uni apps" ON late_uni_apps FOR SELECT USING (true);
CREATE POLICY "Candidates insert own university interest" ON university_application_interests FOR INSERT WITH CHECK (
  candidate_id IS NULL OR EXISTS (SELECT 1 FROM candidate_profiles cd WHERE cd.id = university_application_interests.candidate_id AND cd.user_id = auth.uid())
);
CREATE POLICY "Candidates read own university interest" ON university_application_interests FOR SELECT USING (
  EXISTS (SELECT 1 FROM candidate_profiles cd WHERE cd.id = university_application_interests.candidate_id AND cd.user_id = auth.uid())
);
CREATE POLICY "Public read published events" ON events FOR SELECT USING (status IN ('published', 'ongoing', 'completed') AND vetted_status = 'verified');

-- Public inserts (anyone can apply, submit jobs, join waitlist)
CREATE POLICY "Anyone can submit jobs" ON jobs FOR INSERT WITH CHECK (true);

-- Companies manage their own jobs (read own regardless of status, update own)
CREATE POLICY "Companies read own jobs" ON jobs FOR SELECT USING (
  EXISTS (SELECT 1 FROM company_profiles cp WHERE cp.id = jobs.company_id AND cp.user_id = auth.uid())
);
CREATE POLICY "Companies update own jobs" ON jobs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM company_profiles cp WHERE cp.id = jobs.company_id AND cp.user_id = auth.uid())
);
-- A candidate must still be able to read a job they applied to once it closes,
-- otherwise the embedded job on /candidate/applications comes back NULL.
CREATE POLICY "Candidates read jobs they applied to" ON jobs FOR SELECT USING (
  public.has_applied_to_job(id)
);
CREATE POLICY "Anyone can apply" ON applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Candidates read own applications" ON applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM candidate_profiles cd WHERE cd.id = applications.candidate_id AND cd.user_id = auth.uid())
);
CREATE POLICY "Companies read own job applications" ON applications FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM jobs j JOIN company_profiles cp ON cp.id = j.company_id
    WHERE j.id = applications.job_id AND cp.user_id = auth.uid()
  )
);
CREATE POLICY "Companies update own job applications" ON applications FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM jobs j JOIN company_profiles cp ON cp.id = j.company_id
    WHERE j.id = applications.job_id AND cp.user_id = auth.uid()
  )
);
CREATE POLICY "Anyone can join waitlist" ON waitlist FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can subscribe" ON newsletter FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can register for events" ON event_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can log a job view" ON job_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can log an application start" ON application_starts FOR INSERT WITH CHECK (true);

-- Companies read analytics for their own jobs
CREATE POLICY "Companies read own job views" ON job_views FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM jobs j JOIN company_profiles cp ON cp.id = j.company_id
    WHERE j.id = job_views.job_id AND cp.user_id = auth.uid()
  )
);
CREATE POLICY "Companies read own application starts" ON application_starts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM jobs j JOIN company_profiles cp ON cp.id = j.company_id
    WHERE j.id = application_starts.job_id AND cp.user_id = auth.uid()
  )
);

-- Authenticated users read own data
CREATE POLICY "Users read own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Candidates insert own profile" ON candidate_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Candidates manage own documents" ON candidate_documents FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Candidates read own profile" ON candidate_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Candidates update own profile" ON candidate_profiles FOR UPDATE USING (auth.uid() = user_id);
-- A company can see the profiles of candidates who applied to its jobs, and only those.
CREATE POLICY "Companies read applicant profiles" ON candidate_profiles FOR SELECT USING (
  public.company_has_applicant(id)
);
-- Additive to the policy above (Postgres OR's multiple permissive SELECT
-- policies together) -- opts a candidate into being visible/invitable by
-- companies they haven't applied to yet. See
-- supabase/add-talent-sourcing-and-verification.sql.
CREATE POLICY "Companies read opted-in candidates" ON candidate_profiles FOR SELECT USING (
  open_to_offers = true
);

CREATE POLICY "Companies manage own invites" ON job_invites FOR ALL USING (
  EXISTS (SELECT 1 FROM company_profiles cp WHERE cp.id = job_invites.company_id AND cp.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM company_profiles cp WHERE cp.id = job_invites.company_id AND cp.user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM candidate_profiles c WHERE c.id = job_invites.candidate_id
    AND (c.open_to_offers = true OR public.company_has_applicant(c.id))
  )
);
CREATE POLICY "Candidates read own invites" ON job_invites FOR SELECT USING (
  EXISTS (SELECT 1 FROM candidate_profiles c WHERE c.id = job_invites.candidate_id AND c.user_id = auth.uid())
);
CREATE POLICY "Candidates respond to own invites" ON job_invites FOR UPDATE USING (
  EXISTS (SELECT 1 FROM candidate_profiles c WHERE c.id = job_invites.candidate_id AND c.user_id = auth.uid())
);
CREATE POLICY "Companies insert own profile" ON company_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Companies read own profile" ON company_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Companies update own profile" ON company_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Candidates manage their own auto-apply preferences and review their match queue.
-- Matches are inserted only by the server-side matcher script (service role,
-- bypasses RLS) -- no client INSERT policy on application_matches by design.
CREATE POLICY "Candidates insert own automation prefs" ON candidate_automation_preferences FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM candidate_profiles cd WHERE cd.id = candidate_automation_preferences.candidate_id AND cd.user_id = auth.uid())
);
CREATE POLICY "Candidates read own automation prefs" ON candidate_automation_preferences FOR SELECT USING (
  EXISTS (SELECT 1 FROM candidate_profiles cd WHERE cd.id = candidate_automation_preferences.candidate_id AND cd.user_id = auth.uid())
);
CREATE POLICY "Candidates update own automation prefs" ON candidate_automation_preferences FOR UPDATE USING (
  EXISTS (SELECT 1 FROM candidate_profiles cd WHERE cd.id = candidate_automation_preferences.candidate_id AND cd.user_id = auth.uid())
);
CREATE POLICY "Candidates read own application matches" ON application_matches FOR SELECT USING (
  EXISTS (SELECT 1 FROM candidate_profiles cd WHERE cd.id = application_matches.candidate_id AND cd.user_id = auth.uid())
);
CREATE POLICY "Candidates update own application matches" ON application_matches FOR UPDATE USING (
  EXISTS (SELECT 1 FROM candidate_profiles cd WHERE cd.id = application_matches.candidate_id AND cd.user_id = auth.uid())
);

-- Companies manage their own events & training (submitted as vetted_status='pending', admin reviews)
CREATE POLICY "Companies insert own trainings" ON trainings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM company_profiles cp WHERE cp.id = trainings.company_id AND cp.user_id = auth.uid())
);
CREATE POLICY "Companies read own trainings" ON trainings FOR SELECT USING (
  EXISTS (SELECT 1 FROM company_profiles cp WHERE cp.id = trainings.company_id AND cp.user_id = auth.uid())
);
CREATE POLICY "Companies update own trainings" ON trainings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM company_profiles cp WHERE cp.id = trainings.company_id AND cp.user_id = auth.uid())
);
CREATE POLICY "Companies insert own events" ON events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM company_profiles cp WHERE cp.id = events.company_id AND cp.user_id = auth.uid())
);
CREATE POLICY "Companies read own events" ON events FOR SELECT USING (
  EXISTS (SELECT 1 FROM company_profiles cp WHERE cp.id = events.company_id AND cp.user_id = auth.uid())
);
CREATE POLICY "Companies update own events" ON events FOR UPDATE USING (
  EXISTS (SELECT 1 FROM company_profiles cp WHERE cp.id = events.company_id AND cp.user_id = auth.uid())
);

-- Messaging: only the two participants (the owning company user and candidate user) of a thread can read/write it
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

-- Admin full access — uses is_admin() to avoid RLS recursion on the users table
CREATE POLICY "Admin full access users" ON users FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access jobs" ON jobs FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access applications" ON applications FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access trainings" ON trainings FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access learnerships" ON learnerships FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access late_uni_apps" ON late_uni_apps FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access university_application_interests" ON university_application_interests FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access events" ON events FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access waitlist" ON waitlist FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access newsletter" ON newsletter FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access enrollments" ON enrollments FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access event_registrations" ON event_registrations FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access candidate_profiles" ON candidate_profiles FOR ALL USING (public.is_admin());
-- candidate_documents previously had only the owner-only policy plus
-- fix-cv-completeness.sql's cv-only company policy -- needed for the
-- id_document/qualification/transcript review queue.
CREATE POLICY "Admin full access candidate_documents" ON candidate_documents FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access job_invites" ON job_invites FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access company_profiles" ON company_profiles FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access job_views" ON job_views FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access application_starts" ON application_starts FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access message_threads" ON message_threads FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access messages" ON messages FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access candidate_automation_preferences" ON candidate_automation_preferences FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access application_matches" ON application_matches FOR ALL USING (public.is_admin());

-- ============================================================
-- HELPER: Auto-create user row on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  requested_role text := NEW.raw_user_meta_data->>'role';
  safe_role text;
BEGIN
  -- Only 'company' or 'candidate' may come from signup. Anything else,
  -- including 'admin', collapses to 'candidate'. Admins are provisioned out
  -- of band with the service role, never through public signup (see
  -- supabase/fix-security-hardening.sql, blocker B1).
  safe_role := CASE WHEN requested_role = 'company' THEN 'company' ELSE 'candidate' END;

  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, safe_role);

  IF safe_role = 'company' THEN
    INSERT INTO public.company_profiles (user_id, company_name, industry, location)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'Unnamed Company'),
      NEW.raw_user_meta_data->>'industry',
      NEW.raw_user_meta_data->>'location'
    );
  ELSE
    -- Without this a candidate has no profile row until they find and save
    -- /candidate/profile, so every application they make is written with
    -- candidate_id NULL and never appears on their dashboard. full_name is
    -- NOT NULL on candidate_profiles, so the email local part is a last
    -- resort for accounts created outside the register form (e.g. Google
    -- sign-in, which never sends full_name as 'full_name').
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TRIGGER: course pricing follows the level, always
-- Beginner courses are free, advanced courses are paid. Nobody gets to set
-- is_free independently, whichever form or script is doing the writing.
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_training_pricing()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.is_free := (NEW.level = 'Beginner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trainings_enforce_pricing
  BEFORE INSERT OR UPDATE ON trainings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_training_pricing();

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_expiry ON jobs(expiry_date);
CREATE INDEX idx_jobs_vetted ON jobs(vetted_status);
CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_candidate ON applications(candidate_id);
-- One application per candidate per job. Partial, because candidate_id is
-- nullable by design: the apply page is public and a signed-out visitor
-- inserts NULL, and ON DELETE SET NULL nulls it on surviving rows.
CREATE UNIQUE INDEX idx_applications_candidate_job_unique
  ON applications (candidate_id, job_id)
  WHERE candidate_id IS NOT NULL;
CREATE INDEX idx_trainings_status ON trainings(status);
CREATE INDEX idx_trainings_level ON trainings(level);
CREATE INDEX idx_learnerships_expiry ON learnerships(expiry_date);
CREATE INDEX idx_late_uni_closing ON late_uni_apps(closing_date);
CREATE INDEX idx_university_interest_late_uni_app ON university_application_interests(late_uni_app_id);
CREATE INDEX idx_jobs_origin ON jobs(origin);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start ON events(start_date);
CREATE INDEX idx_job_views_job ON job_views(job_id);
CREATE INDEX idx_application_starts_job ON application_starts(job_id);
CREATE INDEX idx_job_invites_candidate ON job_invites(candidate_id);
CREATE INDEX idx_job_invites_company ON job_invites(company_id);
CREATE INDEX idx_message_threads_company ON message_threads(company_id);
CREATE INDEX idx_message_threads_candidate ON message_threads(candidate_id);
CREATE INDEX idx_messages_thread ON messages(thread_id);
CREATE INDEX idx_automation_prefs_enabled ON candidate_automation_preferences(enabled);
CREATE INDEX idx_application_matches_candidate ON application_matches(candidate_id, status);

-- =====================================================================================
-- Platform roles + general invite system + company org/RBAC + interview scheduling.
-- Mirrors supabase/add-roles-invites-and-calendar.sql byte-for-byte -- see that file's
-- header comments for the full design rationale (why invites don't touch
-- handle_new_user(), why the company-RBAC RLS is additive-only, etc).
-- =====================================================================================

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('candidate', 'company', 'admin', 'super_admin'));

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.lock_user_role()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_super_admin() AND NEW.role IS DISTINCT FROM OLD.role THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS lock_user_role_trigger ON users;
CREATE TRIGGER lock_user_role_trigger BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION public.lock_user_role();

CREATE TABLE IF NOT EXISTS platform_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  email TEXT NOT NULL,
  invite_type TEXT NOT NULL CHECK (invite_type IN ('platform_admin', 'company_member', 'referral')),
  company_id UUID REFERENCES company_profiles(id) ON DELETE CASCADE,
  company_role TEXT CHECK (company_role IN ('owner', 'admin', 'manager', 'member', 'viewer')),
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  CHECK (invite_type != 'company_member' OR (company_id IS NOT NULL AND company_role IS NOT NULL))
);
ALTER TABLE platform_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own sent invites" ON platform_invites;
CREATE POLICY "Users manage own sent invites" ON platform_invites FOR ALL USING (
  invited_by = auth.uid()
) WITH CHECK (
  invited_by = auth.uid()
);
DROP POLICY IF EXISTS "Admin full access platform_invites" ON platform_invites;
CREATE POLICY "Admin full access platform_invites" ON platform_invites FOR ALL USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_platform_invites_token ON platform_invites(token);
CREATE INDEX IF NOT EXISTS idx_platform_invites_email ON platform_invites(email);

CREATE TABLE IF NOT EXISTS company_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES company_profiles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member', 'viewer')),
  added_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (company_id, user_id)
);
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;

INSERT INTO company_members (company_id, user_id, role)
SELECT id, user_id, 'owner' FROM company_profiles
WHERE user_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.company_member_role(p_company_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.company_members
  WHERE company_id = p_company_id AND user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.company_is_member(p_company_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = p_company_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.company_can_operate(p_company_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = p_company_id AND user_id = auth.uid()
      AND role IN ('owner', 'admin', 'manager', 'member')
  );
$$;

CREATE OR REPLACE FUNCTION public.company_can_manage(p_company_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = p_company_id AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.protect_company_owner()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.role = 'owner' THEN
      RAISE EXCEPTION 'Cannot remove the company owner.';
    END IF;
    RETURN OLD;
  END IF;
  IF OLD.role = 'owner' AND NEW.role IS DISTINCT FROM OLD.role THEN
    NEW.role := 'owner';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS protect_company_owner_update ON company_members;
CREATE TRIGGER protect_company_owner_update BEFORE UPDATE ON company_members
  FOR EACH ROW EXECUTE FUNCTION public.protect_company_owner();
DROP TRIGGER IF EXISTS protect_company_owner_delete ON company_members;
CREATE TRIGGER protect_company_owner_delete BEFORE DELETE ON company_members
  FOR EACH ROW EXECUTE FUNCTION public.protect_company_owner();

DROP POLICY IF EXISTS "Members read own company roster" ON company_members;
CREATE POLICY "Members read own company roster" ON company_members FOR SELECT USING (
  public.company_is_member(company_id)
);
DROP POLICY IF EXISTS "Managers manage company roster" ON company_members;
CREATE POLICY "Managers manage company roster" ON company_members FOR ALL USING (
  public.company_can_manage(company_id)
) WITH CHECK (
  public.company_can_manage(company_id)
);
DROP POLICY IF EXISTS "Admin full access company_members" ON company_members;
CREATE POLICY "Admin full access company_members" ON company_members FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Team members read own company jobs" ON jobs;
CREATE POLICY "Team members read own company jobs" ON jobs FOR SELECT USING (
  public.company_is_member(company_id)
);
DROP POLICY IF EXISTS "Team members update own company jobs" ON jobs;
CREATE POLICY "Team members update own company jobs" ON jobs FOR UPDATE USING (
  public.company_can_operate(company_id)
);

DROP POLICY IF EXISTS "Team members insert own company trainings" ON trainings;
CREATE POLICY "Team members insert own company trainings" ON trainings FOR INSERT WITH CHECK (
  public.company_can_operate(company_id)
);
DROP POLICY IF EXISTS "Team members read own company trainings" ON trainings;
CREATE POLICY "Team members read own company trainings" ON trainings FOR SELECT USING (
  public.company_is_member(company_id)
);
DROP POLICY IF EXISTS "Team members update own company trainings" ON trainings;
CREATE POLICY "Team members update own company trainings" ON trainings FOR UPDATE USING (
  public.company_can_operate(company_id)
);

DROP POLICY IF EXISTS "Team members insert own company events" ON events;
CREATE POLICY "Team members insert own company events" ON events FOR INSERT WITH CHECK (
  public.company_can_operate(company_id)
);
DROP POLICY IF EXISTS "Team members read own company events" ON events;
CREATE POLICY "Team members read own company events" ON events FOR SELECT USING (
  public.company_is_member(company_id)
);
DROP POLICY IF EXISTS "Team members update own company events" ON events;
CREATE POLICY "Team members update own company events" ON events FOR UPDATE USING (
  public.company_can_operate(company_id)
);

DROP POLICY IF EXISTS "Team members read own company job applications" ON applications;
CREATE POLICY "Team members read own company job applications" ON applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM jobs j WHERE j.id = applications.job_id AND public.company_is_member(j.company_id))
);
DROP POLICY IF EXISTS "Team members update own company job applications" ON applications;
CREATE POLICY "Team members update own company job applications" ON applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM jobs j WHERE j.id = applications.job_id AND public.company_can_operate(j.company_id))
);

DROP POLICY IF EXISTS "Team members manage own company invites" ON job_invites;
CREATE POLICY "Team members manage own company invites" ON job_invites FOR ALL USING (
  public.company_can_operate(company_id)
) WITH CHECK (
  public.company_can_operate(company_id)
  AND EXISTS (
    SELECT 1 FROM candidate_profiles c WHERE c.id = job_invites.candidate_id
    AND (c.open_to_offers = true OR public.company_has_applicant(c.id))
  )
);

DROP POLICY IF EXISTS "Team members read own company profile" ON company_profiles;
CREATE POLICY "Team members read own company profile" ON company_profiles FOR SELECT USING (
  public.company_is_member(id)
);
DROP POLICY IF EXISTS "Managers update own company profile" ON company_profiles;
CREATE POLICY "Managers update own company profile" ON company_profiles FOR UPDATE USING (
  public.company_can_manage(id)
);

CREATE OR REPLACE FUNCTION public.is_thread_party(p_company_id UUID, p_candidate_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.company_can_operate(p_company_id)
    OR EXISTS (
      SELECT 1 FROM public.candidate_profiles cd WHERE cd.id = p_candidate_id AND cd.user_id = auth.uid()
    );
$$;

CREATE INDEX IF NOT EXISTS idx_company_members_company ON company_members(company_id);

CREATE TABLE IF NOT EXISTS interviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES company_profiles(id) ON DELETE CASCADE NOT NULL,
  candidate_id UUID REFERENCES candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  scheduled_by UUID REFERENCES users(id) ON DELETE SET NULL,
  proposed_start TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 30,
  location TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'confirmed', 'declined', 'rescheduled', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team members manage own company interviews" ON interviews;
CREATE POLICY "Team members manage own company interviews" ON interviews FOR ALL USING (
  public.company_can_operate(company_id)
) WITH CHECK (
  public.company_can_operate(company_id)
);
DROP POLICY IF EXISTS "Candidates read own interviews" ON interviews;
CREATE POLICY "Candidates read own interviews" ON interviews FOR SELECT USING (
  EXISTS (SELECT 1 FROM candidate_profiles c WHERE c.id = interviews.candidate_id AND c.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Candidates respond to own interviews" ON interviews;
CREATE POLICY "Candidates respond to own interviews" ON interviews FOR UPDATE USING (
  EXISTS (SELECT 1 FROM candidate_profiles c WHERE c.id = interviews.candidate_id AND c.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Admin full access interviews" ON interviews;
CREATE POLICY "Admin full access interviews" ON interviews FOR ALL USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_interviews_company ON interviews(company_id);
CREATE INDEX IF NOT EXISTS idx_interviews_candidate ON interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_application ON interviews(application_id);

-- =====================================================================================
-- Spanispace Services S1: service providers, enrolment, verification.
-- Mirrors supabase/add-service-marketplace.sql byte-for-byte -- see that file's
-- header comments for the trust model (private bucket, column guard triggers,
-- no public read on service_providers until S2's safe view).
-- =====================================================================================
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
