import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CandidateSearch from './CandidateSearch';

export default async function CompanyCandidates() {
  const supabase = await createServerSupabase();
  if (!supabase) redirect('/login');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: company } = await supabase
    .from('company_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!company) redirect('/company/profile');

  // Fetch all candidate profiles (RLS scopes this to candidates who applied
  // to this company's jobs -- see "Companies read applicant profiles")
  const { data: candidates } = await supabase
    .from('candidate_profiles')
    .select('*')
    .order('profile_score', { ascending: false, nullsFirst: false });

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

      <CandidateSearch initialCandidates={candidatesWithCv as any[]} />
    </div>
  );
}
