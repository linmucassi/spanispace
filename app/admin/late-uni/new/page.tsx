'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminNewLateUni() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ institution: '', programs: '', application_type: 'Late Application', closing_date: '', notes: '', apply_link: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    if (!supabase) { setError('Supabase not configured'); setSaving(false); return; }

    const { error: dbError } = await supabase.from('late_uni_apps').insert({
      institution: form.institution, programs: form.programs || null,
      application_type: form.application_type, closing_date: form.closing_date || null,
      notes: form.notes || null, apply_link: form.apply_link || null, status: 'open',
    });

    setSaving(false);
    if (dbError) { setError(dbError.message); return; }
    router.push('/admin/late-uni');
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Add Late Uni Application</h1>
      <p className="text-slate-500 text-sm mb-8">Add a tertiary institution deadline</p>
      <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Institution *</label><input name="institution" value={form.institution} onChange={handleChange} required placeholder="e.g. University of Cape Town" className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 outline-none" /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Programs</label><input name="programs" value={form.programs} onChange={handleChange} placeholder="e.g. BSc Computer Science, BCom" className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 outline-none" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Application Type</label><select name="application_type" value={form.application_type} onChange={handleChange} className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm bg-white focus:border-indigo-500 outline-none"><option>Late Application</option><option>Standard</option><option>Learnership</option></select></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Closing Date</label><input name="closing_date" type="date" value={form.closing_date} onChange={handleChange} className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 outline-none" /></div>
        </div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Notes</label><textarea name="notes" value={form.notes} onChange={handleChange} rows={2} className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 outline-none resize-none" /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Apply Link</label><input name="apply_link" value={form.apply_link} onChange={handleChange} type="url" className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 outline-none" /></div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving...' : 'Create Entry'}</button>
          <button type="button" onClick={() => router.push('/admin/late-uni')} className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}
