'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { DbJob } from '@/types/database';
import { useConfirm } from '@/components/useConfirm';

// Learnerships are `jobs` rows with job_type = 'Learnership' -- see
// supabase/add-application-journeys.sql and app/admin/learnerships/new.
export default function AdminLearnerships() {
  const [items, setItems] = useState<DbJob[]>([]);
  const [loading, setLoading] = useState(true);
  const { confirm, ConfirmDialog } = useConfirm();

  const load = async () => {
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase
      .from('jobs')
      .select('*')
      .eq('job_type', 'Learnership')
      .order('created_at', { ascending: false });
    setItems((data as DbJob[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, vetted_status: string) => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.from('jobs').update({ vetted_status }).eq('id', id);
    load();
  };

  const deleteItem = async (id: string) => {
    if (!(await confirm('Delete this learnership?'))) return;
    const supabase = createClient();
    if (!supabase) return;
    await supabase.from('jobs').delete().eq('id', id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-extrabold text-slate-900">Learnerships</h1><p className="text-slate-500 text-sm">Manage learnership listings</p></div>
        <Link href="/admin/learnerships/new" className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-700">+ Add Learnership</Link>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600" /></div>
        ) : items.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">No learnerships yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider"><th className="px-6 py-3">Title</th><th className="px-6 py-3">Provider</th><th className="px-6 py-3">Location</th><th className="px-6 py-3">Expiry</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{item.title}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.poster_name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.location || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">{item.expiry_date || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                        item.vetted_status === 'verified' ? 'bg-green-100 text-green-700' :
                        item.vetted_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {item.vetted_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {item.vetted_status === 'pending' && (
                          <button onClick={() => updateStatus(item.id, 'verified')} className="text-xs font-bold text-green-600 hover:underline">Approve</button>
                        )}
                        {item.vetted_status !== 'rejected' && (
                          <button onClick={() => updateStatus(item.id, 'rejected')} className="text-xs font-bold text-amber-600 hover:underline">Reject</button>
                        )}
                        <button onClick={() => deleteItem(item.id)} className="text-xs font-bold text-red-600 hover:underline">Delete</button>
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
