'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n/context';
import { useGoogleSignIn } from '@/lib/auth/useGoogleSignIn';
import { redirectToDashboard } from '@/lib/auth/roleRedirect';
import { joinFullName } from '@/lib/name';
import PhoneInput from '@/components/PhoneInput';
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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // Company fields
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setLocation('');
    setFirstName('');
    setLastName('');
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

  const { buttonRef: googleButtonRef, loading: googleLoading } = useGoogleSignIn({
    onSignedIn: async (userId) => {
      const supabase = createClient();
      if (!supabase) return;
      await redirectToDashboard(supabase, router, userId, t('auth.roleCheckFailed'), setError);
    },
    onError: setError,
  });

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
        ? { role: 'candidate', full_name: joinFullName(firstName, lastName), phone, location }
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
          <div ref={googleButtonRef} className={googleLoading ? 'opacity-50 pointer-events-none' : ''} />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('auth.firstName')}
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                  placeholder={t('auth.firstNamePlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('auth.lastName')}
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                  placeholder={t('auth.lastNamePlaceholder')}
                />
              </div>
            </div>
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
              <PhoneInput
                value={phone}
                onChange={setPhone}
                required
                containerClassName="rounded-xl border border-slate-300 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500"
                inputClassName="px-4 py-3"
                prefixClassName="px-4"
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
