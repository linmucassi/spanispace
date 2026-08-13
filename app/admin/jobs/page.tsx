'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { DbJob } from '@/types/database';
import { isExpiringSoon } from '@/lib/listingFreshness';
import { useConfirm } from '@/components/useConfirm';

export default function AdminJobs() {
  const [jobs, setJobs] = useState<DbJob[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [extendDays, setExtendDays] = useState(30);
  const [extending, setExtending] = useState(false);
  const { confirm, ConfirmDialog } = useConfirm();

  const loadJobs = async () => {
    const supabase = createClient();
    if (!supabase) return;

    let query = supabase.from('jobs').select('*').order('created_at', { ascending: false });
    if (filter === 'pending') query = query.eq('vetted_status', 'pending');
    if (filter === 'verified') query = query.eq('vetted_status', 'verified');
    if (filter === 'rejected') query = query.eq('vetted_status', 'rejected');

    const { data } = await query;
    setJobs((data as DbJob[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadJobs();
  }, [filter]);

  const updateStatus = async (id: string, vetted_status: string) => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.from('jobs').update({ vetted_status }).eq('id', id);
    loadJobs();
  };

  const deleteJob = async (id: string) => {
    if (!(await confirm('Delete this job permanently?'))) return;
    const supabase = createClient();
    if (!supabase) return;
    await supabase.from('jobs').delete().eq('id', id);
    loadJobs();
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) => (prev.size === jobs.length ? new Set() : new Set(jobs.map((j) => j.id))));
  };

  // Bulk expiry extension — before this, extending an expiring listing meant
  // deleting and recreating it, since there was no edit page for `jobs` at
  // all beyond vetting status.
  const extendSelectedExpiry = async () => {
    if (selected.size === 0 || extendDays <= 0) return;
    const supabase = createClient();
    if (!supabase) return;
    setExtending(true);
    for (const job of jobs) {
      if (!selected.has(job.id)) continue;
      const newExpiry = new Date(job.expiry_date);
      newExpiry.setDate(newExpiry.getDate() + extendDays);
      await supabase
        .from('jobs')
        .update({ expiry_date: newExpiry.toISOString().split('T')[0] })
        .eq('id', job.id);
    }
    setExtending(false);
    setSelected(new Set());
    loadJobs();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Jobs</h1>
          <p className="text-slate-500 text-sm">Manage job listings</p>
        </div>
        <Link
          href="/admin/jobs/new"
          className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-700 transition-all"
        >
          + Add Job
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['all', 'pending', 'verified', 'rejected'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Bulk expiry extension */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-brand-50 border border-brand-200 rounded-xl text-sm">
          <span className="font-medium text-brand-800">{selected.size} selected</span>
          <span className="text-brand-700">Extend expiry by</span>
          <input
            type="number"
            min={1}
            value={extendDays}
            onChange={(e) => setExtendDays(Number(e.target.value))}
            className="w-16 rounded-lg border border-brand-300 px-2 py-1 text-sm"
          />
          <span className="text-brand-700">days</span>
          <button
            onClick={extendSelectedExpiry}
            disabled={extending}
            className="ml-auto bg-brand-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-brand-700 disabled:opacity-50"
          >
            {extending ? 'Extending…' : 'Apply'}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">No jobs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={jobs.length > 0 && selected.size === jobs.length}
                      onChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </th>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Expiry</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selected.has(job.id)}
                        onChange={() => toggleSelect(job.id)}
                        aria-label={`Select ${job.title}`}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <span className="block text-sm font-bold text-slate-900">{job.title}</span>
                      <span className="text-xs text-slate-500">{job.poster_name || 'Company'}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{job.location}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{job.job_type}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                      {job.expiry_date}
                      {isExpiringSoon(job.expiry_date) && (
                        <span className="ml-2 inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-100 text-orange-700 font-sans">
                          Expiring soon
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                        job.vetted_status === 'verified' ? 'bg-green-100 text-green-700' :
                        job.vetted_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {job.vetted_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {job.vetted_status === 'pending' && (
                          <button
                            onClick={() => updateStatus(job.id, 'verified')}
                            className="text-xs font-bold text-green-600 hover:underline"
                          >
                            Approve
                          </button>
                        )}
                        {job.vetted_status !== 'rejected' && (
                          <button
                            onClick={() => updateStatus(job.id, 'rejected')}
                            className="text-xs font-bold text-amber-600 hover:underline"
                          >
                            Reject
                          </button>
                        )}
                        <button
                          onClick={() => deleteJob(job.id)}
                          className="text-xs font-bold text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {ConfirmDialog}
    </div>
  );
}
