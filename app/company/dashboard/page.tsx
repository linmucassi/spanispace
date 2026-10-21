import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, Eye, FileText, Hourglass, Plus, Star } from 'lucide-react';
import { resolveCompanyMembership } from '@/lib/company/resolveCompanyMembership';
import StatCard from '@/components/ui/StatCard';
import RingGauge from '@/components/ui/RingGauge';
import { Panel, PageHeader, MeterList, btnPrimary } from '@/components/ui/Panel';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  reviewed: 'bg-brand-50 text-brand-700 border-brand-100',
  shortlisted: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  rejected: 'bg-rose-50 text-rose-700 border-rose-100',
  hired: 'bg-violet-50 text-violet-700 border-violet-100',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-lg border px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[status] || 'border-ink-100 bg-ink-50 text-ink-600'}`}>
      {status}
    </span>
  );
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('') || '?';
}

export default async function CompanyDashboard() {
  const supabase = await createServerSupabase();
  if (!supabase) redirect('/login');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get company membership -- owner (company_profiles.user_id, unchanged)
  // or team member (company_members). See
  // supabase/add-roles-invites-and-calendar.sql PART C. companyName comes
  // back on the same query, no second round trip needed.
  const membership = await resolveCompanyMembership(supabase, user.id);
  if (!membership) redirect('/company/profile');
  const company = { id: membership.companyId, company_name: membership.companyName };

  // Get all job IDs for this company first
  const { data: companyJobs } = await supabase
    .from('jobs')
    .select('id, status')
    .eq('company_id', company.id);

  const jobIds = (companyJobs ?? []).map((j) => j.id);
  const activeJobCount = (companyJobs ?? []).filter((j) => j.status === 'active').length;

  // If no jobs, skip application queries
  let statuses: string[] = [];
  let recentApps: any[] = [];
  let totalViews = 0;
  let totalStarts = 0;

  if (jobIds.length > 0) {
    const [statusRes, recentAppsRes, viewsRes, startsRes] = await Promise.all([
      // Statuses only: totals, shortlisted, pending and the pipeline chart
      // all come from this one read.
      supabase.from('applications').select('status').in('job_id', jobIds),
      supabase
        .from('applications')
        .select('*, job:jobs(title)')
        .in('job_id', jobIds)
        .order('created_at', { ascending: false })
        .limit(8),
      supabase.from('job_views').select('id', { count: 'exact', head: true }).in('job_id', jobIds),
      supabase.from('application_starts').select('id', { count: 'exact', head: true }).in('job_id', jobIds),
    ]);

    statuses = ((statusRes.data as { status: string }[] | null) ?? []).map((a) => a.status);
    recentApps = (recentAppsRes.data as any[]) ?? [];
    totalViews = viewsRes.count ?? 0;
    totalStarts = startsRes.count ?? 0;
  }

  const totalApplications = statuses.length;
  const count = (status: string) => statuses.filter((st) => st === status).length;
  const shortlisted = count('shortlisted');
  const pendingReview = count('pending');

  const completionRate =
    totalStarts > 0 ? Math.round((totalApplications / totalStarts) * 100) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hiring"
        muted="overview"
        subtitle={`Welcome back, ${company.company_name}. Here is your hiring activity.`}
        actions={
          <Link href="/company/jobs/new" className={btnPrimary}>
            <Plus className="h-4 w-4" aria-hidden /> Post a job
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active jobs" value={activeJobCount} icon={Briefcase} href="/company/jobs"
          hint={`${(companyJobs ?? []).length} posted in total`} />
        <StatCard label="Applications" value={totalApplications} icon={FileText} tone="violet" href="/company/applications"
          hint={totalApplications === 0 ? 'Applications show up here' : 'Across all your jobs'} />
        <StatCard label="Shortlisted" value={shortlisted} icon={Star} tone="emerald"
          ring={totalApplications > 0 ? { value: shortlisted, max: totalApplications } : undefined}
          hint="Candidates you are moving forward" />
        <StatCard label="Waiting for review" value={pendingReview} icon={Hourglass} tone="amber" href="/company/applications"
          hint={pendingReview > 0 ? 'Candidates are waiting to hear back' : 'You are all caught up'} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Funnel: views -> started -> submitted */}
        <Panel title="Job visits and drop-off" subtitle="How people move from seeing a job to applying" className="xl:col-span-2">
          <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="flex flex-col items-center gap-2">
              <RingGauge
                value={completionRate ?? 0}
                size={132}
                stroke={12}
                tone="brand"
                label={
                  <span className="text-center">
                    <span className="block text-2xl font-extrabold text-ink-900">{completionRate === null ? '—' : `${completionRate}%`}</span>
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-ink-400">Completion</span>
                  </span>
                }
              />
            </div>
            <div>
              <MeterList
                max={Math.max(1, totalViews, totalStarts, totalApplications)}
                items={[
                  { label: <span className="inline-flex items-center gap-2"><Eye className="h-3.5 w-3.5 text-ink-400" aria-hidden /> Job views</span>, value: totalViews, tone: 'slate' },
                  { label: 'Applications started', value: totalStarts, tone: 'amber' },
                  { label: 'Applications submitted', value: totalApplications, tone: 'brand' },
                ]}
              />
              {totalStarts > totalApplications && (
                <p className="mt-4 text-xs text-ink-400">
                  {totalStarts - totalApplications} candidate
                  {totalStarts - totalApplications === 1 ? '' : 's'} started an application but didn&apos;t submit.
                </p>
              )}
            </div>
          </div>
        </Panel>

        <Panel title="Pipeline" subtitle={totalApplications > 0 ? `${totalApplications} applications` : 'No applications yet'}>
          <MeterList
            max={Math.max(1, totalApplications)}
            items={[
              { label: 'Waiting for review', value: pendingReview, tone: 'amber' },
              { label: 'Reviewed', value: count('reviewed'), tone: 'brand' },
              { label: 'Shortlisted', value: shortlisted, tone: 'emerald' },
              { label: 'Hired', value: count('hired'), tone: 'violet' },
              { label: 'Not this time', value: count('rejected'), tone: 'rose' },
            ]}
          />
        </Panel>
      </div>

      {/* Recent Applications */}
      <Panel
        title="Recent applications"
        action={
          <Link href="/company/applications" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            View all
          </Link>
        }
        bodyClassName="p-3 pt-4"
      >
        {recentApps.length === 0 ? (
          <div className="px-6 py-12 text-center text-ink-400">
            No applications yet. Post a job to start receiving applications.
          </div>
        ) : (
          <ul className="space-y-1">
            {recentApps.map((app) => (
              <li key={app.id} className="flex items-center gap-4 rounded-2xl px-3 py-3 hover:bg-ink-50">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                  {initials(app.full_name ?? '')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">{app.full_name}</p>
                  <p className="truncate text-xs text-ink-400">{app.job?.title ?? '-'}</p>
                </div>
                <span className="hidden shrink-0 text-xs tabular-nums text-ink-400 sm:block">
                  {new Date(app.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                </span>
                <StatusBadge status={app.status} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
