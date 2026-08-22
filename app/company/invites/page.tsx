import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-green-100 text-green-700',
  declined: 'bg-slate-100 text-slate-600',
};

export default async function CompanyInvites() {
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

  const { data } = await supabase
    .from('job_invites')
    .select('id, message, status, created_at, job:jobs(id, title), candidate_profiles(full_name, location)')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false });

  const invites = (data ?? []).map((i) => ({
    ...i,
    job: Array.isArray(i.job) ? i.job[0] ?? null : i.job,
    candidate_profiles: Array.isArray(i.candidate_profiles) ? i.candidate_profiles[0] ?? null : i.candidate_profiles,
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Sent Invites</h1>
        <p className="text-slate-500 text-sm">Candidates you've invited to apply directly from the talent pool</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {invites.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">
            No invites sent yet. Find candidates under &quot;Find Candidates&quot; and invite them to apply.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Candidate</th>
                  <th className="px-6 py-3">Job</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invites.map((invite) => (
                  <tr key={invite.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      {invite.candidate_profiles?.full_name ?? 'Unknown candidate'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{invite.job?.title ?? 'Job removed'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold capitalize ${STATUS_STYLES[invite.status] ?? 'bg-slate-100 text-slate-700'}`}>
                        {invite.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                      {new Date(invite.created_at).toLocaleDateString('en-ZA')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
