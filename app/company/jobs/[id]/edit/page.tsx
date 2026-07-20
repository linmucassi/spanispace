'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const JOB_TYPES = [
  'Full-time',
  'Part-time',
  'Piece Job',
  'Temporary',
  'Contract',
  'Remote',
  'Hybrid',
  'On-site',
  'Learnership',
  'Internship',
  'Once-off',
];

type JobForm = {
  title: string;
  description: string;
  requirements: string;
  location: string;
  job_type: string;
  duration: string;
  salary_range: string;
  expiry_date: string;
};

export default function CompanyEditJob() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const jobId = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [form, setForm] = useState<JobForm>({
    title: '',
    description: '',
    requirements: '',
    location: '',
    job_type: 'Full-time',
    duration: '',
    salary_range: '',
    expiry_date: '',
  });

  useEffect(() => {
    async function fetchJob() {
      if (!jobId) return;

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

      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .eq('company_id', company.id)
        .single();

      if (jobError || !job) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setForm({
        title: job.title ?? '',
        description: job.description ?? '',
        requirements: job.requirements ?? '',
        location: job.location ?? '',
        job_type: job.job_type ?? 'Full-time',
        duration: job.duration ?? '',
        salary_range: job.salary_range ?? '',
        expiry_date: job.expiry_date ?? '',
      });
      setLoading(false);
    }

    fetchJob();
  }, [jobId, router]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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

    const payload: Record<string, unknown> = {
      title: form.title,
      description: form.description,
      requirements: form.requirements || null,
      location: form.location,
      job_type: form.job_type,
      ...(form.duration.trim() ? { duration: form.duration.trim() } : {}),
      salary_range: form.salary_range || null,
      expiry_date: form.expiry_date,
    };

    let { error: dbError } = await supabase.from('jobs').update(payload).eq('id', jobId);

    // Retry without duration if the column does not exist yet
    if (dbError && 'duration' in payload && (dbError.code === 'PGRST204' || dbError.message?.includes('duration'))) {
      const rest = { ...payload };
      delete rest.duration;
      ({ error: dbError } = await supabase.from('jobs').update(rest).eq('id', jobId));
    }

    setSaving(false);

    if (dbError) {
      setError(dbError.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push('/company/jobs'), 1500);
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
          <h2 className="text-xl font-bold text-red-800 mb-2">Job not found</h2>
          <p className="text-red-700 text-sm mb-4">
            This job does not exist or you do not have permission to edit it.
          </p>
          <Link
            href="/company/jobs"
            className="inline-flex bg-white border border-red-200 text-red-700 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
          >
            Back to My Jobs
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-green-800 mb-2">
            Job Updated
          </h2>
          <p className="text-green-700 text-sm">
            Changes saved. Redirecting...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Edit Job</h1>
          <p className="text-slate-500 text-sm mt-1">
            Update the details below.
          </p>
        </div>
        <Link
          href="/company/jobs"
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          &larr; Back to Jobs
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Job Title *
          </label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Description *
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            rows={5}
            className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Requirements
          </label>
          <textarea
            name="requirements"
            value={form.requirements}
            onChange={handleChange}
            rows={4}
            className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Location *
            </label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              required
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Job Type
            </label>
            <select
              name="job_type"
              value={form.job_type}
              onChange={handleChange}
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              {JOB_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Salary Range
            </label>
            <input
              name="salary_range"
              value={form.salary_range}
              onChange={handleChange}
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Duration (optional)
            </label>
            <input
              name="duration"
              value={form.duration}
              onChange={handleChange}
              placeholder="e.g. 3 months, Weekends"
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Expiry Date *
            </label>
            <input
              name="expiry_date"
              type="date"
              value={form.expiry_date}
              onChange={handleChange}
              required
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
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
            onClick={() => router.push('/company/jobs')}
            className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
