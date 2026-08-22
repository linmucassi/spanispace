'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { resolveCompanyMembership, canManage, type CompanyMembership } from '@/lib/company/resolveCompanyMembership';
import type { DbCompanyMember, CompanyRole } from '@/types/database';

const ROLES: CompanyRole[] = ['owner', 'admin', 'manager', 'member', 'viewer'];
const ROLE_LABELS: Record<CompanyRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager / Recruiter',
  member: 'Member',
  viewer: 'Viewer',
};

export default function CompanyTeam() {
  const [membership, setMembership] = useState<CompanyMembership | null>(null);
  const [members, setMembers] = useState<DbCompanyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState<CompanyRole>('member');
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState('');
  const [inviteLink, setInviteLink] = useState('');

  async function load() {
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const resolved = await resolveCompanyMembership(supabase, user.id);
    setMembership(resolved);
    if (!resolved) { setLoading(false); return; }

    const { data } = await supabase
      .from('company_members')
      .select('*, users(email)')
      .eq('company_id', resolved.companyId)
      .order('created_at', { ascending: true });
    setMembers((data as DbCompanyMember[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const canManageTeam = membership ? canManage(membership.role) : false;

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!membership) return;
    setAddSaving(true);
    setAddError('');
    setInviteLink('');
    const supabase = createClient();
    if (!supabase) { setAddSaving(false); return; }

    const email = addEmail.trim().toLowerCase();

    // Look up an existing account by email. Direct RLS SELECT on `users` by
    // arbitrary email isn't opened up (privacy), so this goes through a
    // small service-role-backed route instead -- same trust boundary as
    // /api/invites/accept.
    const res = await fetch('/api/company/team/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, companyId: membership.companyId, role: addRole }),
    });
    const result = await res.json().catch(() => null);
    setAddSaving(false);

    if (!res.ok) {
      setAddError(result?.error ?? 'Something went wrong.');
      return;
    }

    if (result.inviteLink) {
      setInviteLink(result.inviteLink);
    } else {
      setAddEmail('');
      load();
    }
  }

  async function changeRole(memberId: string, role: CompanyRole) {
    setBusy(memberId);
    const supabase = createClient();
    if (!supabase) { setBusy(null); return; }
    await supabase.from('company_members').update({ role }).eq('id', memberId);
    setBusy(null);
    load();
  }

  async function removeMember(memberId: string) {
    setBusy(memberId);
    const supabase = createClient();
    if (!supabase) { setBusy(null); return; }
    await supabase.from('company_members').delete().eq('id', memberId);
    setBusy(null);
    load();
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div>;
  }

  if (!membership) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
        <h2 className="text-xl font-bold text-amber-800 mb-2">Company profile not found</h2>
        <p className="text-amber-700">Set up your company profile first.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Team</h1>
        <p className="text-slate-500 text-sm">Who has access to this company account</p>
      </div>

      {canManageTeam && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
          <h2 className="font-bold text-slate-900 mb-1">Add a team member</h2>
          <p className="text-sm text-slate-500 mb-4">
            If they already have a Spanispace account, they&apos;re added immediately. Otherwise you&apos;ll get an
            invite link to share &mdash; email isn&apos;t sent automatically.
          </p>
          <form onSubmit={addMember} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              placeholder="teammate@example.com"
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 outline-none"
            />
            <select
              value={addRole}
              onChange={(e) => setAddRole(e.target.value as CompanyRole)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-white focus:border-brand-500 outline-none"
            >
              {ROLES.filter((r) => r !== 'owner').map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={addSaving}
              className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-700 disabled:opacity-50"
            >
              {addSaving ? 'Adding...' : 'Add'}
            </button>
          </form>
          {addError && <p className="text-red-600 text-sm mt-2">{addError}</p>}
          {inviteLink && (
            <div className="mt-3 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <code className="text-xs text-slate-700 flex-1 truncate">{inviteLink}</code>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(inviteLink)}
                className="text-xs font-bold text-brand-600 hover:underline shrink-0"
              >
                Copy
              </button>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                {canManageTeam && <th className="px-6 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{m.users?.email ?? '-'}</td>
                  <td className="px-6 py-4">
                    {canManageTeam && m.role !== 'owner' ? (
                      <select
                        value={m.role}
                        onChange={(e) => changeRole(m.id, e.target.value as CompanyRole)}
                        disabled={busy === m.id}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs bg-white"
                      >
                        {ROLES.filter((r) => r !== 'owner').map((r) => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                        {ROLE_LABELS[m.role]}
                      </span>
                    )}
                  </td>
                  {canManageTeam && (
                    <td className="px-6 py-4">
                      {m.role !== 'owner' && (
                        <button
                          onClick={() => removeMember(m.id)}
                          disabled={busy === m.id}
                          className="text-xs font-bold text-red-600 hover:underline disabled:opacity-50"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
