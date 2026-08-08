'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { DbLateUniApp } from '@/types/database';

export default function AdminLateUni() {
  const [items, setItems] = useState<DbLateUniApp[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('late_uni_apps').select('*').order('created_at', { ascending: false });
    setItems((data as DbLateUniApp[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    const supabase = createClient();
    if (!supabase) return;
    await supabase.from('late_uni_apps').delete().eq('id', id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-extrabold text-slate-900">Late Uni Applications</h1><p className="text-slate-500 text-sm">Manage tertiary application deadlines</p></div>
        <Link href="/admin/late-uni/new" className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-700">+ Add Entry</Link>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600" /></div>
        ) : items.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">No entries yet.</div>
        ) : (
          <table className="w-full text-left">
            <thead><tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider"><th className="px-6 py-3">Institution</th><th className="px-6 py-3">Type</th><th className="px-6 py-3">Closing Date</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4"><span className="text-sm font-bold text-slate-900">{item.institution}</span>{item.programs && <span className="block text-xs text-slate-500">{item.programs}</span>}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.application_type || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-mono">{item.closing_date || '-'}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${item.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.status}</span></td>
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
