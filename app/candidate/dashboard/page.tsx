import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';
import ProfileCompletenessCard from '@/components/candidate/ProfileCompletenessCard';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewed: 'bg-blue-100 text-blue-800',
  shortlisted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  hired: 'bg-emerald-100 text-emerald-800',
};

export default async function CandidateDashboard() {
  const supabase = await createServerSupabase();

  if (!supabase) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500">
            Supabase is not configured. Please set your environment variables to
            enable the dashboard.
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
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500">Please sign in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  // Fetch candidate profile
  const { data: profile } = await supabase
    .from('candidate_profiles')
    .select('id, full_name, profile_score, phone, location, skills, cv_url, portfolio_url, professional_summary')
    .eq('user_id', user.id)
    .maybeSingle();

  const candidateId = profile?.id;
  const fullName = profile?.full_name ?? user.email?.split('@')[0] ?? 'there';
  const profileScore = profile?.profile_score ?? 0;

  // Fetch applications
  let totalApplications = 0;
  let shortlistedCount = 0;
  let applicationsLoadFailed = false;
  let recentApplications: {
    id: string;
    status: string;
    created_at: string;
    job: { title: string } | null;
  }[] = [];

  if (candidateId) {
    const { count } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('candidate_id', candidateId);
    totalApplications = count ?? 0;

    const { count: shortlisted } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('candidate_id', candidateId)
      .eq('status', 'shortlisted');
    shortlistedCount = shortlisted ?? 0;

    const { data: apps, error: appsError } = await supabase
      .from('applications')
      .select('id, status, created_at, job:jobs(title)')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false })
      .limit(10);

    // A failed read must not render as "you have not applied to any jobs yet".
    if (appsError) {
      console.error('[candidate/dashboard] could not load applications:', appsError.message);
      applicationsLoadFailed = true;
    }

    recentApplications = (apps ?? []).map((a) => ({
      ...a,
      job: Array.isArray(a.job) ? a.job[0] ?? null : a.job,
    }));
  }

  // Fetch enrollments count
  let activeEnrollments = 0;
  if (candidateId) {
    const { count } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('candidate_id', candidateId)
      .eq('status', 'enrolled');
    activeEnrollments = count ?? 0;
  }

  const stats = [
    {
      label: 'Total Applications',
      value: totalApplications,
      color: 'bg-brand-50 text-brand-700',
    },
    {
      label: 'Shortlisted',
      value: shortlistedCount,
      color: 'bg-green-50 text-green-700',
    },
    {
      label: 'Profile Score',
      value: `${profileScore}%`,
      color: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Active Enrollments',
      value: activeEnrollments,
      color: 'bg-purple-50 text-purple-700',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {fullName}
          </h1>
          <p className="text-slate-500 mt-1">
            Here is what is happening with your job search.
          </p>
        </div>
        <Link
          href="/#jobs"
          className="inline-flex items-center px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
        >
          Browse Jobs
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-slate-200 p-5"
          >
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color.split(' ')[1]}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <ProfileCompletenessCard
        profileScore={profileScore}
        profile={profile ?? {}}
        hasApplied={totalApplications > 0}
      />

      {/* Recent Applications */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Applications
          </h2>
        </div>

        {applicationsLoadFailed ? (
          <div className="p-8 text-center">
            <p className="text-slate-500">
              We could not load your applications just now. Please refresh the page,
              and if it keeps happening let us know.
            </p>
          </div>
        ) : recentApplications.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-500">
              You have not applied to any jobs yet.
            </p>
            <Link
              href="/#jobs"
              className="inline-flex items-center mt-4 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
            >
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Job Title</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Applied Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {app.job?.title ?? 'Untitled Job'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          statusColors[app.status] ?? 'bg-slate-100 text-slate-700'
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
