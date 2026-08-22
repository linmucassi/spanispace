'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-green-100 text-green-700',
  declined: 'bg-slate-100 text-slate-600',
};

type Row = {
  id: string;
  message: string | null;
  status: string;
  created_at: string;
  job: { title: string } | null;
  company_profiles: { company_name: string } | null;
  candidate_profiles: { full_name: string } | null;
};

// Read-only oversight, per "admins must always see the full flow" -- nothing
// to action here (the company/candidate own accept/decline and send).
export default function AdminInvites() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      if (!supabase) { setLoading(false); return; }
      const { data } = await supabase
        .from('job_invites')
        .select('id, message, status, created_at, job:jobs(title), company_profiles(company_name), candidate_profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(200);
      setRows(
        ((data ?? []) as any[]).map((r) => ({
          ...r,
          job: Array.isArray(r.job) ? r.job[0] ?? null : r.job,
          company_profiles: Array.isArray(r.company_profiles) ? r.company_profiles[0] ?? null : r.company_profiles,
          candidate_profiles: Array.isArray(r.candidate_profiles) ? r.candidate_profiles[0] ?? null : r.candidate_profiles,
        }))
      );
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Invites</h1>
        <p className="text-slate-500 text-sm">All company-to-candidate invites, across every company</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600" /></div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">No invites sent yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Company</th>
                  <th className="px-6 py-3">Candidate</th>
                  <th className="px-6 py-3">Job</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{row.company_profiles?.company_name ?? '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{row.candidate_profiles?.full_name ?? '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{row.job?.title ?? 'Job removed'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold capitalize ${STATUS_STYLES[row.status] ?? 'bg-slate-100 text-slate-700'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                      {new Date(row.created_at).toLocaleDateString('en-ZA')}
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
