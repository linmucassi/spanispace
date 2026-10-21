'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowRight, Briefcase, Building, FileText, GraduationCap, Hourglass, Mail, Plus, School, ShieldCheck } from 'lucide-react';
import type { AdminStats, DbApplication } from '@/types/database';
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

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentApps, setRecentApps] = useState<DbApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [jobs, pendingJobs, scrapedPendingJobs, apps, weekApps, trainings, learnerships, weekUniInterest, pendingVerifications, openInvites, recent] =
        await Promise.all([
          supabase.from('jobs').select('id', { count: 'exact', head: true }),
          supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('vetted_status', 'pending'),
          supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('vetted_status', 'pending').eq('origin', 'scraped'),
          supabase.from('applications').select('id', { count: 'exact', head: true }),
          supabase.from('applications').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
          supabase.from('trainings').select('id', { count: 'exact', head: true }),
          // Learnerships are `jobs` rows (job_type = 'Learnership') as of
          // supabase/add-application-journeys.sql, not the old standalone table.
          supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('job_type', 'Learnership'),
          supabase.from('university_application_interests').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
          supabase.from('candidate_documents').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending'),
          supabase.from('job_invites').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('applications').select('*, job:jobs(title)').order('created_at', { ascending: false }).limit(8),
        ]);

      setStats({
        totalJobs: jobs.count ?? 0,
        activeJobs: (jobs.count ?? 0) - (pendingJobs.count ?? 0),
        pendingJobs: pendingJobs.count ?? 0,
        scrapedPendingJobs: scrapedPendingJobs.count ?? 0,
        totalApplications: apps.count ?? 0,
        weekApplications: weekApps.count ?? 0,
        totalTrainings: trainings.count ?? 0,
        totalLearnerships: learnerships.count ?? 0,
        weekUniversityInterest: weekUniInterest.count ?? 0,
        pendingVerifications: pendingVerifications.count ?? 0,
        openInvites: openInvites.count ?? 0,
      });

      setRecentApps((recent.data as any[]) ?? []);
      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
        <h2 className="mb-2 text-xl font-bold text-amber-800">Supabase Not Connected</h2>
        <p className="text-amber-700">
          Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file,
          then run the schema from supabase/schema.sql in your Supabase SQL Editor.
        </p>
      </div>
    );
  }

  const liveShare = stats.totalJobs > 0 ? Math.round((stats.activeJobs / stats.totalJobs) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform"
        muted="overview"
        subtitle="Listings, people and everything waiting on a review."
        actions={
          <Link href="/admin/jobs/new" className={btnPrimary}>
            <Plus className="h-4 w-4" aria-hidden /> Add job
          </Link>
        }
      />

      {stats.scrapedPendingJobs > 0 && (
        <Link
          href="/admin/jobs?origin=scraped"
          className="flex items-center justify-between gap-3 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100"
        >
          <span>
            {stats.scrapedPendingJobs} scraped job{stats.scrapedPendingJobs === 1 ? '' : 's'} waiting for review before going live
          </span>
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
        </Link>
      )}

      {/* Headline numbers */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active jobs" value={stats.activeJobs} icon={Briefcase} href="/admin/jobs"
          ring={{ value: stats.activeJobs, max: Math.max(1, stats.totalJobs) }} hint={`${stats.totalJobs} jobs in total`} />
        <StatCard label="Pending approval" value={stats.pendingJobs} icon={Hourglass} tone="amber" href="/admin/jobs"
          hint="Jobs waiting for a review" />
        <StatCard label="Applications (7 days)" value={stats.weekApplications} icon={FileText} tone="violet" href="/admin/applications"
          hint={`${stats.totalApplications} in total`} />
        <StatCard label="University interest (7 days)" value={stats.weekUniversityInterest} icon={School} tone="emerald" href="/admin/university-applications"
          hint="New sign-ups this week" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title="Review queue" subtitle="Everything waiting on an admin">
          <ul className="space-y-1">
            {[
              { label: 'Jobs to approve', value: stats.pendingJobs, href: '/admin/jobs', icon: Briefcase, tone: 'bg-amber-50 text-amber-600' },
              { label: 'Candidate documents', value: stats.pendingVerifications, href: '/admin/candidate-verification', icon: ShieldCheck, tone: 'bg-emerald-50 text-emerald-600' },
              { label: 'Open invites', value: stats.openInvites, href: '/admin/invites', icon: Mail, tone: 'bg-brand-50 text-brand-600' },
            ].map(({ label, value, href, icon: Icon, tone }) => (
              <li key={href}>
                <Link href={href} className="-mx-3 flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-ink-50">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone}`}>
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="flex-1 text-sm font-medium text-ink-700">{label}</span>
                  <span className="stat-number text-2xl">{value}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Catalogue" subtitle="What candidates can browse" className="xl:col-span-2">
          <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
            <RingGauge
              value={liveShare}
              size={132}
              stroke={12}
              label={
                <span className="text-center">
                  <span className="block text-2xl font-extrabold text-ink-900">{liveShare}%</span>
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-ink-400">Jobs live</span>
                </span>
              }
            />
            <MeterList
              items={[
                { label: <span className="inline-flex items-center gap-2"><Briefcase className="h-3.5 w-3.5 text-ink-400" aria-hidden /> Jobs</span>, value: stats.totalJobs, tone: 'brand' },
                { label: <span className="inline-flex items-center gap-2"><Building className="h-3.5 w-3.5 text-ink-400" aria-hidden /> Learnerships</span>, value: stats.totalLearnerships, tone: 'violet' },
                { label: <span className="inline-flex items-center gap-2"><GraduationCap className="h-3.5 w-3.5 text-ink-400" aria-hidden /> Trainings</span>, value: stats.totalTrainings, tone: 'emerald' },
              ]}
            />
          </div>
        </Panel>
      </div>

      {/* Recent Applications */}
      <Panel
        title="Recent applications"
        action={
          <Link href="/admin/applications" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            View all
          </Link>
        }
        bodyClassName="p-3 pt-4"
      >
        {recentApps.length === 0 ? (
          <div className="px-6 py-12 text-center text-ink-400">No applications yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                  <th className="px-3 py-2">Applicant</th>
                  <th className="px-3 py-2">Job</th>
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentApps.map((app) => (
                  <tr key={app.id} className="hover:bg-ink-50 [&>td:first-child]:rounded-l-2xl [&>td:last-child]:rounded-r-2xl">
                    <td className="px-3 py-3 text-sm font-semibold text-ink-900">{app.full_name}</td>
                    <td className="px-3 py-3 text-sm text-ink-500">{(app as any).job?.title ?? '-'}</td>
                    <td className="px-3 py-3 text-sm tabular-nums text-ink-500">{app.phone}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-lg border px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[app.status] ?? 'border-ink-100 bg-ink-50 text-ink-600'}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm tabular-nums text-ink-400">
                      {new Date(app.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
