'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminNewJob() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    job_type: 'Full-time',
    salary_range: '',
    expiry_date: '',
    vetted_status: 'verified',
    poster_name: 'Spanispace',
    poster_email: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const supabase = createClient();
    if (!supabase) {
      setError('Supabase not configured');
      setSaving(false);
      return;
    }

    const { error: dbError } = await supabase.from('jobs').insert({
      title: form.title,
      description: form.description,
      requirements: form.requirements || null,
      location: form.location,
      job_type: form.job_type,
      salary_range: form.salary_range || null,
      expiry_date: form.expiry_date,
      vetted_status: form.vetted_status,
      poster_name: form.poster_name || null,
      poster_email: form.poster_email || null,
      status: 'active',
    });

    setSaving(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }

    router.push('/admin/jobs');
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Add New Job</h1>
      <p className="text-slate-500 text-sm mb-8">Create a verified job listing</p>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Job Title *</label>
          <input name="title" value={form.title} onChange={handleChange} required
            className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
          <textarea name="description" value={form.description} onChange={handleChange} required rows={4}
            className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Requirements</label>
          <textarea name="requirements" value={form.requirements} onChange={handleChange} rows={3}
            className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Location *</label>
            <input name="location" value={form.location} onChange={handleChange} required
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Job Type</label>
            <select name="job_type" value={form.job_type} onChange={handleChange}
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none">
              <option>Full-time</option><option>Part-time</option><option>Piece Job</option>
              <option>Temporary</option><option>Contract</option>
              <option>Remote</option><option>Hybrid</option><option>On-site</option>
              <option>Learnership</option><option>Internship</option><option>Once-off</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Salary Range</label>
            <input name="salary_range" value={form.salary_range} onChange={handleChange} placeholder="e.g. R8,000 - R12,000/month"
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date *</label>
            <input name="expiry_date" type="date" value={form.expiry_date} onChange={handleChange} required
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Posted By</label>
            <input name="poster_name" value={form.poster_name} onChange={handleChange}
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Verification Status</label>
            <select name="vetted_status" value={form.vetted_status} onChange={handleChange}
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none">
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {error && <p className="text-red-600 text-sm text-center">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50">
            {saving ? 'Saving...' : 'Create Job'}
          </button>
          <button type="button" onClick={() => router.push('/admin/jobs')}
            className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
