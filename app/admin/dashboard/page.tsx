'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import type { AdminStats, DbApplication } from '@/types/database';

function StatsCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
      <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
    </div>
  );
}

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

      const [jobs, pendingJobs, apps, weekApps, waitlist, trainings, learnerships, recent] =
        await Promise.all([
          supabase.from('jobs').select('id', { count: 'exact', head: true }),
          supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('vetted_status', 'pending'),
          supabase.from('applications').select('id', { count: 'exact', head: true }),
          supabase.from('applications').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
          supabase.from('waitlist').select('id', { count: 'exact', head: true }),
          supabase.from('trainings').select('id', { count: 'exact', head: true }),
          supabase.from('learnerships').select('id', { count: 'exact', head: true }),
          supabase.from('applications').select('*, job:jobs(title)').order('created_at', { ascending: false }).limit(10),
        ]);

      setStats({
        totalJobs: jobs.count ?? 0,
        activeJobs: (jobs.count ?? 0) - (pendingJobs.count ?? 0),
        pendingJobs: pendingJobs.count ?? 0,
        totalApplications: apps.count ?? 0,
        weekApplications: weekApps.count ?? 0,
        totalWaitlist: waitlist.count ?? 0,
        totalTrainings: trainings.count ?? 0,
        totalLearnerships: learnerships.count ?? 0,
      });

      setRecentApps((recent.data as any[]) ?? []);
      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
        <h2 className="text-xl font-bold text-amber-800 mb-2">Supabase Not Connected</h2>
        <p className="text-amber-700">
          Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file,
          then run the schema from supabase/schema.sql in your Supabase SQL Editor.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm">Overview of your platform</p>
        </div>
        <Link
          href="/admin/jobs/new"
          className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-700 transition-all"
        >
          + Add Job
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard label="Active Jobs" value={stats.activeJobs} color="text-slate-900" />
        <StatsCard label="Pending Approval" value={stats.pendingJobs} color="text-amber-600" />
        <StatsCard label="Applications (7d)" value={stats.weekApplications} color="text-brand-600" />
        <StatsCard label="Waitlist Signups" value={stats.totalWaitlist} color="text-emerald-600" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard label="Total Applications" value={stats.totalApplications} color="text-slate-900" />
        <StatsCard label="Total Jobs" value={stats.totalJobs} color="text-slate-900" />
        <StatsCard label="Trainings" value={stats.totalTrainings} color="text-slate-900" />
        <StatsCard label="Learnerships" value={stats.totalLearnerships} color="text-slate-900" />
      </div>

      {/* Recent Applications */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Recent Applications</h2>
          <Link href="/admin/applications" className="text-sm text-brand-600 font-medium hover:underline">
            View all
          </Link>
        </div>
        {recentApps.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">No applications yet.</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3">Applicant</th>
                <th className="px-6 py-3">Job</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentApps.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{app.full_name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{(app as any).job?.title ?? '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{app.phone}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                      app.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      app.status === 'shortlisted' ? 'bg-green-100 text-green-700' :
                      app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                    {new Date(app.created_at).toLocaleDateString('en-ZA')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
