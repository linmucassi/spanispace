'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  accessHelp,
  isFreeLevel,
  isMissingLevelColumn,
  withoutLevel,
  TRAINING_LEVELS,
  type TrainingLevel,
} from '@/lib/training-level';
import { resolveCompanyMembership } from '@/lib/company/resolveCompanyMembership';

const CATEGORIES = ['Bootcamp', 'Short Course', 'Event'];
const FORMATS = ['online', 'hybrid', 'in-person'];

export default function CompanyNewTraining() {
  const router = useRouter();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Bootcamp',
    format: 'online',
    start_date: '',
    duration_weeks: '',
    skills_covered: '',
    level: 'Beginner' as TrainingLevel,
  });

  useEffect(() => {
    async function fetchCompanyId() {
      const supabase = createClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const membership = await resolveCompanyMembership(supabase, user.id);
      if (membership) setCompanyId(membership.companyId);
      setLoading(false);
    }

    fetchCompanyId();
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setForm({ ...form, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    if (!companyId) {
      setError('Company profile not found. Please set up your profile first.');
      setSaving(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError('Unable to connect to database.');
      setSaving(false);
      return;
    }

    const row = {
      company_id: companyId,
      title: form.title,
      description: form.description || null,
      category: form.category,
      format: form.format,
      start_date: form.start_date || null,
      duration_weeks: form.duration_weeks ? parseInt(form.duration_weeks) : null,
      skills_covered: form.skills_covered
        ? form.skills_covered.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      level: form.level,
      // is_free is derived from level by the database trigger, see
      // supabase/add-training-levels.sql. Sent here only so the row reads
      // correctly to anything that queries before the trigger is installed.
      is_free: isFreeLevel(form.level),
      vetted_status: 'pending',
      status: 'active',
    };

    let { error: dbError } = await supabase.from('trainings').insert(row);
    if (isMissingLevelColumn(dbError)) {
      ({ error: dbError } = await supabase.from('trainings').insert(withoutLevel(row)));
    }

    setSaving(false);

    if (dbError) {
      setError(dbError.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push('/company/training'), 1500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-green-800 mb-2">Training Submitted</h2>
          <p className="text-green-700 text-sm">
            Your training is pending review by our team before it appears publicly. You will be redirected shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold text-slate-900 mb-2">New Training</h1>
      <p className="text-slate-500 text-sm mb-8">
        Offer a bootcamp, short course, or event directly to candidates. Submissions are reviewed before going live.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            placeholder="e.g. Frontend Development Bootcamp"
            className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            placeholder="What will candidates learn?"
            className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Format</label>
            <select
              name="format"
              value={form.format}
              onChange={handleChange}
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            >
              {FORMATS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
            <input
              name="start_date"
              type="date"
              value={form.start_date}
              onChange={handleChange}
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Duration (weeks)</label>
            <input
              name="duration_weeks"
              type="number"
              min="1"
              value={form.duration_weeks}
              onChange={handleChange}
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Skills Covered (comma-separated)</label>
          <input
            name="skills_covered"
            value={form.skills_covered}
            onChange={handleChange}
            placeholder="React, Node.js, SQL"
            className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
          <select
            name="level"
            value={form.level}
            onChange={handleChange}
            className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          >
            {TRAINING_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l === 'Beginner' ? 'Beginner, free for candidates' : 'Advanced, paid'}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1.5">{accessHelp(form.level)}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 transition-all disabled:opacity-50"
          >
            {saving ? 'Submitting...' : 'Submit Training'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/company/training')}
            className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
