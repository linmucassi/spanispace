import { createClient } from '@/lib/supabase/client';

export type MyApplicationForJob = {
  isSignedIn: boolean;
  appliedAt: string | null;
};

const NOT_SIGNED_IN: MyApplicationForJob = { isSignedIn: false, appliedAt: null };

// Answers "have I already applied for this job?" for the signed-in visitor.
//
// Deliberately client side. Both /jobs/[id] and /jobs/[id]/apply declare
// revalidate = 300, so resolving this on the server would risk one candidate's
// applied state being served from cache to the next visitor. The events detail
// page checks its own registration the same way.
//
// Returns appliedAt null for signed-out visitors and for anyone whose account
// has no candidate profile yet, both of which mean there is nothing to match
// an application against.
export async function fetchMyApplicationForJob(
  jobId: string
): Promise<MyApplicationForJob> {
  const supabase = createClient();
  if (!supabase) return NOT_SIGNED_IN;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NOT_SIGNED_IN;

  const { data: profile } = await supabase
    .from('candidate_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!profile?.id) return { isSignedIn: true, appliedAt: null };

  const { data: application, error } = await supabase
    .from('applications')
    .select('created_at')
    .eq('candidate_id', profile.id)
    .eq('job_id', jobId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    // A denial here means supabase/fix-application-visibility.sql has not been
    // run yet. Say nothing rather than claim the candidate has not applied.
    console.error('[applications] could not check for a prior application:', error.message);
    return { isSignedIn: true, appliedAt: null };
  }

  return { isSignedIn: true, appliedAt: application?.created_at ?? null };
}

export function formatAppliedDate(value: string): string {
  return new Date(value).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
