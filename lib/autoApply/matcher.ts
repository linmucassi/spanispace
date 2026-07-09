// Server-only: finds jobs matching each opted-in candidate's auto-apply
// preferences and stages them in application_matches for review. Never
// inserts into `applications` directly -- that only happens when the
// candidate clicks "Apply" on a staged match (this is a review queue, not
// a fully autonomous auto-submit).
import { getSupabaseAdmin } from '../supabase/admin';

type MatcherResult = {
  candidatesProcessed: number;
  matchesCreated: number;
  errors: string[];
};

export async function runAutoApplyMatcher(): Promise<MatcherResult> {
  const supabase = getSupabaseAdmin();
  const errors: string[] = [];
  let matchesCreated = 0;

  const { data: prefsRows, error: prefsError } = await supabase
    .from('candidate_automation_preferences')
    .select('*, candidate:candidate_profiles(id, skills)')
    .eq('enabled', true);

  if (prefsError) {
    return { candidatesProcessed: 0, matchesCreated: 0, errors: [prefsError.message] };
  }

  const prefsList = prefsRows ?? [];
  if (prefsList.length === 0) {
    return { candidatesProcessed: 0, matchesCreated: 0, errors: [] };
  }

  const today = new Date().toISOString().split('T')[0];
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('id, title, description, job_type, poster_name, company_profiles(company_name)')
    .eq('status', 'active')
    .eq('vetted_status', 'verified')
    .gte('expiry_date', today);

  if (jobsError) {
    return { candidatesProcessed: 0, matchesCreated: 0, errors: [jobsError.message] };
  }

  const jobList = jobs ?? [];

  for (const prefs of prefsList) {
    const candidateId = prefs.candidate_id as string;
    try {
      const candidate = Array.isArray(prefs.candidate) ? prefs.candidate[0] : prefs.candidate;
      const keywords = [
        ...((prefs.fields_of_interest as string[]) ?? []),
        ...((candidate?.skills as string[]) ?? []),
      ]
        .map((k) => k.toLowerCase().trim())
        .filter(Boolean);

      // Nothing to match against -- skip rather than matching everything
      if (keywords.length === 0) continue;

      const excludedCompanies = new Set(
        ((prefs.excluded_companies as string[]) ?? []).map((c) => c.toLowerCase().trim())
      );
      const workTypes = new Set(
        ((prefs.work_types as string[]) ?? []).map((t) => t.toLowerCase())
      );

      const [{ data: existingMatches }, { data: existingApps }] = await Promise.all([
        supabase.from('application_matches').select('job_id').eq('candidate_id', candidateId),
        supabase.from('applications').select('job_id').eq('candidate_id', candidateId),
      ]);
      const seenJobIds = new Set([
        ...(existingMatches ?? []).map((m: { job_id: string }) => m.job_id),
        ...(existingApps ?? []).map((a: { job_id: string }) => a.job_id),
      ]);

      const newMatches: { candidate_id: string; job_id: string }[] = [];

      for (const job of jobList) {
        if (seenJobIds.has(job.id)) continue;
        if (workTypes.size > 0 && !workTypes.has(String(job.job_type).toLowerCase())) continue;

        const companyProfile = Array.isArray(job.company_profiles)
          ? job.company_profiles[0]
          : job.company_profiles;
        const companyName = (companyProfile?.company_name ?? job.poster_name ?? '')
          .toLowerCase()
          .trim();
        if (companyName && excludedCompanies.has(companyName)) continue;

        const haystack = `${job.title} ${job.description ?? ''}`.toLowerCase();
        if (!keywords.some((k) => haystack.includes(k))) continue;

        newMatches.push({ candidate_id: candidateId, job_id: job.id });
      }

      if (newMatches.length > 0) {
        const { error: insertError } = await supabase
          .from('application_matches')
          .insert(newMatches);
        if (insertError) {
          errors.push(`[candidate ${candidateId}] ${insertError.message}`);
        } else {
          matchesCreated += newMatches.length;
        }
      }
    } catch (err) {
      errors.push(`[candidate ${candidateId}] ${String(err)}`);
    }
  }

  return { candidatesProcessed: prefsList.length, matchesCreated, errors };
}
