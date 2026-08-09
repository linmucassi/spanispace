import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AutoApplyClient, { type MatchSummary } from './AutoApplyClient';
import type { DbAutomationPreferences } from '@/types/database';
import type { CandidateDocument } from '@/components/candidate/DocumentLibrary';

export default async function AutoApplyPage() {
  const supabase = await createServerSupabase();
  if (!supabase) redirect('/login');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: candidate } = await supabase
    .from('candidate_profiles')
    .select('id, full_name, phone, whatsapp, location, skills')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!candidate) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Auto-Apply</h1>
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500">
            Complete your profile before setting up auto-apply.
          </p>
          <Link
            href="/candidate/profile"
            className="inline-block mt-4 text-brand-600 font-medium hover:underline"
          >
            Go to My Profile
          </Link>
        </div>
      </div>
    );
  }

  const [{ data: preferences }, { data: documents }, { data: matches }] = await Promise.all([
    supabase
      .from('candidate_automation_preferences')
      .select('*')
      .eq('candidate_id', candidate.id)
      .maybeSingle(),
    supabase
      .from('candidate_documents')
      .select('id, name, doc_type, file_url, file_size_kb, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('application_matches')
      .select('id, matched_at, job:jobs(id, title, location, job_type, poster_name, company:company_profiles(company_name))')
      .eq('candidate_id', candidate.id)
      .eq('status', 'pending')
      .order('matched_at', { ascending: false }),
  ]);

  const matchSummaries: MatchSummary[] = (matches ?? [])
    .map((m) => {
      const job = Array.isArray(m.job) ? m.job[0] : m.job;
      if (!job) return null;
      const company = Array.isArray(job.company) ? job.company[0] : job.company;
      return {
        matchId: m.id,
        jobId: job.id,
        title: job.title,
        company: company?.company_name ?? job.poster_name ?? 'Spanispace Partner',
        location: job.location,
        jobType: job.job_type,
        matchedAt: m.matched_at,
      };
    })
    .filter((m): m is MatchSummary => m !== null);

  const hasCv = (documents ?? []).some((d) => d.doc_type === 'cv');

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Auto-Apply</h1>
        <p className="text-slate-500 mt-1">
          Set your criteria once and we&apos;ll surface matching jobs here for you to review and apply with one click.
        </p>
      </div>

      {!hasCv && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 mb-6">
          You haven&apos;t uploaded a CV yet.{' '}
          <Link href="/candidate/profile" className="font-medium underline">
            Add one to your profile
          </Link>{' '}
          so it can be attached automatically when you apply.
        </div>
      )}

      <AutoApplyClient
        candidateId={candidate.id}
        candidateInfo={{
          full_name: candidate.full_name ?? '',
          phone: candidate.phone ?? '',
          whatsapp: candidate.whatsapp ?? '',
          location: candidate.location ?? '',
          email: user.email ?? '',
        }}
        candidateSkills={candidate.skills ?? []}
        documents={(documents as CandidateDocument[]) ?? []}
        preferences={preferences as DbAutomationPreferences | null}
        matches={matchSummaries}
      />
    </div>
  );
}
