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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Candidate Documents
CREATE TABLE candidate_documents (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name         TEXT        NOT NULL,
  doc_type     TEXT        NOT NULL CHECK (doc_type IN ('cv', 'certificate', 'cover_letter', 'motivational_letter', 'other')),
  file_url     TEXT        NOT NULL,
  file_size_kb INT,
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
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'rejected', 'hired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Trainings / Bootcamps
CREATE TABLE trainings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('Bootcamp', 'Short Course', 'Event')),
  start_date DATE,
  duration_weeks INT,
  format TEXT CHECK (format IN ('online', 'hybrid', 'in-person')),
  skills_covered TEXT[] DEFAULT '{}',
  is_free BOOLEAN DEFAULT TRUE,
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

-- 10. Events
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
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

-- 12. Waitlist
CREATE TABLE waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  interests TEXT,
  source TEXT DEFAULT 'website',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Newsletter
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
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE learnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE late_uni_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Public read for active content
CREATE POLICY "Public read active jobs" ON jobs FOR SELECT USING (status = 'active');
CREATE POLICY "Public read active trainings" ON trainings FOR SELECT USING (status IN ('active', 'completed'));
CREATE POLICY "Public read learnerships" ON learnerships FOR SELECT USING (true);
CREATE POLICY "Public read late uni apps" ON late_uni_apps FOR SELECT USING (true);
CREATE POLICY "Public read published events" ON events FOR SELECT USING (status IN ('published', 'ongoing', 'completed'));

-- Public inserts (anyone can apply, submit jobs, join waitlist)
CREATE POLICY "Anyone can submit jobs" ON jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can apply" ON applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can join waitlist" ON waitlist FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can subscribe" ON newsletter FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can register for events" ON event_registrations FOR INSERT WITH CHECK (true);

-- Authenticated users read own data
CREATE POLICY "Users read own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Candidates insert own profile" ON candidate_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Candidates manage own documents" ON candidate_documents FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Candidates read own profile" ON candidate_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Candidates update own profile" ON candidate_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Companies insert own profile" ON company_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Companies read own profile" ON company_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Companies update own profile" ON company_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Admin full access — uses is_admin() to avoid RLS recursion on the users table
CREATE POLICY "Admin full access users" ON users FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access jobs" ON jobs FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access applications" ON applications FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access trainings" ON trainings FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access learnerships" ON learnerships FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access late_uni_apps" ON late_uni_apps FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access events" ON events FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access waitlist" ON waitlist FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access newsletter" ON newsletter FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access enrollments" ON enrollments FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access event_registrations" ON event_registrations FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access candidate_profiles" ON candidate_profiles FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access company_profiles" ON company_profiles FOR ALL USING (public.is_admin());

-- ============================================================
-- HELPER: Admin role check (SECURITY DEFINER breaks RLS recursion)
-- ============================================================
-- All admin policies reference this function instead of querying users directly.
-- Without this, every query recurses: jobs policy → SELECT users → users policy → SELECT users → ∞
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
-- HELPER: Auto-create user row on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'role', 'candidate'));

  IF COALESCE(NEW.raw_user_meta_data->>'role', 'candidate') = 'company' THEN
    INSERT INTO public.company_profiles (user_id, company_name, industry, location)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'Unnamed Company'),
      NEW.raw_user_meta_data->>'industry',
      NEW.raw_user_meta_data->>'location'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_expiry ON jobs(expiry_date);
CREATE INDEX idx_jobs_vetted ON jobs(vetted_status);
CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_trainings_status ON trainings(status);
CREATE INDEX idx_learnerships_expiry ON learnerships(expiry_date);
CREATE INDEX idx_late_uni_closing ON late_uni_apps(closing_date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start ON events(start_date);
