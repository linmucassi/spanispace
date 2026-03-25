'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { DbTraining } from '@/types/database';

export default function AdminTrainings() {
  const [items, setItems] = useState<DbTraining[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('trainings').select('*').order('created_at', { ascending: false });
    setItems((data as DbTraining[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

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
          <p className="text-slate-500 text-sm">Manage bootcamps, short courses, and events</p>
        </div>
        <Link href="/admin/trainings/new" className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all">
          + Add Training
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" /></div>
        ) : items.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">No trainings yet. Add your first bootcamp or course.</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Start Date</th>
                <th className="px-6 py-3">Format</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">{item.title}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${item.category === 'Bootcamp' ? 'bg-indigo-100 text-indigo-700' : item.category === 'Event' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{item.category}</span></td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-mono">{item.start_date || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.format || '-'}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{item.status}</span></td>
                  <td className="px-6 py-4"><button onClick={() => deleteItem(item.id)} className="text-xs font-bold text-red-600 hover:underline">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
