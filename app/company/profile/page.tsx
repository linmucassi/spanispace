'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { normalizeUrl } from '@/lib/normalizeUrl';
import { resolveCompanyMembership, canManage, type CompanyMembership } from '@/lib/company/resolveCompanyMembership';
import type { DbCompanyProfile } from '@/types/database';

export default function CompanyProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [profile, setProfile] = useState<DbCompanyProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [membership, setMembership] = useState<CompanyMembership | null>(null);

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

      // Owner (company_profiles.user_id) or team member (company_members) --
      // see supabase/add-roles-invites-and-calendar.sql PART C. Loading by
      // companyId (not user_id) is what lets a team member who isn't the
      // owner see the real company profile instead of a blank "create a
      // company" form.
      const resolved = await resolveCompanyMembership(supabase, user.id);
      setMembership(resolved);

      const { data } = resolved
        ? await supabase.from('company_profiles').select('*').eq('id', resolved.companyId).maybeSingle()
        : { data: null };

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
        // fall back to the signup metadata so the form isn't blank. Only
        // reachable for a brand-new owner with no membership at all.
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

  const canEdit = !membership || canManage(membership.role);

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

    const fields = {
      company_name: form.company_name,
      industry: form.industry || null,
      location: form.location || null,
      website: form.website ? normalizeUrl(form.website) : null,
      logo_url: form.logo_url ? normalizeUrl(form.logo_url) : null,
    };

    let data, dbError;
    if (membership) {
      // Existing company (owner or admin/manager editing via
      // company_can_manage()) -- update by id, never upsert-by-user_id here:
      // a team member has no company_profiles row of their own, so an
      // upsert keyed on their user_id would create a second, orphaned
      // company rather than editing the one they belong to.
      ({ data, error: dbError } = await supabase
        .from('company_profiles')
        .update(fields)
        .eq('id', membership.companyId)
        .select('*')
        .single());
    } else {
      // Brand-new owner, first save -- creates the row.
      ({ data, error: dbError } = await supabase
        .from('company_profiles')
        .upsert({ user_id: userId, ...fields }, { onConflict: 'user_id' })
        .select('*')
        .single());

      if (data && !dbError) {
        // Keep company_members in sync so this owner shows up on
        // /company/team immediately -- best effort, ignore a duplicate if
        // one already exists (e.g. a concurrent invite acceptance).
        await supabase
          .from('company_members')
          .insert({ company_id: data.id, user_id: userId, role: 'owner' })
          .then(() => {}, () => {});
        setMembership({ companyId: data.id, role: 'owner', companyName: data.company_name });
      }
    }

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

      {!canEdit && (
        <div className="mb-6 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
          Your role on this company account is read-only for profile changes. Ask an admin or owner to update it, or to change your role.
        </div>
      )}

      <fieldset disabled={!canEdit}>
      <form
        onSubmit={handleSubmit}
        className="space-y-5 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm disabled:opacity-75"
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

        {canEdit && (
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
      </fieldset>
    </div>
  );
}
