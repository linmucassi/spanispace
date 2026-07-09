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

  // Fetch all candidate profiles
  const { data: candidates } = await supabase
    .from('candidate_profiles')
    .select('*')
    .order('profile_score', { ascending: false, nullsFirst: false });

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

      <CandidateSearch initialCandidates={(candidates as any[]) ?? []} />
    </div>
  );
}
