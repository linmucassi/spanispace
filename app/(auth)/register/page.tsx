'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n/context';
import { Loader2 } from 'lucide-react';

type Tab = 'candidate' | 'company';

const INDUSTRIES = [
  'Technology',
  'Finance',
  'Retail',
  'Healthcare',
  'Manufacturing',
  'Construction',
  'Education',
  'Other',
];

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('candidate');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Shared fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');

  // Candidate fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Company fields
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setLocation('');
    setFullName('');
    setPhone('');
    setCompanyName('');
    setIndustry('');
    setError('');
    setSuccess('');
  };

  const handleTabSwitch = (newTab: Tab) => {
    if (newTab !== tab) {
      resetForm();
      setTab(newTab);
    }
  };

  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    const supabase = createClient();
    if (!supabase) {
      setError(t('auth.supabaseNotConfigured'));
      return;
    }
    setGoogleLoading(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/callback` },
    });
    if (oauthError) {
      setError(oauthError.message);
      setGoogleLoading(false);
    }
    // On success the browser navigates away to Google, nothing left to do here.
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      setError(t('auth.supabaseNotConfigured'));
      setLoading(false);
      return;
    }

    const metadata =
      tab === 'candidate'
        ? { role: 'candidate', full_name: fullName, phone, location }
        : { role: 'company', company_name: companyName, industry, location };

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        // Without this, the link in the confirmation email points at whatever
        // Site URL the Supabase project has configured, which is still the
        // default on this project. app/(auth)/callback/route.ts is what knows
        // how to exchange the code and route by role, so send them there.
        emailRedirectTo: `${window.location.origin}/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // If email confirmation is required, the session will be null
    if (!data.session) {
      setSuccess(t('auth.confirmEmail'));
      setLoading(false);
      return;
    }

    // Session exists -- redirect to appropriate dashboard
    if (tab === 'candidate') {
      router.push('/candidate/dashboard');
    } else {
      router.push('/company/dashboard');
    }
  };

  return (
    <div className="max-w-md w-full">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t('auth.registerTitle')}</h1>
        <p className="text-slate-500 text-sm mt-1">{t('auth.registerSubtitle')}</p>
      </div>

      {/* Tab Selector */}
      <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
        <button
          type="button"
          onClick={() => handleTabSwitch('candidate')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
            tab === 'candidate'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {t('auth.tabCandidate')}
        </button>
        <button
          type="button"
          onClick={() => handleTabSwitch('company')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
            tab === 'company'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {t('auth.tabCompany')}
        </button>
      </div>

      {tab === 'candidate' && !success && (
        <div className="mb-6">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2 border border-slate-300 rounded-xl py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <svg viewBox="0 0 18 18" className="h-4 w-4 shrink-0" aria-hidden>
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.68-3.87 2.68-6.62z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z" />
              <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03z" />
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z" />
            </svg>
            {t('auth.continueWithGoogle')}
          </button>
          <p className="text-center text-xs text-slate-400 mt-2">{t('auth.googleCandidateNote')}</p>
          <div className="flex items-center gap-3 my-4">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">{t('auth.orDivider')}</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
        </div>
      )}

      {success ? (
        <div className="text-center py-8">
          <div className="bg-green-50 border border-green-200 rounded-xl px-6 py-4 mb-6">
            <p className="text-green-700 text-sm font-medium">{success}</p>
          </div>
          <Link
            href="/login"
            className="text-brand-600 hover:text-brand-700 font-medium text-sm"
          >
            {t('auth.backToLogin')}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleRegister} className="space-y-4">
          {/* Candidate-specific fields */}
          {tab === 'candidate' && (
            <>
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
            </>
          )}

          {/* Company-specific fields */}
          {tab === 'company' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('auth.companyName')}
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                  placeholder={t('auth.companyNamePlaceholder')}
                />
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t('auth.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
              placeholder="you@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t('auth.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
              placeholder={t('auth.passwordPlaceholder')}
            />
          </div>

          {/* Candidate: Phone */}
          {tab === 'candidate' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('auth.phone')}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                placeholder="+27 XX XXX XXXX"
              />
            </div>
          )}

          {/* Company: Industry */}
          {tab === 'company' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('auth.industry')}
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                required
                className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none bg-white"
              >
                <option value="">{t('auth.selectIndustry')}</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind.toLowerCase()}>
                    {t(`auth.industry_${ind.toLowerCase()}`)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t('auth.location')}
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
              placeholder={t('auth.locationPlaceholder')}
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? t('auth.creatingAccount') : t('auth.createAccount')}
          </button>
        </form>
      )}

      {!success && (
        <p className="text-center text-sm text-slate-500 mt-6">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link href="/login" className="text-brand-600 hover:text-brand-700 font-medium">
            {t('auth.signIn')}
          </Link>
        </p>
      )}
    </div>
  );
}
