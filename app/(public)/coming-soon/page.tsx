'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { submitNetlifyForm } from '@/lib/netlifyForms';

export default function ComingSoon() {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'Bootcamp',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim()) {
      setError(t('apply.required'));
      return;
    }

    setSubmitting(true);
    const ok = await submitNetlifyForm('waitlist', {
      name: form.name,
      email: form.email,
      phone: form.phone,
      type: form.type,
    });

    setSubmitting(false);
    if (ok) {
      setSubmitted(true);
    } else {
      setError(t('apply.error'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-blue-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-lg w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-10 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Coming Soon</h1>
          <p className="text-lg text-gray-600">
            Bootcamps, short courses, events &amp; hackathons launching soon.
          </p>
          <p className="text-gray-600 mt-1">Join the reminder list and be the first to know!</p>
        </div>

        {submitted ? (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">You&apos;re on the list!</h2>
            <p className="text-gray-600">
              We&apos;ll send you a notification as soon as registration opens.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Thabo Mokoena"
                className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone (optional)
              </label>
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="+27 82 123 4567"
                className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                I&apos;m interested in
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="Bootcamp">Bootcamp</option>
                <option value="Course">Short Course</option>
                <option value="Event/Hackathon">Event / Hackathon</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {error && <p className="text-red-600 text-center text-sm">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-full transition-all shadow-md disabled:opacity-50"
            >
              {submitting ? t('apply.submitting') : 'Join the Reminder List'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
