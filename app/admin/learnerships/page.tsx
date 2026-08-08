'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { DbLearnership } from '@/types/database';

export default function AdminLearnerships() {
  const [items, setItems] = useState<DbLearnership[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('learnerships').select('*').order('created_at', { ascending: false });
    setItems((data as DbLearnership[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this learnership?')) return;
    const supabase = createClient();
    if (!supabase) return;
    await supabase.from('learnerships').delete().eq('id', id);
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
          <table className="w-full text-left">
            <thead><tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider"><th className="px-6 py-3">Title</th><th className="px-6 py-3">Provider</th><th className="px-6 py-3">Location</th><th className="px-6 py-3">Expiry</th><th className="px-6 py-3">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">{item.title}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.provider}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.location || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-mono">{item.expiry_date || '-'}</td>
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
