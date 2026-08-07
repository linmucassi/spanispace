'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  accessHelp,
  isFreeLevel,
  levelFromIsFree,
  isTrainingLevel,
  isMissingLevelColumn,
  withoutLevel,
  TRAINING_LEVELS,
  type TrainingLevel,
} from '@/lib/training-level';

const CATEGORIES = ['Bootcamp', 'Short Course', 'Event'];
const FORMATS = ['online', 'hybrid', 'in-person'];

type TrainingForm = {
  title: string;
  description: string;
  category: string;
  format: string;
  start_date: string;
  duration_weeks: string;
  skills_covered: string;
  level: TrainingLevel;
};

export default function CompanyEditTraining() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const trainingId = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [form, setForm] = useState<TrainingForm>({
    title: '',
    description: '',
    category: 'Bootcamp',
    format: 'online',
    start_date: '',
    duration_weeks: '',
    skills_covered: '',
    level: 'Beginner',
  });

  useEffect(() => {
    async function fetchTraining() {
      if (!trainingId) return;

      const supabase = createClient();
      if (!supabase) {
        setError('Unable to connect to database.');
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

      const { data: company } = await supabase
        .from('company_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!company) {
        setError('Company profile not found.');
        setLoading(false);
        return;
      }

      const { data: training, error: trainingError } = await supabase
        .from('trainings')
        .select('*')
        .eq('id', trainingId)
        .eq('company_id', company.id)
        .single();

      if (trainingError || !training) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setForm({
        title: training.title ?? '',
        description: training.description ?? '',
        category: training.category ?? 'Bootcamp',
        format: training.format ?? 'online',
        start_date: training.start_date ?? '',
        duration_weeks: training.duration_weeks ? String(training.duration_weeks) : '',
        skills_covered: (training.skills_covered ?? []).join(', '),
        // Rows written before the level column existed only carry is_free.
        level: isTrainingLevel(training.level) ? training.level : levelFromIsFree(training.is_free),
      });
      setLoading(false);
    }

    fetchTraining();
  }, [trainingId, router]);

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

    const supabase = createClient();
    if (!supabase) {
      setError('Unable to connect to database.');
      setSaving(false);
      return;
    }

    const row = {
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
      // supabase/add-training-levels.sql.
      is_free: isFreeLevel(form.level),
    };

    let { error: dbError } = await supabase.from('trainings').update(row).eq('id', trainingId);
    if (isMissingLevelColumn(dbError)) {
      ({ error: dbError } = await supabase
        .from('trainings')
        .update(withoutLevel(row))
        .eq('id', trainingId));
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-2xl">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-red-800 mb-2">Training not found</h2>
          <p className="text-red-700 text-sm mb-4">
            This training does not exist or you do not have permission to edit it.
          </p>
          <Link
            href="/company/training"
            className="inline-flex bg-white border border-red-200 text-red-700 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
          >
            Back to My Training
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-green-800 mb-2">Training Updated</h2>
          <p className="text-green-700 text-sm">Changes saved. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Edit Training</h1>
          <p className="text-slate-500 text-sm mt-1">Update the details below.</p>
        </div>
        <Link href="/company/training" className="text-sm text-slate-500 hover:text-slate-700">
          &larr; Back to Training
        </Link>
      </div>

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
            className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
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
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
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
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
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
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Skills Covered (comma-separated)</label>
          <input
            name="skills_covered"
            value={form.skills_covered}
            onChange={handleChange}
            className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
          <select
            name="level"
            value={form.level}
            onChange={handleChange}
            className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
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
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
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
