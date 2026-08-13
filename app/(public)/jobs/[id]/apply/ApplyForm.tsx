'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/context';
import { submitNetlifyForm } from '@/lib/netlifyForms';
import { createClient } from '@/lib/supabase/client';
import { logJobEvent } from '@/lib/jobAnalytics';
import { fetchMyApplicationForJob, formatAppliedDate } from '@/lib/applications';
import type { CandidateDocument } from '@/components/candidate/DocumentLibrary';
import PhoneInput from '@/components/PhoneInput';
import { FileText, CheckSquare, Square, CheckCircle2 } from 'lucide-react';

type Props = {
  jobId: string;
  jobRole: string;
  jobCompany: string;
  jobSource: 'db' | 'static';
};

const DOC_LABELS: Record<string, string> = {
  cv: 'CV / Resume',
  certificate: 'Certificate',
  cover_letter: 'Cover Letter',
  motivational_letter: 'Motivational Letter',
  other: 'Other',
};

const DOC_COLORS: Record<string, string> = {
  cv: 'bg-brand-100 text-brand-700',
  certificate: 'bg-emerald-100 text-emerald-700',
  cover_letter: 'bg-amber-100 text-amber-700',
  motivational_letter: 'bg-purple-100 text-purple-700',
  other: 'bg-ink-100 text-ink-600',
};

