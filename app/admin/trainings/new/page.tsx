'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminNewTraining() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', description: '', category: 'Bootcamp', start_date: '', duration_weeks: '', format: 'online', skills_covered: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    if (!supabase) { setError('Supabase not configured'); setSaving(false); return; }

    const { error: dbError } = await supabase.from('trainings').insert({
      title: form.title, description: form.description || null, category: form.category,
      start_date: form.start_date || null, duration_weeks: form.duration_weeks ? parseInt(form.duration_weeks) : null,
      format: form.format, skills_covered: form.skills_covered ? form.skills_covered.split(',').map(s => s.trim()) : [],
      is_free: true, status: 'active',
    });

    setSaving(false);
    if (dbError) { setError(dbError.message); return; }
    router.push('/admin/trainings');
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Add Training</h1>
      <p className="text-slate-500 text-sm mb-8">Create a new bootcamp, short course, or event</p>
      <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Title *</label><input name="title" value={form.title} onChange={handleChange} required className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Description</label><textarea name="description" value={form.description} onChange={handleChange} rows={3} className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Category</label><select name="category" value={form.category} onChange={handleChange} className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm bg-white focus:border-indigo-500 outline-none"><option>Bootcamp</option><option>Short Course</option><option>Event</option></select></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Format</label><select name="format" value={form.format} onChange={handleChange} className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm bg-white focus:border-indigo-500 outline-none"><option value="online">Online</option><option value="hybrid">Hybrid</option><option value="in-person">In-person</option></select></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label><input name="start_date" type="date" value={form.start_date} onChange={handleChange} className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 outline-none" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Duration (weeks)</label><input name="duration_weeks" type="number" value={form.duration_weeks} onChange={handleChange} className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 outline-none" /></div>
        </div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Skills Covered (comma-separated)</label><input name="skills_covered" value={form.skills_covered} onChange={handleChange} placeholder="AI, Python, DevOps" className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 outline-none" /></div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving...' : 'Create Training'}</button>
          <button type="button" onClick={() => router.push('/admin/trainings')} className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}
