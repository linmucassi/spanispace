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

  // Fetch all candidate profiles -- RLS now returns two groups: candidates
  // who applied to this company's jobs ("Companies read applicant
  // profiles"), and candidates who opted into the talent pool ("Companies
  // read opted-in candidates", additive). See
  // supabase/add-talent-sourcing-and-verification.sql.
  const { data: candidates } = await supabase
    .from('candidate_profiles')
    .select('*')
    .order('profile_score', { ascending: false, nullsFirst: false });

  // This company's own active jobs, for the "Invite to apply" picker.
  const { data: companyJobs } = await supabase
    .from('jobs')
    .select('id, title')
    .eq('company_id', company.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  // Which of these candidates actually applied to any of our jobs, active or
  // not (matches company_has_applicant()'s own scope) vs. only visible
  // because they opted into the talent pool -- badge-only, doesn't affect
  // visibility (RLS already decided that).
  const { data: allCompanyJobs } = await supabase
    .from('jobs')
    .select('id')
    .eq('company_id', company.id);
  const allJobIds = (allCompanyJobs ?? []).map((j) => j.id);
  let applicantCandidateIds = new Set<string>();
  if (allJobIds.length > 0) {
    const { data: apps } = await supabase
      .from('applications')
      .select('candidate_id')
      .in('job_id', allJobIds);
    applicantCandidateIds = new Set((apps ?? []).map((a) => a.candidate_id).filter(Boolean));
  }

  // Invites this company has already sent, so the UI doesn't offer to
  // re-invite someone with a pending/accepted invite.
  const { data: invites } = await supabase
    .from('job_invites')
    .select('candidate_id, job_id, status')
    .eq('company_id', company.id);

  // candidate_profiles.cv_url predates the multi-document library and
  // nothing writes to it anymore -- the real CV lives in candidate_documents
  // (doc_type='cv'), readable here under "Companies read applicant CVs"
  // (supabase/fix-cv-completeness.sql), scoped to the same applicants.
  const candidateUserIds = (candidates ?? []).map((c) => c.user_id);
  const cvByUserId: Record<string, string> = {};
  if (candidateUserIds.length > 0) {
    const { data: cvDocs } = await supabase
      .from('candidate_documents')
      .select('user_id, file_url, created_at')
      .in('user_id', candidateUserIds)
      .eq('doc_type', 'cv')
      .order('created_at', { ascending: false });
    for (const doc of cvDocs ?? []) {
      // Ordered newest first -- first hit per user_id is their latest CV.
      if (!cvByUserId[doc.user_id]) cvByUserId[doc.user_id] = doc.file_url;
    }
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
