'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n/context';
import { useGoogleSignIn } from '@/lib/auth/useGoogleSignIn';
import { redirectToDashboard } from '@/lib/auth/roleRedirect';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { buttonRef: googleButtonRef, loading: googleLoading } = useGoogleSignIn({
    onSignedIn: async (userId) => {
      const supabase = createClient();
      if (!supabase) return;
      await redirectToDashboard(supabase, router, userId, t('auth.roleCheckFailed'), setError);
    },
    onError: setError,
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      setError(t('auth.supabaseNotConfigured'));
      setLoading(false);
      return;
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    await redirectToDashboard(supabase, router, data.user.id, t('auth.roleCheckFailed'), setError);
    setLoading(false);
  };

  return (
    <div className="max-w-sm w-full">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{t('auth.loginTitle')}</h1>
        <p className="text-slate-500 text-sm mt-1">{t('auth.loginSubtitle')}</p>
      </div>

      <div ref={googleButtonRef} className={googleLoading ? 'opacity-50 pointer-events-none' : ''} />
      <p className="text-center text-xs text-slate-400 mt-2">{t('auth.googleCandidateNote')}</p>
      <div className="flex items-center gap-3 my-4">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400">{t('auth.orDivider')}</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
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

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-slate-700">
              {t('auth.password')}
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              {t('auth.forgotPassword')}
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
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
          {loading ? t('auth.signingIn') : t('auth.signIn')}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        {t('auth.noAccount')}{' '}
        <Link href="/register" className="text-brand-600 hover:text-brand-700 font-medium">
          {t('auth.createAccount')}
        </Link>
      </p>
    </div>
  );
}
