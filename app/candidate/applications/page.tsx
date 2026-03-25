import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewed: 'bg-blue-100 text-blue-800',
  shortlisted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  hired: 'bg-emerald-100 text-emerald-800',
};

export const metadata = {
  title: 'Applications | Spanispace',
};

export default async function CandidateApplicationsPage() {
  const supabase = await createServerSupabase();

  if (!supabase) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">My Applications</h1>
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500">
            Supabase is not configured. Please set your environment variables.
          </p>
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
        <h1 className="text-2xl font-bold text-slate-900">My Applications</h1>
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500">Please sign in to view your applications.</p>
        </div>
      </div>
    );
  }

  // Fetch candidate profile
  const { data: profile } = await supabase
    .from('candidate_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  let applications: {
    id: string;
    status: string;
    created_at: string;
    job: {
      id: string;
      title: string;
      location: string;
      poster_name: string | null;
    } | null;
  }[] = [];

  if (profile?.id) {
    const { data } = await supabase
      .from('applications')
      .select(
        'id, status, created_at, job:jobs(id, title, location, poster_name)'
      )
      .eq('candidate_id', profile.id)
      .order('created_at', { ascending: false });

    applications = (data ?? []).map((a) => ({
      ...a,
      job: Array.isArray(a.job) ? a.job[0] ?? null : a.job,
    }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Applications</h1>
        <p className="text-slate-500 mt-1">
          Track all the jobs you have applied to.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        {applications.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-500">
              You have not submitted any applications yet.
            </p>
            <Link
              href="/#jobs"
              className="inline-flex items-center mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-3">Job Title</th>
                  <th className="px-6 py-3">Company / Poster</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Applied Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      {app.job ? (
                        <Link
                          href={`/jobs/${app.job.id}`}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          {app.job.title}
                        </Link>
                      ) : (
                        <span className="text-sm text-slate-400">
                          Job removed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {app.job?.poster_name ?? '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {app.job?.location ?? '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          statusColors[app.status] ??
                          'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(app.created_at).toLocaleDateString('en-ZA', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
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
