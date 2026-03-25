export interface DbJob {
  id: string;
  company_id: string | null;
  title: string;
  description: string;
  requirements: string | null;
  location: string;
  job_type: string;
  salary_range: string | null;
  apply_link: string | null;
  expiry_date: string;
  vetted_status: 'pending' | 'verified' | 'rejected';
  poster_name: string | null;
  poster_phone: string | null;
  poster_whatsapp: string | null;
  poster_email: string | null;
  status: 'active' | 'closed' | 'draft';
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
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired';
  created_at: string;
  job?: DbJob;
}

export interface DbTraining {
  id: string;
  title: string;
  description: string | null;
  category: 'Bootcamp' | 'Short Course' | 'Event';
  start_date: string | null;
  duration_weeks: number | null;
  format: 'online' | 'hybrid' | 'in-person' | null;
  skills_covered: string[];
  is_free: boolean;
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

export interface DbEvent {
  id: string;
  creator_id: string | null;
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
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface DbWaitlist {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  interests: string | null;
  source: string;
  created_at: string;
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
  cv_url: string | null;
  verified: boolean;
  profile_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface AdminStats {
  totalJobs: number;
  activeJobs: number;
  pendingJobs: number;
  totalApplications: number;
  weekApplications: number;
  totalWaitlist: number;
  totalTrainings: number;
  totalLearnerships: number;
}
