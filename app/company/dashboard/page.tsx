import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

function StatsCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
      <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    reviewed: 'bg-blue-100 text-blue-700',
    shortlisted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    hired: 'bg-brand-100 text-brand-700',
  };

  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
        styles[status] || 'bg-slate-100 text-slate-700'
      }`}
    >
      {status}
    </span>
  );
}

export default async function CompanyDashboard() {
  const supabase = await createServerSupabase();
  if (!supabase) redirect('/login');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get company profile
  const { data: company } = await supabase
    .from('company_profiles')
    .select('id, company_name')
    .eq('user_id', user.id)
    .single();

  if (!company) redirect('/company/profile');

  // Get all job IDs for this company first
  const { data: companyJobs } = await supabase
    .from('jobs')
    .select('id, status')
    .eq('company_id', company.id);

  const jobIds = (companyJobs ?? []).map((j) => j.id);
  const activeJobCount = (companyJobs ?? []).filter((j) => j.status === 'active').length;

  // If no jobs, skip application queries
  let totalApplications = 0;
  let shortlisted = 0;
  let pendingReview = 0;
  let recentApps: any[] = [];
  let totalViews = 0;
  let totalStarts = 0;

  if (jobIds.length > 0) {
    const [totalAppsRes, shortlistedRes, pendingRes, recentAppsRes, viewsRes, startsRes] =
      await Promise.all([
        supabase
          .from('applications')
          .select('id', { count: 'exact', head: true })
          .in('job_id', jobIds),
        supabase
          .from('applications')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'shortlisted')
          .in('job_id', jobIds),
        supabase
          .from('applications')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending')
          .in('job_id', jobIds),
        supabase
          .from('applications')
          .select('*, job:jobs(title)')
          .in('job_id', jobIds)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('job_views')
          .select('id', { count: 'exact', head: true })
          .in('job_id', jobIds),
        supabase
          .from('application_starts')
          .select('id', { count: 'exact', head: true })
          .in('job_id', jobIds),
      ]);

    totalApplications = totalAppsRes.count ?? 0;
    shortlisted = shortlistedRes.count ?? 0;
    pendingReview = pendingRes.count ?? 0;
    recentApps = (recentAppsRes.data as any[]) ?? [];
    totalViews = viewsRes.count ?? 0;
    totalStarts = startsRes.count ?? 0;
  }

  const completionRate =
    totalStarts > 0 ? Math.round((totalApplications / totalStarts) * 100) : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Welcome back, {company.company_name}
          </h1>
          <p className="text-slate-500 text-sm">
            Here is an overview of your hiring activity
          </p>
        </div>
        <Link
          href="/company/jobs/new"
          className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-700 transition-all"
        >
          + Post a Job
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard label="Active Jobs" value={activeJobCount} color="text-slate-900" />
        <StatsCard
          label="Total Applications"
          value={totalApplications}
          color="text-brand-600"
        />
        <StatsCard
          label="Shortlisted Candidates"
          value={shortlisted}
          color="text-emerald-600"
        />
        <StatsCard
          label="Pending Review"
          value={pendingReview}
          color="text-amber-600"
        />
      </div>

      {/* Funnel: views -> started -> submitted */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
        <h2 className="font-bold text-slate-900 mb-4">Job Visits & Drop-Off</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-extrabold text-slate-900">{totalViews}</p>
            <p className="text-xs font-medium text-slate-500 mt-1">Job Views</p>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900">{totalStarts}</p>
            <p className="text-xs font-medium text-slate-500 mt-1">Applications Started</p>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900">
              {completionRate === null ? '—' : `${completionRate}%`}
            </p>
            <p className="text-xs font-medium text-slate-500 mt-1">Completion Rate</p>
          </div>
        </div>
        {totalStarts > totalApplications && (
          <p className="text-xs text-slate-400 mt-4 text-center">
            {totalStarts - totalApplications} candidate
            {totalStarts - totalApplications === 1 ? '' : 's'} started an application but didn&apos;t submit.
          </p>
        )}
      </div>

      {/* Recent Applications */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Recent Applications</h2>
          <Link
            href="/company/applications"
            className="text-sm text-brand-600 font-medium hover:underline"
          >
            View all
          </Link>
        </div>
        {recentApps.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">
            No applications yet. Post a job to start receiving applications.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Applicant</th>
                  <th className="px-6 py-3">Job Title</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {app.full_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {app.job?.title ?? '-'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                      {new Date(app.created_at).toLocaleDateString('en-ZA')}
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
