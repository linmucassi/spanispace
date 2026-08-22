'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Invite {
  id: string;
  message: string | null;
  status: string;
  created_at: string;
  job: { id: string; title: string; location: string } | null;
  company_profiles: { company_name: string } | null;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-green-100 text-green-800',
  declined: 'bg-slate-100 text-slate-600',
};

export default function InviteList({ initialInvites }: { initialInvites: Invite[] }) {
  const router = useRouter();
  const [invites, setInvites] = useState(initialInvites);
  const [updating, setUpdating] = useState<string | null>(null);

  async function respond(invite: Invite, status: 'accepted' | 'declined') {
    setUpdating(invite.id);
    const supabase = createClient();
    if (!supabase) { setUpdating(null); return; }

    const { error } = await supabase
      .from('job_invites')
      .update({ status, responded_at: new Date().toISOString() })
      .eq('id', invite.id);

    setUpdating(null);
    if (!error) {
      setInvites((prev) => prev.map((i) => (i.id === invite.id ? { ...i, status } : i)));
      if (status === 'accepted' && invite.job) {
        router.push(`/jobs/${invite.job.id}/apply`);
      }
    }
  }

  if (invites.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <p className="text-slate-500">No invitations yet.</p>
        <p className="text-sm text-slate-400 mt-1">
          Turn on &quot;Be discoverable&quot; in{' '}
          <Link href="/candidate/profile" className="text-brand-600 hover:underline">
            your profile
          </Link>{' '}
          so companies can find and invite you.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
      {invites.map((invite) => (
        <div key={invite.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">
              {invite.company_profiles?.company_name ?? 'A company'} invited you to apply
            </p>
            <p className="text-sm text-slate-600 mt-0.5">
              {invite.job ? (
                <Link href={`/jobs/${invite.job.id}`} className="text-brand-600 hover:underline">
                  {invite.job.title}
                </Link>
              ) : (
                'Job no longer available'
              )}
              {invite.job?.location ? ` · ${invite.job.location}` : ''}
            </p>
            {invite.message && <p className="text-sm text-slate-500 mt-1.5 italic">&quot;{invite.message}&quot;</p>}
            <p className="text-xs text-slate-400 mt-1">
              {new Date(invite.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[invite.status] ?? 'bg-slate-100 text-slate-700'}`}>
              {invite.status}
            </span>
            {invite.status === 'pending' && invite.job && (
              <>
                <button
                  onClick={() => respond(invite, 'accepted')}
                  disabled={updating === invite.id}
                  className="px-3 py-1.5 text-xs font-bold bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
                >
                  Accept
                </button>
                <button
                  onClick={() => respond(invite, 'declined')}
                  disabled={updating === invite.id}
                  className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-50"
                >
                  Decline
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
