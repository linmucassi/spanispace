'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { JOBS } from '../../../../data/constants';
import { useTranslation } from '../../../../lib/i18n/context';
import { submitNetlifyForm } from '../../../../lib/netlifyForms';

export default function ApplyPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const job = JOBS.find((j) => j.id === params.id);

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    whatsapp: '',
    email: '',
    location: '',
    aboutYou: '',
  });

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Job not found.</p>
      </div>
    );
  }

  const isExpired = new Date(job.expiryDate) < new Date();
  if (isExpired) {
    router.push(`/jobs/${job.id}`);
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.fullName.trim() || !form.phone.trim()) {
      setError(t('apply.required'));
      return;
    }

    setSubmitting(true);
    const ok = await submitNetlifyForm('job-application', {
      'job-id': job.id,
      'job-title': job.role,
      'full-name': form.fullName,
      phone: form.phone,
      whatsapp: form.whatsapp,
      email: form.email,
      location: form.location,
      'about-you': form.aboutYou,
    });

    setSubmitting(false);
    if (ok) {
      setSubmitted(true);
    } else {
      setError(t('apply.error'));
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">{t('apply.successTitle')}</h1>
          <p className="text-slate-600 mb-8">{t('apply.successMessage')}</p>
          <Link
            href={`/jobs/${job.id}`}
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition-all"
          >
            {t('apply.backToJob')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 bg-gradient-to-b from-indigo-50/50 to-white">
      <div className="max-w-lg mx-auto">
        <Link
          href={`/jobs/${job.id}`}
          className="inline-flex items-center text-sm text-indigo-600 font-medium hover:underline mb-6"
        >
          {t('apply.backToJob')}
        </Link>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('apply.title')}</h1>
          <p className="text-slate-500 mb-8">
            {t('apply.applyingFor')}: <span className="font-semibold text-slate-700">{job.role}</span>{' '}
            at <span className="font-semibold text-slate-700">{job.company}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('apply.fullName')} *
              </label>
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
                className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('apply.phone')} *
              </label>
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                required
                placeholder="+27 82 123 4567"
                className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('apply.whatsapp')}
              </label>
              <input
                name="whatsapp"
                type="tel"
                value={form.whatsapp}
                onChange={handleChange}
                className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('apply.email')}
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('apply.yourLocation')}
              </label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Soweto, Johannesburg"
                className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* About you */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('apply.aboutYou')}
              </label>
              <textarea
                name="aboutYou"
                value={form.aboutYou}
                onChange={handleChange}
                rows={4}
                placeholder={t('apply.aboutYouPlaceholder')}
                className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>

            {error && <p className="text-red-600 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-full font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? t('apply.submitting') : t('apply.submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
