'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/context';
import { submitNetlifyForm } from '@/lib/netlifyForms';
import { createClient } from '@/lib/supabase/client';
import type { CandidateDocument } from '@/components/candidate/DocumentLibrary';
import { FileText, CheckSquare, Square } from 'lucide-react';

type Props = {
  jobId: string;
  jobRole: string;
  jobCompany: string;
};

const DOC_LABELS: Record<string, string> = {
  cv: 'CV / Resume',
  certificate: 'Certificate',
  cover_letter: 'Cover Letter',
  motivational_letter: 'Motivational Letter',
  other: 'Other',
};

const DOC_COLORS: Record<string, string> = {
  cv: 'bg-indigo-100 text-indigo-700',
  certificate: 'bg-emerald-100 text-emerald-700',
  cover_letter: 'bg-amber-100 text-amber-700',
  motivational_letter: 'bg-purple-100 text-purple-700',
  other: 'bg-slate-100 text-slate-600',
};

export default function ApplyForm({ jobId, jobRole, jobCompany }: Props) {
  const { t } = useTranslation();

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

  const [docs, setDocs] = useState<CandidateDocument[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    async function loadProfileAndDocs() {
      const supabase = createClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, docsRes] = await Promise.all([
        supabase
          .from('candidate_profiles')
          .select('full_name, phone, whatsapp, location')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('candidate_documents')
          .select('id, name, doc_type, file_url, file_size_kb, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      setForm((prev) => ({
        ...prev,
        email: user.email ?? prev.email,
        fullName: profileRes.data?.full_name ?? prev.fullName,
        phone: profileRes.data?.phone ?? prev.phone,
        whatsapp: profileRes.data?.whatsapp ?? prev.whatsapp,
        location: profileRes.data?.location ?? prev.location,
      }));

      const loadedDocs = (docsRes.data as CandidateDocument[]) ?? [];
      setDocs(loadedDocs);

      // Auto-select the most recent CV
      const latestCv = loadedDocs.find((d) => d.doc_type === 'cv');
      if (latestCv) setSelectedDocIds(new Set([latestCv.id]));

      setProfileLoaded(true);
    }
    loadProfileAndDocs();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  function toggleDoc(id: string) {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.fullName.trim() || !form.phone.trim()) {
      setError(t('apply.required'));
      return;
    }

    setSubmitting(true);

    const selectedDocs = docs.filter((d) => selectedDocIds.has(d.id));
    const docsSummary = selectedDocs
      .map((d) => `${DOC_LABELS[d.doc_type] ?? d.doc_type}: ${d.name} — ${d.file_url}`)
      .join('\n');

    const ok = await submitNetlifyForm('job-application', {
      'job-id': jobId,
      'job-title': jobRole,
      'full-name': form.fullName,
      phone: form.phone,
      whatsapp: form.whatsapp,
      email: form.email,
      location: form.location,
      'about-you': form.aboutYou,
      ...(docsSummary ? { 'attached-documents': docsSummary } : {}),
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
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            {t('apply.successTitle')}
          </h1>
          <p className="text-slate-600 mb-8">{t('apply.successMessage')}</p>
          <Link
            href={`/jobs/${jobId}`}
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
          href={`/jobs/${jobId}`}
          className="inline-flex items-center text-sm text-indigo-600 font-medium hover:underline mb-6"
        >
          {t('apply.backToJob')}
        </Link>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {t('apply.title')}
          </h1>
          <p className="text-slate-500 mb-8">
            {t('apply.applyingFor')}:{' '}
            <span className="font-semibold text-slate-700">{jobRole}</span> at{' '}
            <span className="font-semibold text-slate-700">{jobCompany}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
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

            {/* Document picker — signed-in users only */}
            {docs.length > 0 && (
              <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium text-slate-700">
                  Attach from your document library
                </p>
                {docs.map((doc) => {
                  const selected = selectedDocIds.has(doc.id);
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => toggleDoc(doc.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                        selected
                          ? 'border-indigo-400 bg-indigo-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      {selected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {doc.name}
                        </p>
                        <span
                          className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 ${DOC_COLORS[doc.doc_type] ?? 'bg-slate-100 text-slate-600'}`}
                        >
                          {DOC_LABELS[doc.doc_type] ?? doc.doc_type}
                        </span>
                      </div>
                    </button>
                  );
                })}
                <p className="text-xs text-slate-400 pt-1">
                  Selected documents are included with your application.{' '}
                  <Link href="/candidate/profile" className="text-indigo-500 hover:underline">
                    Manage documents
                  </Link>
                </p>
              </div>
            )}

            {profileLoaded && docs.length === 0 && (
              <div className="text-xs text-slate-500 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                No documents in your library.{' '}
                <Link href="/candidate/profile" className="text-indigo-500 hover:underline">
                  Upload your CV and supporting documents
                </Link>{' '}
                to attach them here.
              </div>
            )}

            {error && (
              <p className="text-red-600 text-sm text-center">{error}</p>
            )}

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
