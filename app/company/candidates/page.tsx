import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CandidateSearch from './CandidateSearch';
import { resolveCompanyMembership } from '@/lib/company/resolveCompanyMembership';

export default async function CompanyCandidates() {
  const supabase = await createServerSupabase();
  if (!supabase) redirect('/login');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const membership = await resolveCompanyMembership(supabase, user.id);
  if (!membership) redirect('/company/profile');
  const company = { id: membership.companyId };

  // Three independent queries, fired together instead of one after another
  // (this page had grown to 5 sequential round trips, ~150-300ms each
  // measured against the live project -- Promise.all turns that into
  // "slowest one" instead of "sum of all of them").
  const [{ data: candidates }, { data: allCompanyJobs }, { data: invites }] = await Promise.all([
    // RLS now returns two groups: candidates who applied to this company's
    // jobs ("Companies read applicant profiles"), and candidates who opted
    // into the talent pool ("Companies read opted-in candidates",
    // additive). See supabase/add-talent-sourcing-and-verification.sql.
    supabase.from('candidate_profiles').select('*').order('profile_score', { ascending: false, nullsFirst: false }),
    // Fetched once, unfiltered by status -- companyJobs (active-only, for
    // the "Invite to apply" picker) is derived from this below instead of a
    // second query.
    supabase.from('jobs').select('id, title, status').eq('company_id', company.id).order('created_at', { ascending: false }),
    // Invites this company has already sent, so the UI doesn't offer to
    // re-invite someone with a pending/accepted invite.
    supabase.from('job_invites').select('candidate_id, job_id, status').eq('company_id', company.id),
  ]);

  const companyJobs = (allCompanyJobs ?? []).filter((j) => j.status === 'active').map((j) => ({ id: j.id, title: j.title }));
  const allJobIds = (allCompanyJobs ?? []).map((j) => j.id);
  const candidateUserIds = (candidates ?? []).map((c) => c.user_id);

  // These two depend on the results above (job ids, candidate user ids) but
  // not on each other, so they still run in parallel with each other.
  const [{ data: apps }, { data: cvDocs }] = await Promise.all([
    allJobIds.length > 0
      ? supabase.from('applications').select('candidate_id').in('job_id', allJobIds)
      : Promise.resolve({ data: [] as { candidate_id: string | null }[] }),
    candidateUserIds.length > 0
      ? supabase.from('candidate_documents').select('user_id, file_url, created_at').in('user_id', candidateUserIds).eq('doc_type', 'cv').order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as { user_id: string; file_url: string; created_at: string }[] }),
  ]);

  // Which of these candidates actually applied to any of our jobs, active or
  // not (matches company_has_applicant()'s own scope) vs. only visible
  // because they opted into the talent pool -- badge-only, doesn't affect
  // visibility (RLS already decided that).
  const applicantCandidateIds = new Set((apps ?? []).map((a) => a.candidate_id).filter(Boolean));

  // candidate_profiles.cv_url predates the multi-document library and
  // nothing writes to it anymore -- the real CV lives in candidate_documents
  // (doc_type='cv'), readable here under "Companies read applicant CVs"
  // (supabase/fix-cv-completeness.sql), scoped to the same applicants.
  const cvByUserId: Record<string, string> = {};
  for (const doc of cvDocs ?? []) {
    // Ordered newest first -- first hit per user_id is their latest CV.
    if (!cvByUserId[doc.user_id]) cvByUserId[doc.user_id] = doc.file_url;
  }
  const candidatesWithCv = (candidates ?? []).map((c) => ({
    ...c,
    cv_url: cvByUserId[c.user_id] ?? null,
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">
          Find Candidates
        </h1>
        <p className="text-slate-500 text-sm">
          Browse and search verified candidate profiles
        </p>
      </div>

      <CandidateSearch
        initialCandidates={candidatesWithCv as any[]}
        applicantCandidateIds={Array.from(applicantCandidateIds)}
        companyJobs={companyJobs ?? []}
        existingInvites={invites ?? []}
      />
    </div>
  );
}
