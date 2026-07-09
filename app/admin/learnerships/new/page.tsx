'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { normalizeUrl } from '@/lib/normalizeUrl';

export default function AdminNewLearnership() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', provider: '', location: '', stipend: '', duration: '', apply_link: '', expiry_date: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    if (!supabase) { setError('Supabase not configured'); setSaving(false); return; }

    const { error: dbError } = await supabase.from('learnerships').insert({
      title: form.title, provider: form.provider, location: form.location || null,
      stipend: form.stipend || null, duration: form.duration || null,
      apply_link: form.apply_link ? normalizeUrl(form.apply_link) : null, expiry_date: form.expiry_date || null, vetted_status: 'verified',
    });

    setSaving(false);
    if (dbError) { setError(dbError.message); return; }
    router.push('/admin/learnerships');
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Add Learnership</h1>
      <p className="text-slate-500 text-sm mb-8">Create a new learnership listing</p>
      <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Title *</label><input name="title" value={form.title} onChange={handleChange} required className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 outline-none" /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Provider *</label><input name="provider" value={form.provider} onChange={handleChange} required placeholder="e.g. SAB, Clover, OUTsurance" className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 outline-none" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Location</label><input name="location" value={form.location} onChange={handleChange} className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 outline-none" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Stipend</label><input name="stipend" value={form.stipend} onChange={handleChange} placeholder="e.g. R4,500/month" className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 outline-none" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Duration</label><input name="duration" value={form.duration} onChange={handleChange} placeholder="e.g. 12 months" className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 outline-none" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label><input name="expiry_date" type="date" value={form.expiry_date} onChange={handleChange} className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 outline-none" /></div>
        </div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Apply Link</label><input name="apply_link" value={form.apply_link} onChange={handleChange} type="text" inputMode="url" className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 outline-none" /></div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving...' : 'Create Learnership'}</button>
          <button type="button" onClick={() => router.push('/admin/learnerships')} className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}
