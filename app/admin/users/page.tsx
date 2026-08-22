'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { DbUser } from '@/types/database';

// Gated to super_admin only, both here (UI) and at the DB layer
// (lock_user_role() trigger silently reverts a role change from anyone
// else, is_super_admin() gates platform_invites of type platform_admin) --
// a regular Platform Admin should not be able to mint more admins at will.
// See supabase/add-roles-invites-and-calendar.sql PART A/B.
export default function AdminUsers() {
  const [me, setMe] = useState<{ id: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<DbUser[]>([]);
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSaving, setInviteSaving] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteLink, setInviteLink] = useState('');

  async function load() {
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data: myRow } = await supabase.from('users').select('id, role').eq('id', user.id).maybeSingle();
    setMe(myRow ?? null);

    let query = supabase.from('users').select('*').order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('role', filter);
    const { data } = await query;
    setUsers((data as DbUser[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  const isSuperAdmin = me?.role === 'super_admin';

  async function setRole(userId: string, role: 'admin' | 'candidate') {
    setBusy(userId);
    const supabase = createClient();
    if (!supabase) { setBusy(null); return; }
    // Demoting sends them back to 'candidate' -- their candidate_profiles
    // row already exists from signup regardless of past role, so this is
    // safe. Promoting/demoting between candidate and company isn't offered
    // here at all (see plan: those already own real profile rows).
    await supabase.from('users').update({ role }).eq('id', userId);
    setBusy(null);
    load();
  }

  async function sendAdminInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteSaving(true);
    setInviteError('');
    setInviteLink('');
    const supabase = createClient();
    if (!supabase) { setInviteSaving(false); return; }

    const { data, error } = await supabase
      .from('platform_invites')
      .insert({ email: inviteEmail.trim().toLowerCase(), invite_type: 'platform_admin' })
      .select('token')
      .single();

    setInviteSaving(false);
    if (error) { setInviteError(error.message); return; }
    setInviteLink(`${window.location.origin}/register?invite=${data.token}`);
    setInviteEmail('');
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div>;
  }

  if (!isSuperAdmin) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
        <h2 className="text-xl font-bold text-amber-800 mb-2">Super Admin only</h2>
        <p className="text-amber-700">Only a Super Admin can manage other users&apos; roles.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Users</h1>
        <p className="text-slate-500 text-sm">Manage platform roles</p>
      </div>

      {/* Invite an unregistered person to become admin */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
        <h2 className="font-bold text-slate-900 mb-1">Invite a new admin</h2>
        <p className="text-sm text-slate-500 mb-4">
          If they don&apos;t have a Spanispace account yet, this creates a shareable registration link that grants
          admin the moment they sign up. Email isn&apos;t sent automatically &mdash; copy the link and share it yourself.
        </p>
        <form onSubmit={sendAdminInvite} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="person@example.com"
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 outline-none"
          />
          <button
            type="submit"
            disabled={inviteSaving}
            className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-700 disabled:opacity-50"
          >
            {inviteSaving ? 'Creating...' : 'Create invite link'}
          </button>
        </form>
        {inviteError && <p className="text-red-600 text-sm mt-2">{inviteError}</p>}
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

      <div className="flex gap-2 mb-6">
        {['all', 'candidate', 'company', 'admin', 'super_admin'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {users.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Joined</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                        u.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                        u.role === 'company' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-mono">{new Date(u.created_at).toLocaleDateString('en-ZA')}</td>
                    <td className="px-6 py-4">
                      {u.role === 'super_admin' ? (
                        <span className="text-xs text-slate-400">&mdash;</span>
                      ) : u.role === 'admin' ? (
                        <button onClick={() => setRole(u.id, 'candidate')} disabled={busy === u.id} className="text-xs font-bold text-red-600 hover:underline disabled:opacity-50">
                          Revoke admin
                        </button>
                      ) : (
                        <button onClick={() => setRole(u.id, 'admin')} disabled={busy === u.id} className="text-xs font-bold text-green-600 hover:underline disabled:opacity-50">
                          Make admin
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
