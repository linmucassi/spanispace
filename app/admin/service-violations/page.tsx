'use client';

// Blocked attempts to share contact details or move a Spanispace PieceJobs
// conversation off-platform before a booking is paid. Each row is a message
// the other party never saw. Accounts at or over the flag threshold (3 in 7
// days) are highlighted for review. Suspending a provider happens in
// /admin/service-providers.

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VIOLATION_FLAG_THRESHOLD } from '@/lib/services/messaging-constants';

type Violation = {
  id: string;
  user_id: string;
  thread_id: string | null;
  reasons: string[];
  body: string;
  created_at: string;
};

const REASON_LABEL: Record<string, string> = {
  phone: 'Phone number',
  email: 'Email',
  link: 'Link',
  handle: 'Social handle',
  off_platform: 'Off-platform ask',
};

export default function AdminServiceViolations() {
  const [rows, setRows] = useState<Violation[]>([]);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [providers, setProviders] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekAgo, setWeekAgo] = useState(0);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      if (!supabase) { setLoading(false); return; }
      const { data, error: loadError } = await supabase
        .from('contact_violations')
        .select('id, user_id, thread_id, reasons, body, created_at')
        .order('created_at', { ascending: false })
        .limit(200);
      if (loadError) { setError(loadError.message); setLoading(false); return; }
      const violations = (data ?? []) as Violation[];
      const userIds = Array.from(new Set(violations.map((v) => v.user_id)));
      if (userIds.length > 0) {
        const [{ data: users }, { data: profiles }, { data: providerRows }] = await Promise.all([
          supabase.from('users').select('id, email').in('id', userIds),
          supabase.from('candidate_profiles').select('user_id, full_name').in('user_id', userIds),
          supabase.from('service_providers').select('user_id').in('user_id', userIds),
        ]);
        const map = new Map<string, string>();
        for (const u of users ?? []) map.set(u.id, u.email);
        for (const p of profiles ?? []) map.set(p.user_id, `${p.full_name} (${map.get(p.user_id) ?? 'no email'})`);
        setNames(map);
        setProviders(new Set((providerRows ?? []).map((p) => p.user_id)));
      }
      setWeekAgo(Date.now() - 7 * 24 * 60 * 60 * 1000);
      setRows(violations);
      setLoading(false);
    }
    load();
  }, []);

  const recentByUser = new Map<string, number>();
  for (const v of rows) {
    if (new Date(v.created_at).getTime() >= weekAgo) recentByUser.set(v.user_id, (recentByUser.get(v.user_id) ?? 0) + 1);
  }
  const flagged = Array.from(recentByUser.entries()).filter(([, n]) => n >= VIOLATION_FLAG_THRESHOLD);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Contact Violations</h1>
        <p className="text-slate-500 text-sm">
          Messages blocked because they tried to share contact details or move a Spanispace PieceJobs job off-platform before booking. The other party never saw them.
        </p>
      </div>

      {flagged.length > 0 && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-semibold">Flagged for review ({VIOLATION_FLAG_THRESHOLD}+ in 7 days)</p>
          <ul className="mt-1 list-disc ml-5">
            {flagged.map(([userId, n]) => (
              <li key={userId}>{names.get(userId) ?? userId}: {n} attempts{providers.has(userId) ? ' (service provider: review in Service Providers)' : ''}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600" /></div>
        ) : error ? (
          <div className="px-6 py-12 text-center text-red-600 text-sm">{error}</div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">No blocked messages.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((v) => (
              <li key={v.id} className="px-6 py-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-slate-900">
                    {names.get(v.user_id) ?? v.user_id}
                    {providers.has(v.user_id) && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">provider</span>}
                  </span>
                  <span className="text-xs text-slate-400">{new Date(v.created_at).toLocaleString('en-ZA')}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {v.reasons.map((r) => <span key={r} className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">{REASON_LABEL[r] ?? r}</span>)}
                  {!v.thread_id && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">in a new request</span>}
                </div>
                <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-slate-700 whitespace-pre-line break-words">{v.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
