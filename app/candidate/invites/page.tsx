import { createServerSupabase } from '@/lib/supabase/server';
import InviteList from './InviteList';

export const metadata = {
  title: 'Invitations | Spanispace',
};

export default async function CandidateInvitesPage() {
  const supabase = await createServerSupabase();

  if (!supabase) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Invitations</h1>
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500">Supabase is not configured.</p>
        </div>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Invitations</h1>
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500">Please sign in to view your invitations.</p>
        </div>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from('candidate_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  let invites: {
    id: string;
    message: string | null;
    status: string;
    created_at: string;
    job: { id: string; title: string; location: string } | null;
    company_profiles: { company_name: string } | null;
  }[] = [];

  if (profile?.id) {
    const { data } = await supabase
      .from('job_invites')
      .select('id, message, status, created_at, job:jobs(id, title, location), company_profiles(company_name)')
      .eq('candidate_id', profile.id)
      .order('created_at', { ascending: false });

    invites = (data ?? []).map((i) => ({
      ...i,
      job: Array.isArray(i.job) ? i.job[0] ?? null : i.job,
      company_profiles: Array.isArray(i.company_profiles) ? i.company_profiles[0] ?? null : i.company_profiles,
    }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Invitations</h1>
        <p className="text-slate-500 mt-1">
          Companies who found you through the talent pool and invited you to apply directly.
        </p>
      </div>

      <InviteList initialInvites={invites} />
    </div>
  );
}
