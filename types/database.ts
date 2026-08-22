export interface DbJob {
  id: string;
  company_id: string | null;
  title: string;
  description: string;
  requirements: string | null;
  location: string;
  job_type: string;
  duration?: string | null;
  salary_range: string | null;
  apply_link: string | null;
  expiry_date: string;
  vetted_status: 'pending' | 'verified' | 'rejected';
  poster_name: string | null;
  poster_phone: string | null;
  poster_whatsapp: string | null;
  poster_email: string | null;
  status: 'active' | 'closed' | 'draft';
  origin: 'company' | 'admin_curated' | 'scraped';
  apply_mode: 'on_platform' | 'redirect';
  created_at: string;
  updated_at: string;
}

export interface DbApplication {
  id: string;
  job_id: string;
  candidate_id: string | null;
  full_name: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  location: string | null;
  about_you: string | null;
  cover_letter: string | null;
  cv_url: string | null;
  documents: { name: string; doc_type: string; file_url: string }[] | null;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired';
  created_at: string;
  job?: DbJob;
}

export interface DbTraining {
  id: string;
  company_id: string | null;
  title: string;
  description: string | null;
  category: 'Bootcamp' | 'Short Course' | 'Event';
  start_date: string | null;
  duration_weeks: number | null;
  format: 'online' | 'hybrid' | 'in-person' | null;
  skills_covered: string[];
  is_free: boolean;
  vetted_status: 'pending' | 'verified' | 'rejected';
  status: 'active' | 'completed' | 'cancelled' | 'draft';
  created_at: string;
  updated_at: string;
}

export interface DbLearnership {
  id: string;
  title: string;
  provider: string;
  location: string | null;
  stipend: string | null;
  duration: string | null;
  apply_link: string | null;
  expiry_date: string | null;
  vetted_status: 'verified' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface DbLateUniApp {
  id: string;
  institution: string;
  programs: string | null;
  application_type: 'Late Application' | 'Standard' | 'Learnership' | null;
  closing_date: string | null;
  notes: string | null;
  apply_link: string | null;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
}

// Fully separate from jobs/learnerships/applications, per product decision --
// see supabase/add-application-journeys.sql.
export interface DbUniversityInterest {
  id: string;
  late_uni_app_id: string;
  candidate_id: string | null;
  full_name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
  late_uni_app?: DbLateUniApp;
}

export interface DbEvent {
  id: string;
  creator_id: string | null;
  company_id: string | null;
  title: string;
  description: string | null;
  event_type: string | null;
  format: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  registration_deadline: string | null;
  capacity: number | null;
  is_public: boolean;
  skills_focus: string[];
  vetted_status: 'pending' | 'verified' | 'rejected';
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface DbNewsletter {
  id: string;
  email: string;
  subscribed_at: string;
  unsubscribed_at: string | null;
}

export interface DbCompanyProfile {
  id: string;
  user_id: string;
  company_name: string;
  industry: string | null;
  location: string | null;
  website: string | null;
  logo_url: string | null;
  subscription_tier: string | null;
  subscription_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbCandidateProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  whatsapp: string | null;
  location: string | null;
  skills: string[];
  portfolio_url: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  avatar_url?: string | null;
  cv_url: string | null;
  professional_summary?: string | null;
  verified: boolean;
  open_to_offers?: boolean;
  profile_score: number | null;
  created_at: string;
  updated_at: string;
}

// Informal, piece job and formal work history — the raw material Spanispace
// turns into a professional profile. Added by add-informal-jobs.sql.
export interface DbWorkExperience {
  id: string;
  user_id: string;
  job_title: string;
  employer: string | null;
  work_type: 'formal' | 'informal' | 'piece_job' | 'part_time' | 'volunteer' | 'self_employed';
  location: string | null;
  duration_text: string | null;
  duties: string | null;
  skills_gained: string[];
  reference_name: string | null;
  reference_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbMessageThread {
  id: string;
  company_id: string;
  candidate_id: string;
  job_id: string | null;
  last_message_at: string;
  created_at: string;
}

export interface DbMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface DbAutomationPreferences {
  id: string;
  candidate_id: string;
  enabled: boolean;
  fields_of_interest: string[];
  excluded_companies: string[];
  work_types: string[];
  preferred_locations: string[];
  created_at: string;
  updated_at: string;
}

export interface DbApplicationMatch {
  id: string;
  candidate_id: string;
  job_id: string;
  status: 'pending' | 'applied' | 'dismissed';
  matched_at: string;
}

// A company inviting a candidate to apply for a specific job -- a signal,
// not an application. See supabase/add-talent-sourcing-and-verification.sql.
export interface DbJobInvite {
  id: string;
  job_id: string;
  company_id: string;
  candidate_id: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  responded_at: string | null;
  job?: { title: string; id: string };
  company_profiles?: { company_name: string };
  candidate_profiles?: { full_name: string; phone: string | null };
}

export interface AdminStats {
  totalJobs: number;
  activeJobs: number;
  pendingJobs: number;
  scrapedPendingJobs: number;
  totalApplications: number;
  weekApplications: number;
  totalTrainings: number;
  totalLearnerships: number;
  weekUniversityInterest: number;
  pendingVerifications: number;
  openInvites: number;
}

export type PlatformRole = 'candidate' | 'company' | 'admin' | 'super_admin';
export type CompanyRole = 'owner' | 'admin' | 'manager' | 'member' | 'viewer';

export interface DbUser {
  id: string;
  email: string;
  role: PlatformRole;
  created_at: string;
  updated_at: string;
}

// See supabase/add-roles-invites-and-calendar.sql PART C. One person
// belongs to at most one company at a time in v1.
export interface DbCompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: CompanyRole;
  added_by: string | null;
  created_at: string;
  users?: { email: string };
  company_profiles?: { company_name: string };
}

// Deliberately not wired into handle_new_user() -- acceptance is an
// explicit POST /api/invites/accept call after signUp() succeeds. See
// supabase/add-roles-invites-and-calendar.sql PART B.
export interface DbPlatformInvite {
  id: string;
  token: string;
  email: string;
  invite_type: 'platform_admin' | 'company_member' | 'referral';
  company_id: string | null;
  company_role: CompanyRole | null;
  invited_by: string | null;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
  company_profiles?: { company_name: string };
}

export interface DbInterview {
  id: string;
  application_id: string;
  company_id: string;
  candidate_id: string;
  scheduled_by: string | null;
  proposed_start: string;
  duration_minutes: number;
  location: string | null;
  notes: string | null;
  status: 'proposed' | 'confirmed' | 'declined' | 'rescheduled' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
  application?: { id: string; job: { title: string } | null };
  company_profiles?: { company_name: string };
  candidate_profiles?: { full_name: string };
}
