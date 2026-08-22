'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type VerificationDoc = {
  id: string;
  user_id: string;
  name: string;
  doc_type: string;
  file_url: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  verification_note: string | null;
  created_at: string;
};

type CandidateGroup = {
  user_id: string;
  full_name: string;
  verified: boolean;
  docs: VerificationDoc[];
};

const DOC_LABELS: Record<string, string> = {
  id_document: 'ID Document',
  qualification: 'Qualification',
  transcript: 'Transcript',
};

export default function AdminCandidateVerification() {
  const [groups, setGroups] = useState<CandidateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }

    const { data: docs } = await supabase
      .from('candidate_documents')
      .select('id, user_id, name, doc_type, file_url, verification_status, verification_note, created_at')
      .not('verification_status', 'is', null)
      .order('created_at', { ascending: false });

    const userIds = Array.from(new Set((docs ?? []).map((d) => d.user_id)));
    let profiles: { user_id: string; full_name: string; verified: boolean }[] = [];
    if (userIds.length > 0) {
      const { data } = await supabase
        .from('candidate_profiles')
        .select('user_id, full_name, verified')
        .in('user_id', userIds);
      profiles = data ?? [];
    }

    const byUser = new Map<string, CandidateGroup>();
    for (const profile of profiles) {
      byUser.set(profile.user_id, { user_id: profile.user_id, full_name: profile.full_name, verified: profile.verified, docs: [] });
    }
    for (const doc of (docs ?? []) as VerificationDoc[]) {
      const group = byUser.get(doc.user_id);
      if (group) group.docs.push(doc);
    }

    setGroups(Array.from(byUser.values()));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function reviewDoc(doc: VerificationDoc, status: 'verified' | 'rejected') {
    setBusy(doc.id);
    const supabase = createClient();
    if (!supabase) { setBusy(null); return; }
    const note = status === 'rejected' ? window.prompt('Reason for rejecting (shown to the candidate):') ?? '' : null;
    await supabase.from('candidate_documents').update({ verification_status: status, verification_note: note }).eq('id', doc.id);
    setBusy(null);
    load();
  }

  async function setCandidateVerified(userId: string, verified: boolean) {
    setBusy(userId);
    const supabase = createClient();
    if (!supabase) { setBusy(null); return; }
    await supabase.from('candidate_profiles').update({ verified }).eq('user_id', userId);
    setBusy(null);
    load();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Candidate Verification</h1>
        <p className="text-slate-500 text-sm">Review ID documents, qualifications and transcripts. Verifying a candidate is a standing badge, not per-application.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600" /></div>
        ) : groups.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">No verification documents submitted yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {groups.map((group) => (
              <div key={group.user_id}>
                <div
                  className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50"
                  onClick={() => setExpanded(expanded === group.user_id ? null : group.user_id)}
                >
                  <div>
                    <p className="text-sm font-bold text-slate-900">{group.full_name}</p>
                    <p className="text-xs text-slate-500">{group.docs.length} document{group.docs.length === 1 ? '' : 's'} submitted</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${group.verified ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                      {group.verified ? 'Verified' : 'Not verified'}
                    </span>
                  </div>
                </div>

                {expanded === group.user_id && (
                  <div className="px-6 pb-5 space-y-3">
                    {group.docs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900">{DOC_LABELS[doc.doc_type] ?? doc.doc_type}: {doc.name}</p>
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline">View document</a>
                          {doc.verification_status === 'rejected' && doc.verification_note && (
                            <p className="text-xs text-red-600 mt-0.5">Note: {doc.verification_note}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                            doc.verification_status === 'verified' ? 'bg-green-100 text-green-700' :
                            doc.verification_status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {doc.verification_status}
                          </span>
                          {doc.verification_status !== 'verified' && (
                            <button onClick={() => reviewDoc(doc, 'verified')} disabled={busy === doc.id} className="text-xs font-bold text-green-600 hover:underline disabled:opacity-50">Approve</button>
                          )}
                          {doc.verification_status !== 'rejected' && (
                            <button onClick={() => reviewDoc(doc, 'rejected')} disabled={busy === doc.id} className="text-xs font-bold text-red-600 hover:underline disabled:opacity-50">Reject</button>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="pt-2">
                      {group.verified ? (
                        <button
                          onClick={() => setCandidateVerified(group.user_id, false)}
                          disabled={busy === group.user_id}
                          className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50"
                        >
                          Revoke Verified badge
                        </button>
                      ) : (
                        <button
                          onClick={() => setCandidateVerified(group.user_id, true)}
                          disabled={busy === group.user_id}
                          className="px-3 py-1.5 text-xs font-bold bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
                        >
                          Mark candidate Verified
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
