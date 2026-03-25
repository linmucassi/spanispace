'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '../../lib/i18n/context';
import { submitNetlifyForm } from '../../lib/netlifyForms';

export default function PostJobPage() {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    companyName: '',
    phone: '',
    whatsapp: '',
    email: '',
    jobTitle: '',
    description: '',
    location: '',
    jobType: 'Full-time',
    pay: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.companyName.trim() || !form.phone.trim() || !form.jobTitle.trim() || !form.description.trim() || !form.location.trim()) {
      setError(t('apply.required'));
      return;
    }

    setSubmitting(true);
    const ok = await submitNetlifyForm('job-posting', {
      'company-name': form.companyName,
      phone: form.phone,
      whatsapp: form.whatsapp,
      email: form.email,
      'job-title': form.jobTitle,
      description: form.description,
      location: form.location,
      'job-type': form.jobType,
      pay: form.pay,
    });

    setSubmitting(false);
    if (ok) {
      setSubmitted(true);
    } else {
      setError(t('postJob.error'));
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
          <h1 className="text-3xl font-bold text-slate-900 mb-3">{t('postJob.successTitle')}</h1>
          <p className="text-slate-600 mb-8">{t('postJob.successMessage')}</p>
          <button
            onClick={() => {
              setSubmitted(false);
              setForm({
                companyName: '',
                phone: '',
                whatsapp: '',
                email: '',
                jobTitle: '',
                description: '',
                location: '',
                jobType: 'Full-time',
                pay: '',
              });
            }}
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition-all"
          >
            {t('postJob.postAnother')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 bg-gradient-to-b from-indigo-50/50 to-white">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('postJob.title')}</h1>
          <p className="text-slate-500 mb-8">{t('postJob.subtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Company / Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('postJob.yourName')} *
              </label>
              <input
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                required
                className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('postJob.phone')} *
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
                {t('postJob.whatsapp')}
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
                {t('postJob.email')}
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            <hr className="border-slate-100" />

            {/* Job Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('postJob.jobTitle')} *
              </label>
              <input
                name="jobTitle"
                value={form.jobTitle}
                onChange={handleChange}
                required
                placeholder={t('postJob.jobTitlePlaceholder')}
                className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('postJob.description')} *
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                rows={4}
                placeholder={t('postJob.descriptionPlaceholder')}
                className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('postJob.location')} *
              </label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                required
                placeholder={t('postJob.locationPlaceholder')}
                className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Job Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('postJob.jobType')}
              </label>
              <select
                name="jobType"
                value={form.jobType}
                onChange={handleChange}
                className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="Full-time">{t('postJob.fullTime')}</option>
                <option value="Part-time">{t('postJob.partTime')}</option>
                <option value="Contract">{t('postJob.contract')}</option>
                <option value="Once-off">{t('postJob.onceOff')}</option>
              </select>
            </div>

            {/* Pay */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('postJob.pay')}
              </label>
              <input
                name="pay"
                value={form.pay}
                onChange={handleChange}
                placeholder={t('postJob.payPlaceholder')}
                className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            {error && <p className="text-red-600 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-full font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? t('postJob.submitting') : t('postJob.submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
