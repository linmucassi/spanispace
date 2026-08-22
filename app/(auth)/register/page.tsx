'use client';

import { useEffect, useState } from 'react';
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

type InvitePreview = {
  valid: boolean;
  inviteType?: 'platform_admin' | 'company_member' | 'referral';
  companyRole?: string;
  companyName?: string | null;
};

// A company_member or platform_admin invite means this account joins an
// existing company/becomes admin -- it must sign up as a plain account
// (candidate tab, no new company_profiles row), not create a new company.
// Acceptance itself happens after signUp() succeeds, never via
// handle_new_user() -- see lib/invites/acceptInvite.ts.
function inviteLocksToCandidateTab(invite: InvitePreview | null): boolean {
  return invite?.valid === true && (invite.inviteType === 'company_member' || invite.inviteType === 'platform_admin');
}

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

  // Invite context, read from ?invite=<token> -- plain window.location.search
  // rather than next/navigation's useSearchParams, to avoid forcing this
  // whole page into a Suspense boundary for one query param (same call made
  // for app/admin/jobs/page.tsx's ?origin= deep link earlier this session).
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [invitePreview, setInvitePreview] = useState<InvitePreview | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('invite');
    if (!token) return;
    setInviteToken(token);
    fetch(`/api/invites/preview?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data: InvitePreview) => {
        setInvitePreview(data);
        if (inviteLocksToCandidateTab(data)) setTab('candidate');
      })
      .catch(() => setInvitePreview({ valid: false }));
  }, []);

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

  // Shared by both signup paths (email/password and Google) -- POSTs the
  // pending invite token, if any, then redirects based on what it granted
  // rather than the tab the form happened to be on. Best effort: an
  // invalid/expired invite just falls through to the normal role-based
  // redirect, it never blocks signup itself.
  const acceptInviteAndRedirect = async (supabase: ReturnType<typeof createClient>, userId: string) => {
    if (inviteToken) {
      try {
        const res = await fetch('/api/invites/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: inviteToken }),
        });
        const result = await res.json().catch(() => null);
        if (res.ok && result?.inviteType === 'platform_admin') {
          router.push('/admin/dashboard');
          return;
        }
        if (res.ok && result?.inviteType === 'company_member') {
          router.push('/company/dashboard');
          return;
        }
      } catch {
        // Fall through to the normal role-based redirect below.
      }
    }
    if (!supabase) return;
    await redirectToDashboard(supabase, router, userId, t('auth.roleCheckFailed'), setError);
  };

  const { buttonRef: googleButtonRef, loading: googleLoading } = useGoogleSignIn({
    onSignedIn: async (userId) => {
      const supabase = createClient();
      await acceptInviteAndRedirect(supabase, userId);
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

    const callbackUrl = new URL('/callback', window.location.origin);
    // If confirmation email is required, no session exists until that link
    // is clicked -- app/(auth)/callback/route.ts reads this same param and
    // accepts the invite there instead. See lib/invites/acceptInvite.ts.
    if (inviteToken) callbackUrl.searchParams.set('invite', inviteToken);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        // Without this, the link in the confirmation email points at whatever
        // Site URL the Supabase project has configured, which is still the
        // default on this project. app/(auth)/callback/route.ts is what knows
        // how to exchange the code and route by role, so send them there.
        emailRedirectTo: callbackUrl.toString(),
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

    // Session exists -- accept the invite (if any) and redirect based on
    // what it granted, falling back to the tab-based dashboard otherwise.
    if (inviteToken) {
      await acceptInviteAndRedirect(supabase, data.user!.id);
    } else if (tab === 'candidate') {
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

      {/* Invite context banner */}
      {invitePreview?.valid && invitePreview.inviteType === 'platform_admin' && (
        <div className="mb-6 text-sm text-brand-700 bg-brand-50 border border-brand-100 rounded-2xl px-4 py-3">
          You&apos;ve been invited to become a Spanispace admin. Finish signing up below to get access.
        </div>
      )}
      {invitePreview?.valid && invitePreview.inviteType === 'company_member' && (
        <div className="mb-6 text-sm text-brand-700 bg-brand-50 border border-brand-100 rounded-2xl px-4 py-3">
          You&apos;ve been invited to join <strong>{invitePreview.companyName ?? 'a company'}</strong> as a{' '}
          {invitePreview.companyRole}. Finish signing up below to get access.
        </div>
      )}
      {invitePreview?.valid === false && inviteToken && (
        <div className="mb-6 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
          That invite link is invalid or has expired. You can still sign up normally below.
        </div>
      )}

      {/* Tab Selector -- hidden when an invite locks the account to a plain
          signup (joining an existing company or becoming admin), since
          picking "company" here would create a second, unrelated company. */}
      {!inviteLocksToCandidateTab(invitePreview) && (
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
      )}

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
