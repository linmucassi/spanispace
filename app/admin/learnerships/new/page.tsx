'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { normalizeUrl } from '@/lib/normalizeUrl';

// Learnerships are `jobs` rows with job_type = 'Learnership' -- the
// standalone `learnerships` table this form used to write to was never
// actually shown to candidates anywhere on the public site (dead code), so
// this got merged into the same pipeline every other job listing uses.
// See supabase/add-application-journeys.sql.
export default function AdminNewLearnership() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    provider: '',
    description: '',
    location: '',
    stipend: '',
    duration: '',
    apply_mode: 'redirect',
    apply_link: '',
    expiry_date: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (form.apply_mode === 'redirect' && !form.apply_link.trim()) {
      setError('Add an apply link, or switch to accepting applications on Spanispace.');
      setSaving(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) { setError('Supabase not configured'); setSaving(false); return; }

    const payload: Record<string, unknown> = {
      title: form.title,
      description: form.description,
      location: form.location,
      job_type: 'Learnership',
      origin: 'admin_curated',
      vetted_status: 'verified',
      status: 'active',
      poster_name: form.provider || null,
      salary_range: form.stipend || null,
      ...(form.duration.trim() ? { duration: form.duration.trim() } : {}),
      expiry_date: form.expiry_date,
      apply_mode: form.apply_mode,
      apply_link: form.apply_mode === 'redirect' ? normalizeUrl(form.apply_link) : null,
    };

    let { error: dbError } = await supabase.from('jobs').insert(payload);

    // Retry without duration if the column does not exist yet
    if (dbError && 'duration' in payload && (dbError.code === 'PGRST204' || dbError.message?.includes('duration'))) {
      const rest = { ...payload };
      delete rest.duration;
      ({ error: dbError } = await supabase.from('jobs').insert(rest));
    }

    // Retry without origin/apply_mode if supabase/add-application-journeys.sql hasn't run yet
    if (dbError && 'origin' in payload && (dbError.code === 'PGRST204' || dbError.message?.includes('origin') || dbError.message?.includes('apply_mode'))) {
      const rest = { ...payload };
      delete rest.origin;
      delete rest.apply_mode;
      ({ error: dbError } = await supabase.from('jobs').insert(rest));
    }

    setSaving(false);
    if (dbError) { setError(dbError.message); return; }
    router.push('/admin/learnerships');
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Add Learnership</h1>
      <p className="text-slate-500 text-sm mb-8">Create a new learnership listing</p>
      <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Title *</label><input name="title" value={form.title} onChange={handleChange} required className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 outline-none" /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Provider *</label><input name="provider" value={form.provider} onChange={handleChange} required placeholder="e.g. SAB, Clover, OUTsurance" className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 outline-none" /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Description *</label><textarea name="description" value={form.description} onChange={handleChange} required rows={4} placeholder="What the learnership covers, who it's for..." className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 outline-none resize-none" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Location *</label><input name="location" value={form.location} onChange={handleChange} required className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 outline-none" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Stipend</label><input name="stipend" value={form.stipend} onChange={handleChange} placeholder="e.g. R4,500/month" className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 outline-none" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Duration</label><input name="duration" value={form.duration} onChange={handleChange} placeholder="e.g. 12 months" className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 outline-none" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date *</label><input name="expiry_date" type="date" value={form.expiry_date} onChange={handleChange} required className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 outline-none" /></div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">How do candidates apply?</label>
          <div className="flex flex-col sm:flex-row gap-3 text-sm">
            <label className="flex items-center gap-2 border border-slate-200 rounded-xl px-4 py-3 flex-1 cursor-pointer has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
              <input type="radio" name="apply_mode" value="redirect" checked={form.apply_mode === 'redirect'} onChange={handleChange} />
              Redirect to an external link
            </label>
            <label className="flex items-center gap-2 border border-slate-200 rounded-xl px-4 py-3 flex-1 cursor-pointer has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
              <input type="radio" name="apply_mode" value="on_platform" checked={form.apply_mode === 'on_platform'} onChange={handleChange} />
              Accept applications on Spanispace
            </label>
          </div>
        </div>

        {form.apply_mode === 'redirect' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Apply Link *</label>
            <input name="apply_link" value={form.apply_link} onChange={handleChange} type="text" inputMode="url" required
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 outline-none" />
          </div>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 disabled:opacity-50">{saving ? 'Saving...' : 'Create Learnership'}</button>
          <button type="button" onClick={() => router.push('/admin/learnerships')} className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}
