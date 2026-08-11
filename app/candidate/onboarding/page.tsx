'use client';

// The one gate every candidate has to clear before the rest of /candidate/*
// opens up: a real display name and a phone number. Most often reached right
// after a Google sign-in, since Google never supplies a phone and the trigger
// that creates candidate_profiles (supabase/fix-security-hardening.sql) can
// only fall back to the email's local part for a name. lib/supabase/middleware.ts
// is what actually enforces this -- it redirects here whenever a signed-in
// candidate has no phone on file, old account or new, and sends them back to
// wherever they were headed (?next=) once this form is saved.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n/context';
import { Loader2 } from 'lucide-react';
import CvAutofill, { type CvAutofillResult } from '@/components/candidate/CvAutofill';

// Only a same origin relative path may be the post save target, matching the
// same guard in app/(auth)/callback/route.ts -- otherwise ?next=https://evil.com
// or ?next=//evil.com could send a freshly completed profile off the site.
function safeNext(raw: string | null): string {
  if (!raw) return '/candidate/dashboard';
  return raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/\\')
    ? raw
    : '/candidate/dashboard';
}

export default function CandidateOnboardingPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('candidate_profiles')
        .select('full_name, phone')
        .eq('user_id', user.id)
        .maybeSingle();

      // The Google name (or the email fallback) is pre-filled but editable --
      // this is the explicit "confirm/update your display name" step, not a
      // silent trigger default the candidate never sees.
      setFullName(data?.full_name ?? '');
      setPhone(data?.phone ?? '');
      setLoading(false);
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const supabase = createClient();
    if (!supabase) {
      setError(t('auth.supabaseNotConfigured'));
      setSaving(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError(t('auth.supabaseNotConfigured'));
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('candidate_profiles')
      .update({ full_name: fullName.trim(), phone: phone.trim() })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('[onboarding] could not save profile:', updateError.message);
      setError(t('onboarding.error'));
      setSaving(false);
      return;
    }

    const next = new URLSearchParams(window.location.search).get('next');
    router.push(safeNext(next));
  }

  // Onboarding only needs a name and a phone, so a CV upload here only fills
  // those two fields -- the rest of what CvAutofill finds (skills, work
  // history) is available again from the full profile page later.
  function handleExtracted(result: CvAutofillResult) {
    if (result.full_name) setFullName(result.full_name);
    if (result.phone) setPhone(result.phone);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
        <h1 className="text-xl font-bold text-slate-900">{t('onboarding.title')}</h1>
        <p className="text-slate-500 text-sm mt-1">{t('onboarding.subtitle')}</p>

        <div className="mt-5">
          <CvAutofill onExtracted={handleExtracted} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t('auth.fullName')}
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
              placeholder={t('auth.fullNamePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t('auth.phone')}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
              placeholder="+27 XX XXX XXXX"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? t('onboarding.submitting') : t('onboarding.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
