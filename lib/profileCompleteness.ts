// Mirrors the scoring weights in supabase/add-notifications-and-profile-scoring.sql
// (compute_profile_score trigger). Kept as plain data here so the dashboard
// checklist and the 48h nudge email (scripts/run-profile-nudges.ts) always
// agree on what "complete" means, without either hardcoding its own list.

export const PROFILE_COMPLETE_THRESHOLD = 70;

export type ProfileCompletenessInput = {
  phone?: string | null;
  location?: string | null;
  skills?: string[] | null;
  cv_url?: string | null;
  portfolio_url?: string | null;
  professional_summary?: string | null;
};

export type ProfileChecklistItem = {
  key: string;
  label: string;
  shortLabel: string;
  done: boolean;
};

export function profileChecklist(p: ProfileCompletenessInput): ProfileChecklistItem[] {
  return [
    { key: 'skills', label: 'Add your skills', shortLabel: 'skills', done: Boolean(p.skills && p.skills.length > 0) },
    { key: 'cv', label: 'Upload your CV', shortLabel: 'CV upload', done: Boolean(p.cv_url) },
    { key: 'phone', label: 'Add a phone number', shortLabel: 'phone number', done: Boolean(p.phone) },
    { key: 'location', label: 'Add your location', shortLabel: 'location', done: Boolean(p.location) },
    { key: 'summary', label: 'Write a short professional summary', shortLabel: 'professional summary', done: Boolean(p.professional_summary) },
    { key: 'portfolio', label: 'Add a portfolio link', shortLabel: 'portfolio link', done: Boolean(p.portfolio_url) },
  ];
}

export function missingProfileFields(p: ProfileCompletenessInput): string[] {
  return profileChecklist(p)
    .filter((item) => !item.done)
    .map((item) => item.shortLabel);
}