export default function ApplyForm({ jobId, jobRole, jobCompany, jobSource }: Props) {
  const { t } = useTranslation();

  useEffect(() => {
    if (jobSource === 'db') {
      logJobEvent('application_starts', jobId);
    }
  }, [jobId, jobSource]);

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [appliedAt, setAppliedAt] = useState<string | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
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
      if (!supabase) {
        setProfileLoaded(true);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Signed out is a loaded state too, the form still renders and the
        // sign in prompt depends on knowing this.
        setProfileLoaded(true);
        return;
      }
      setIsSignedIn(true);

      if (jobSource === 'db') {
        const mine = await fetchMyApplicationForJob(jobId);
        if (mine.appliedAt) setAppliedAt(mine.appliedAt);
      }

      const [profileRes, docsRes] = await Promise.all([
        supabase
          .from('candidate_profiles')
          .select('*')
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
        // The professional profile built from informal work experience is
        // exactly what "tell us about yourself" is asking for
        aboutYou: prev.aboutYou || (profileRes.data?.professional_summary ?? ''),
      }));

      const loadedDocs = (docsRes.data as CandidateDocument[]) ?? [];
      setDocs(loadedDocs);

      // Auto-select the most recent CV
      const latestCv = loadedDocs.find((d) => d.doc_type === 'cv');
      if (latestCv) setSelectedDocIds(new Set([latestCv.id]));

      setProfileLoaded(true);
    }
    loadProfileAndDocs();
  }, [jobId, jobSource]);

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

    // Only real, company-owned listings have a matching row in `jobs` --
    // static fallback jobs (used when Supabase has no active data) have no
    // FK target, so those still go through Netlify Forms only, as before.
    //
    // The insert moved server side so the confirmation email can be sent by
    // something holding the API key, the candidate profile can be provisioned
    // before the row is written, and a duplicate comes back as a duplicate
    // rather than as a raw Postgres error.
    if (jobSource === 'db') {
      let response: Response;
      try {
        response = await fetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // The job title and company are deliberately not sent. The route
            // reads them back from the database, so nothing a caller types can
            // reach an email signed by spanispace.com.
            jobId,
            fullName: form.fullName,
            phone: form.phone,
            whatsapp: form.whatsapp,
            email: form.email,
            location: form.location,
            aboutYou: form.aboutYou,
            documentIds: selectedDocs.map((d) => d.id),
          }),
        });
      } catch {
        setSubmitting(false);
        setError(t('apply.error'));
        return;
      }

      const result = await response.json().catch(() => null);

      if (response.status === 409) {
        setSubmitting(false);
        setAppliedAt(result?.appliedAt ?? new Date().toISOString());
        return;
      }

      if (!response.ok) {
        setSubmitting(false);
        setError(result?.error ?? t('apply.error'));
        return;
      }

      setEmailSent(Boolean(result?.emailSent));
    }

    // For `db` jobs this is a best-effort duplicate notification -- the
    // Supabase insert above is the source of truth portals read. For
    // `static` fallback jobs this is the only channel, so its result decides
    // success.
    const docsSummary = selectedDocs
      .map((d) => `${DOC_LABELS[d.doc_type] ?? d.doc_type}: ${d.name}: ${d.file_url}`)
      .join('\n');
    const netlifyOk = await submitNetlifyForm('job-application', {
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
    if (jobSource === 'db' || netlifyOk) {
      setSubmitted(true);
    } else {
      setError(t('apply.error'));
    }
  };

  // Already applied, whether we knew that on arrival or only found out when
  // the server rejected a second attempt. Shown instead of the form, so there
  // is no way to send the same application twice.
  if (appliedAt) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-ink-900 mb-3">
            {t('apply.alreadyAppliedTitle')}
          </h1>
          <p className="text-ink-600 mb-2">{t('apply.alreadyAppliedMessage')}</p>
          <p className="text-sm text-ink-500 mb-8">
            {t('apply.appliedOn')} {formatAppliedDate(appliedAt)}
          </p>
          <div className="space-y-3">
            <Link
              href="/candidate/applications"
              className="block bg-brand-600 text-white px-8 py-3 rounded-full font-bold hover:bg-brand-700 transition-all"
            >
              {t('apply.viewMyApplications')}
            </Link>
            <Link
              href={`/jobs/${jobId}`}
              className="block text-sm text-brand-600 font-medium hover:underline"
            >
              {t('apply.backToJob')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-ink-900 mb-3">
            {t('apply.successTitle')}
          </h1>
          <p className="text-ink-600 mb-8">
            {emailSent ? t('apply.successEmailed') : t('apply.successMessage')}
          </p>
          <Link
            href={`/jobs/${jobId}`}
            className="inline-block bg-brand-600 text-white px-8 py-3 rounded-full font-bold hover:bg-brand-700 transition-all"
          >
            {t('apply.backToJob')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 bg-gradient-to-b from-brand-50/50 to-white">
      <div className="max-w-lg mx-auto">
        <Link
          href={`/jobs/${jobId}`}
          className="inline-flex items-center text-sm text-brand-600 font-medium hover:underline mb-6"
        >
          {t('apply.backToJob')}
        </Link>

        <div className="bg-white rounded-2xl shadow-xl border border-ink-100 p-8">
          <h1 className="text-2xl font-bold text-ink-900 mb-2">
            {t('apply.title')}
          </h1>
          <p className="text-ink-500 mb-8">
            {t('apply.applyingFor')}:{' '}
            <span className="font-semibold text-ink-700">{jobRole}</span> at{' '}
            <span className="font-semibold text-ink-700">{jobCompany}</span>
          </p>

          {/* Signed-out applications cannot be linked to an account, so they
              never reach the candidate's dashboard and cannot be deduplicated.
              Say so before they fill the form in, not after. */}
          {profileLoaded && !isSignedIn && jobSource === 'db' && (
            <div className="mb-6 text-sm text-ink-600 bg-brand-50 border border-brand-100 rounded-2xl px-4 py-3">
              {t('apply.signInPrompt')}{' '}
              <Link href="/login" className="text-brand-600 font-medium hover:underline">
                {t('apply.signIn')}
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">
                {t('apply.fullName')} *
              </label>
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
                className="block w-full rounded-xl border border-ink-200 px-4 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">
                {t('apply.phone')} *
              </label>
              <PhoneInput
                value={form.phone}
                onChange={(value) => setForm({ ...form, phone: value })}
                required
                containerClassName="rounded-xl border border-ink-200 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500"
                inputClassName="px-4 py-3"
                prefixClassName="px-4"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">
                {t('apply.whatsapp')}
              </label>
              <PhoneInput
                value={form.whatsapp}
                onChange={(value) => setForm({ ...form, whatsapp: value })}
                containerClassName="rounded-xl border border-ink-200 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500"
                inputClassName="px-4 py-3"
                prefixClassName="px-4"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">
                {t('apply.email')}
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="block w-full rounded-xl border border-ink-200 px-4 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
              />
              <p className="text-xs text-ink-500 mt-1.5">{t('apply.emailHint')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">
                {t('apply.yourLocation')}
              </label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Soweto, Johannesburg"
                className="block w-full rounded-xl border border-ink-200 px-4 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">
                {t('apply.aboutYou')}
              </label>
              <textarea
                name="aboutYou"
                value={form.aboutYou}
                onChange={handleChange}
                rows={4}
                placeholder={t('apply.aboutYouPlaceholder')}
                className="block w-full rounded-xl border border-ink-200 px-4 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none resize-none"
              />
            </div>

            {/* Document picker — signed-in users only */}
            {docs.length > 0 && (
              <div className="border border-ink-200 rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium text-ink-700">
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
                          ? 'border-brand-400 bg-brand-50'
                          : 'border-ink-200 bg-white hover:bg-ink-50'
                      }`}
                    >
                      {selected ? (
                        <CheckSquare className="w-4 h-4 text-brand-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-ink-400 shrink-0" />
                      )}
                      <FileText className="w-4 h-4 text-ink-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink-900 truncate">
                          {doc.name}
                        </p>
                        <span
                          className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 ${DOC_COLORS[doc.doc_type] ?? 'bg-ink-100 text-ink-600'}`}
                        >
                          {DOC_LABELS[doc.doc_type] ?? doc.doc_type}
                        </span>
                      </div>
                    </button>
                  );
                })}
                <p className="text-xs text-ink-400 pt-1">
                  Selected documents are included with your application.{' '}
                  <Link href="/candidate/profile" className="text-brand-500 hover:underline">
                    Manage documents
                  </Link>
                </p>
              </div>
            )}

            {profileLoaded && docs.length === 0 && (
              <div className="text-xs text-ink-500 bg-ink-50 rounded-xl px-4 py-3 border border-ink-100">
                No documents in your library.{' '}
                <Link href="/candidate/profile" className="text-brand-500 hover:underline">
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
              className="w-full bg-brand-600 text-white py-3.5 rounded-full font-bold hover:bg-brand-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? t('apply.submitting') : t('apply.submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
