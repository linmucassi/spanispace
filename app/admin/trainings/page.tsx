'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { DbTraining } from '@/types/database';

export default function AdminTrainings() {
  const [items, setItems] = useState<DbTraining[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }
    let query = supabase.from('trainings').select('*').order('created_at', { ascending: false });
    if (filter === 'pending') query = query.eq('vetted_status', 'pending');
    if (filter === 'verified') query = query.eq('vetted_status', 'verified');
    if (filter === 'rejected') query = query.eq('vetted_status', 'rejected');
    const { data } = await query;
    setItems((data as DbTraining[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const updateVetted = async (id: string, vetted_status: string) => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.from('trainings').update({ vetted_status }).eq('id', id);
    load();
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this training?')) return;
    const supabase = createClient();
    if (!supabase) return;
    await supabase.from('trainings').delete().eq('id', id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Trainings</h1>
          <p className="text-slate-500 text-sm">Manage bootcamps, short courses, and events, including company submissions</p>
        </div>
        <Link href="/admin/trainings/new" className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-700 transition-all">
          + Add Training
        </Link>
      </div>

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

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600" /></div>
        ) : items.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">No trainings found.</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Source</th>
                <th className="px-6 py-3">Start Date</th>
                <th className="px-6 py-3">Format</th>
                <th className="px-6 py-3">Review</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">{item.title}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${item.category === 'Bootcamp' ? 'bg-brand-100 text-brand-700' : item.category === 'Event' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{item.category}</span></td>
                  <td className="px-6 py-4 text-sm text-slate-500">{item.company_id ? 'Company' : 'Platform'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-mono">{item.start_date || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.format || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      item.vetted_status === 'verified' ? 'bg-green-100 text-green-700' :
                      item.vetted_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>{item.vetted_status}</span>
                  </td>
                  <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{item.status}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {item.vetted_status === 'pending' && (
                        <button onClick={() => updateVetted(item.id, 'verified')} className="text-xs font-bold text-green-600 hover:underline">Approve</button>
                      )}
                      {item.vetted_status !== 'rejected' && (
                        <button onClick={() => updateVetted(item.id, 'rejected')} className="text-xs font-bold text-amber-600 hover:underline">Reject</button>
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
    </div>
  );
}
