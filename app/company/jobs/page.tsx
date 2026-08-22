import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import JobActions from './JobActions';
import { resolveCompanyMembership } from '@/lib/company/resolveCompanyMembership';

function VettedBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    verified: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    rejected: 'bg-red-100 text-red-700',
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    closed: 'bg-slate-200 text-slate-600',
    draft: 'bg-blue-100 text-blue-700',
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

export default async function CompanyJobs() {
  const supabase = await createServerSupabase();
  if (!supabase) redirect('/login');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const membership = await resolveCompanyMembership(supabase, user.id);
  if (!membership) redirect('/company/profile');
  const company = { id: membership.companyId };

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false });

  // Fetch application, view, and application-start counts per job
  const jobIds = (jobs ?? []).map((j) => j.id);
  const appCounts: Record<string, number> = {};
  const viewCounts: Record<string, number> = {};
  const startCounts: Record<string, number> = {};

  if (jobIds.length > 0) {
    const [appsRes, viewsRes, startsRes] = await Promise.all([
      supabase.from('applications').select('job_id').in('job_id', jobIds),
      supabase.from('job_views').select('job_id').in('job_id', jobIds),
      supabase.from('application_starts').select('job_id').in('job_id', jobIds),
    ]);

    for (const row of appsRes.data ?? []) {
      appCounts[row.job_id] = (appCounts[row.job_id] || 0) + 1;
    }
    for (const row of viewsRes.data ?? []) {
      viewCounts[row.job_id] = (viewCounts[row.job_id] || 0) + 1;
    }
    for (const row of startsRes.data ?? []) {
      startCounts[row.job_id] = (startCounts[row.job_id] || 0) + 1;
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Jobs</h1>
          <p className="text-slate-500 text-sm">
            Manage your job listings
          </p>
        </div>
        <Link
          href="/company/jobs/new"
          className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-700 transition-all"
        >
          + Post New Job
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {!jobs || jobs.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              No jobs posted yet
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Create your first job listing to start receiving applications.
            </p>
            <Link
              href="/company/jobs/new"
              className="inline-flex bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-700 transition-all"
            >
              Post Your First Job
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Expiry</th>
                  <th className="px-6 py-3">Vetted</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Views</th>
                  <th className="px-6 py-3">Started</th>
                  <th className="px-6 py-3">Apps</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      {job.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {job.location}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {job.job_type}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                      {job.expiry_date}
                    </td>
                    <td className="px-6 py-4">
                      <VettedBadge status={job.vetted_status} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {viewCounts[job.id] || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {startCounts[job.id] || 0}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                      {appCounts[job.id] || 0}
                    </td>
                    <td className="px-6 py-4">
                      <JobActions jobId={job.id} currentStatus={job.status} />
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
