'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { normalizeUrl } from '@/lib/normalizeUrl';
import type { DbCompanyProfile } from '@/types/database';

export default function CompanyProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [profile, setProfile] = useState<DbCompanyProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [form, setForm] = useState({
    company_name: '',
    industry: '',
    location: '',
    website: '',
    logo_url: '',
  });

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);

      const { data } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setProfile(data as DbCompanyProfile);
        setForm({
          company_name: data.company_name || '',
          industry: data.industry || '',
          location: data.location || '',
          website: data.website || '',
          logo_url: data.logo_url || '',
        });
      } else {
        // No company_profiles row yet (e.g. signup didn't provision one) --
        // fall back to the signup metadata so the form isn't blank.
        setForm({
          company_name: (user.user_metadata?.company_name as string) || '',
          industry: (user.user_metadata?.industry as string) || '',
          location: (user.user_metadata?.location as string) || '',
          website: '',
          logo_url: '',
        });
      }

      setLoading(false);
    }

    loadProfile();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);

    if (!userId) {
      setError('You must be signed in.');
      setSaving(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError('Unable to connect to database.');
      setSaving(false);
      return;
    }

    const { data, error: dbError } = await supabase
      .from('company_profiles')
      .upsert(
        {
          user_id: userId,
          company_name: form.company_name,
          industry: form.industry || null,
          location: form.location || null,
          website: form.website ? normalizeUrl(form.website) : null,
          logo_url: form.logo_url ? normalizeUrl(form.logo_url) : null,
        },
        { onConflict: 'user_id' }
      )
      .select('*')
      .single();

    setSaving(false);

    if (dbError) {
      setError(dbError.message);
      return;
    }

    setProfile(data as DbCompanyProfile);
    setSuccess(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold text-slate-900 mb-2">
        Company Profile
      </h1>
      <p className="text-slate-500 text-sm mb-8">
        Update your company information visible to candidates
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Company Name *
          </label>
          <input
            name="company_name"
            value={form.company_name}
            onChange={handleChange}
            required
            className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Industry
          </label>
          <input
            name="industry"
            value={form.industry}
            onChange={handleChange}
            placeholder="e.g. Technology, Finance, Healthcare"
            className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Location
          </label>
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="e.g. Johannesburg, Gauteng"
            className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Website
          </label>
          <input
            name="website"
            value={form.website}
            onChange={handleChange}
            placeholder="https://yourcompany.co.za"
            type="text"
            inputMode="url"
            className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Logo URL
          </label>
          <input
            name="logo_url"
            value={form.logo_url}
            onChange={handleChange}
            placeholder="https://example.com/logo.png"
            type="text"
            inputMode="url"
            className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
          {form.logo_url && (
            <div className="mt-3 flex items-center gap-3">
              <img
                src={form.logo_url}
                alt="Logo preview"
                className="w-12 h-12 rounded-lg object-contain border border-slate-200 bg-white"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="text-xs text-slate-500">Preview</span>
            </div>
          )}
        </div>

        {/* Subscription Tier (read-only) */}
        {profile && (
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Subscription Tier
            </label>
            <div className="flex items-center gap-3">
              <span className="inline-flex px-3 py-1.5 rounded-lg bg-brand-50 text-sm font-bold text-brand-700">
                {profile.subscription_tier || 'Free'}
              </span>
              {profile.subscription_status && (
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                    profile.subscription_status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {profile.subscription_status}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Contact support to change your subscription plan.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <p className="text-green-700 text-sm text-center font-medium">
              Profile updated successfully.
            </p>
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
