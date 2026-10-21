'use client';

// Service provider verification queue (Spanispace PieceJobs, S1).
// Documents live in the PRIVATE 'provider-documents' bucket and are opened
// through 2-minute signed URLs -- never public links. The guard trigger in
// supabase/add-service-marketplace.sql refuses "verified" without an
// in-date police clearance, so the checks here are guidance, not the only
// line of defence.

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  PAYMENT_METHOD_LABELS,
  POLICE_CLEARANCE_VALID_MONTHS,
  PROVIDER_DOC_LABELS,
  UNIT_LABELS,
  formatRand,
  requiredDocTypes,
  type PaymentMethods,
  type PricingUnit,
  type ProviderDocType,
  type ProviderStatus,
} from '@/lib/services/config';
import { ageOn } from '@/lib/services/saId';

type ProviderRow = {
  id: string;
  user_id: string;
  headline: string | null;
  bio: string | null;
  province: string | null;
  city: string | null;
  suburb: string | null;
  travel_radius_km: number | null;
  payment_methods: PaymentMethods;
  id_kind: 'sa_id' | 'passport' | null;
  date_of_birth: string | null;
  verification_status: ProviderStatus;
  verification_note: string | null;
  submitted_at: string | null;
  verified_at: string | null;
  police_clearance_issued_at: string | null;
  police_clearance_expires_at: string | null;
  listing_active: boolean;
  terms_version: string | null;
  terms_accepted_at: string | null;
};

type ServiceRow = {
  id: string;
  provider_id: string;
  category_id: string;
  years_experience: number | null;
  description: string | null;
  qualification_status: 'pending' | 'approved' | 'rejected' | null;
  category: { name: string; requires_qualification: boolean } | null;
  rates: { label: string; unit: string; price_cents: number; minimum_charge_cents: number | null }[];
};

type DocRow = {
  id: string;
  provider_id: string;
  doc_type: ProviderDocType;
  category_id: string | null;
  storage_path: string;
  file_name: string;
  status: 'pending' | 'verified' | 'rejected';
  review_note: string | null;
  created_at: string;
};

type Filter = 'review' | 'verified' | 'rejected' | 'suspended' | 'all';

const FILTER_LABELS: Record<Filter, string> = {
  review: 'Needs review',
  verified: 'Verified',
  rejected: 'Changes requested',
  suspended: 'Suspended',
  all: 'All',
};

const STATUS_BADGE: Record<ProviderStatus, string> = {
  draft: 'bg-slate-100 text-slate-600',
  pending: 'bg-amber-100 text-amber-700',
  verified: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  suspended: 'bg-red-200 text-red-800',
};

function addMonths(isoDate: string, months: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1 + months, d));
  return date.toISOString().slice(0, 10);
}

function fmt(date: string | null) {
  return date ? new Date(date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

export default function AdminServiceProviders() {
  const [filter, setFilter] = useState<Filter>('review');
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [issueDates, setIssueDates] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: 'error' | 'ok'; text: string } | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }
    setLoading(true);

    const [{ data: providerRows }, { data: serviceRows }, { data: docRows }] = await Promise.all([
      supabase.from('service_providers').select('*').neq('verification_status', 'draft').order('submitted_at', { ascending: true }),
      supabase
        .from('provider_services')
        .select('id, provider_id, category_id, years_experience, description, qualification_status, category:service_categories(name, requires_qualification), rates:provider_rates(label, unit, price_cents, minimum_charge_cents)'),
      supabase
        .from('provider_documents')
        .select('id, provider_id, doc_type, category_id, storage_path, file_name, status, review_note, created_at')
        .order('created_at', { ascending: false }),
    ]);

    const rows = (providerRows ?? []) as ProviderRow[];
    const userIds = rows.map((p) => p.user_id);
    const nameMap = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from('candidate_profiles').select('user_id, full_name').in('user_id', userIds);
      for (const p of profiles ?? []) nameMap.set(p.user_id, p.full_name);
    }

    setProviders(rows);
    setNames(nameMap);
    setServices(((serviceRows ?? []) as unknown as (ServiceRow & { category: ServiceRow['category'] | ServiceRow['category'][] })[]).map((s) => ({
      ...s,
      category: Array.isArray(s.category) ? s.category[0] ?? null : s.category,
    })));
    setDocs((docRows ?? []) as DocRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const pendingDocProviders = new Set(docs.filter((d) => d.status === 'pending').map((d) => d.provider_id));
  const visible = providers.filter((p) => {
    if (filter === 'all') return true;
    if (filter === 'review') return p.verification_status === 'pending' || pendingDocProviders.has(p.id);
    return p.verification_status === filter;
  });

  async function run(key: string, fn: () => Promise<{ error: { message: string } | null }>, ok: string) {
    setBusy(key);
    setMessage(null);
    const { error } = await fn();
    setBusy(null);
    if (error) setMessage({ type: 'error', text: error.message });
    else { setMessage({ type: 'ok', text: ok }); await load(); }
  }

  async function viewDoc(doc: DocRow) {
    const supabase = createClient();
    if (!supabase) return;
    const { data, error } = await supabase.storage.from('provider-documents').createSignedUrl(doc.storage_path, 120);
    if (error || !data) { setMessage({ type: 'error', text: `Could not open document: ${error?.message}` }); return; }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  }

  function reviewDoc(doc: DocRow, status: 'verified' | 'rejected') {
    const note = notes[doc.id]?.trim() || null;
    if (status === 'rejected' && !note) { setMessage({ type: 'error', text: 'Add a note so the provider knows what to fix.' }); return; }
    const supabase = createClient();
    if (!supabase) return;
    run(doc.id, async () => supabase.from('provider_documents').update({ status, review_note: status === 'rejected' ? note : null }).eq('id', doc.id), `Document ${status}.`);
  }

  function reviewQualification(service: ServiceRow, status: 'approved' | 'rejected') {
    const supabase = createClient();
    if (!supabase) return;
    run(service.id, async () => supabase.from('provider_services').update({ qualification_status: status }).eq('id', service.id), `${service.category?.name} certificate ${status}.`);
  }

  function saveClearance(provider: ProviderRow) {
    const issued = issueDates[provider.id];
    if (!issued) { setMessage({ type: 'error', text: 'Enter the issue date printed on the certificate.' }); return; }
    const expires = addMonths(issued, POLICE_CLEARANCE_VALID_MONTHS);
    if (new Date(expires) < new Date(new Date().toDateString())) {
      setMessage({ type: 'error', text: `That certificate expired on ${fmt(expires)}. Ask the provider for a new one.` });
      return;
    }
    const supabase = createClient();
    if (!supabase) return;
    run(`clearance:${provider.id}`, async () =>
      supabase.from('service_providers').update({ police_clearance_issued_at: issued, police_clearance_expires_at: expires }).eq('id', provider.id),
      `Police clearance recorded, valid until ${fmt(expires)}.`);
  }

  function setStatus(provider: ProviderRow, status: ProviderStatus) {
    const note = notes[provider.id]?.trim() || null;
    if ((status === 'rejected' || status === 'suspended') && !note) {
      setMessage({ type: 'error', text: 'Add a note explaining the decision. The provider sees it.' });
      return;
    }
    const supabase = createClient();
    if (!supabase) return;
    const patch: Record<string, unknown> = { verification_status: status, verification_note: status === 'verified' ? null : note };
    if (status !== 'verified') patch.listing_active = false;
    run(`status:${provider.id}`, async () => supabase.from('service_providers').update(patch).eq('id', provider.id), `Provider marked ${status}.`);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">PieceJobs Providers</h1>
        <p className="text-slate-500 text-sm">
          Verify identity, police clearance, address and trade certificates before a provider can go live. Requesters only ever see the resulting badge.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${filter === f ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            {FILTER_LABELS[f]}
            {f === 'review' && ` (${providers.filter((p) => p.verification_status === 'pending' || pendingDocProviders.has(p.id)).length})`}
          </button>
        ))}
      </div>

      {message && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600" /></div>
        ) : visible.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">Nothing here.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visible.map((p) => {
              const pServices = services.filter((s) => s.provider_id === p.id);
              const pDocs = docs.filter((d) => d.provider_id === p.id);
              const required = requiredDocTypes(p.id_kind);
              const verifiedTypes = new Set(pDocs.filter((d) => d.status === 'verified').map((d) => d.doc_type));
              const missingVerified = required.filter((t) => !verifiedTypes.has(t));
              const clearanceOk = !!p.police_clearance_expires_at && new Date(p.police_clearance_expires_at) >= new Date(new Date().toDateString());
              const age = p.date_of_birth ? ageOn(p.date_of_birth) : null;
              const canVerify = missingVerified.length === 0 && clearanceOk && age !== null && age >= 18;

              return (
                <div key={p.id}>
                  <button
                    type="button"
                    className="w-full px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-left hover:bg-slate-50/50"
                    onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">{names.get(p.user_id) ?? 'Unknown name'}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {p.headline ?? 'No headline'} · {[p.suburb, p.city, p.province].filter(Boolean).join(', ')}
                      </p>
                      <p className="text-xs text-slate-400">Submitted {fmt(p.submitted_at)} · {pServices.map((s) => s.category?.name).join(', ')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {pendingDocProviders.has(p.id) && <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-bold text-amber-700">new documents</span>}
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_BADGE[p.verification_status]}`}>{p.verification_status}</span>
                      {p.listing_active && <span className="rounded-full bg-green-600 px-2 py-0.5 text-xs font-bold text-white">live</span>}
                    </div>
                  </button>

                  {expanded === p.id && (
                    <div className="px-6 pb-6 space-y-5">
                      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div><dt className="text-xs text-slate-500">Identity</dt><dd>{p.id_kind === 'sa_id' ? 'SA ID' : p.id_kind === 'passport' ? 'Passport' : '—'} · DOB {fmt(p.date_of_birth)}{age !== null && ` (age ${age})`}</dd></div>
                        <div><dt className="text-xs text-slate-500">Payment preference</dt><dd>{PAYMENT_METHOD_LABELS[p.payment_methods]}</dd></div>
                        <div><dt className="text-xs text-slate-500">Agreement</dt><dd>v{p.terms_version ?? '—'} accepted {fmt(p.terms_accepted_at)}</dd></div>
                        <div><dt className="text-xs text-slate-500">Travel</dt><dd>{p.travel_radius_km ?? 0} km</dd></div>
                        <div><dt className="text-xs text-slate-500">Police clearance</dt><dd>{p.police_clearance_issued_at ? `Issued ${fmt(p.police_clearance_issued_at)}, valid until ${fmt(p.police_clearance_expires_at)}` : 'Not recorded'}</dd></div>
                        <div><dt className="text-xs text-slate-500">Verified</dt><dd>{fmt(p.verified_at)}</dd></div>
                      </dl>
                      {p.bio && <p className="text-sm text-slate-600 whitespace-pre-line">{p.bio}</p>}

                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Services</h3>
                        <ul className="space-y-2">
                          {pServices.map((s) => (
                            <li key={s.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-medium text-slate-900">{s.category?.name} {s.years_experience != null && <span className="text-slate-400 font-normal">· {s.years_experience} yrs</span>}</span>
                                {s.qualification_status && (
                                  <span className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">Certificate: {s.qualification_status}</span>
                                    {s.qualification_status !== 'approved' && <button onClick={() => reviewQualification(s, 'approved')} disabled={busy === s.id} className="text-xs font-bold text-green-600 hover:underline">Approve</button>}
                                    {s.qualification_status !== 'rejected' && <button onClick={() => reviewQualification(s, 'rejected')} disabled={busy === s.id} className="text-xs font-bold text-red-600 hover:underline">Reject</button>}
                                  </span>
                                )}
                              </div>
                              {s.description && <p className="text-slate-600 text-xs mt-1">{s.description}</p>}
                              <p className="text-xs text-slate-500 mt-1">
                                {s.rates.map((r) => `${r.label} ${formatRand(r.price_cents)} ${UNIT_LABELS[r.unit as PricingUnit]}`).join(' · ')}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Documents</h3>
                        <ul className="space-y-2">
                          {pDocs.map((d) => (
                            <li key={d.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="min-w-0">
                                  <span className="font-medium text-slate-900">{PROVIDER_DOC_LABELS[d.doc_type]}</span>
                                  {d.category_id && <span className="text-slate-500"> ({pServices.find((s) => s.category_id === d.category_id)?.category?.name ?? 'category'})</span>}
                                  <span className="block text-xs text-slate-500 truncate">{d.file_name} · uploaded {fmt(d.created_at)}</span>
                                </span>
                                <span className="flex items-center gap-2">
                                  <button onClick={() => viewDoc(d)} className="text-xs font-bold text-brand-600 hover:underline">View</button>
                                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${d.status === 'verified' ? 'bg-green-100 text-green-700' : d.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{d.status}</span>
                                  {d.status !== 'verified' && <button onClick={() => reviewDoc(d, 'verified')} disabled={busy === d.id} className="text-xs font-bold text-green-600 hover:underline">Approve</button>}
                                  {d.status !== 'rejected' && <button onClick={() => reviewDoc(d, 'rejected')} disabled={busy === d.id} className="text-xs font-bold text-red-600 hover:underline">Reject</button>}
                                </span>
                              </div>
                              {d.status !== 'rejected' && (
                                <input
                                  className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
                                  placeholder="Rejection note (shown to the provider)"
                                  value={notes[d.id] ?? ''}
                                  onChange={(e) => setNotes({ ...notes, [d.id]: e.target.value })}
                                />
                              )}
                              {d.status === 'rejected' && d.review_note && <p className="text-xs text-red-600">Note: {d.review_note}</p>}
                            </li>
                          ))}
                          {pDocs.length === 0 && <li className="text-sm text-slate-400">No documents uploaded.</li>}
                        </ul>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-4 space-y-2">
                        <h3 className="text-sm font-semibold text-slate-900">Record police clearance</h3>
                        <p className="text-xs text-slate-500">Enter the issue date on the SAPS certificate after checking it. It&apos;s valid for {POLICE_CLEARANCE_VALID_MONTHS} months from that date.</p>
                        <div className="flex flex-wrap gap-2">
                          <input type="date" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm" value={issueDates[p.id] ?? p.police_clearance_issued_at ?? ''} onChange={(e) => setIssueDates({ ...issueDates, [p.id]: e.target.value })} />
                          <button onClick={() => saveClearance(p)} disabled={busy === `clearance:${p.id}`} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">Save</button>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                        <h3 className="text-sm font-semibold text-slate-900">Decision</h3>
                        {!canVerify && p.verification_status !== 'verified' && (
                          <ul className="text-xs text-amber-700 list-disc ml-4 space-y-0.5">
                            {missingVerified.map((t) => <li key={t}>Approve: {PROVIDER_DOC_LABELS[t]}</li>)}
                            {!clearanceOk && <li>Record an in-date police clearance issue date</li>}
                            {(age === null || age < 18) && <li>Provider must be 18 or older</li>}
                          </ul>
                        )}
                        <textarea
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          rows={2}
                          placeholder="Note to the provider (required to request changes or suspend)"
                          value={notes[p.id] ?? ''}
                          onChange={(e) => setNotes({ ...notes, [p.id]: e.target.value })}
                        />
                        <div className="flex flex-wrap gap-2">
                          {p.verification_status !== 'verified' && (
                            <button onClick={() => setStatus(p, 'verified')} disabled={!canVerify || busy === `status:${p.id}`} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40">Verify provider</button>
                          )}
                          {(p.verification_status === 'pending' || p.verification_status === 'verified') && (
                            <button onClick={() => setStatus(p, 'rejected')} disabled={busy === `status:${p.id}`} className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40">Request changes</button>
                          )}
                          {p.verification_status !== 'suspended' ? (
                            <button onClick={() => setStatus(p, 'suspended')} disabled={busy === `status:${p.id}`} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40">Suspend</button>
                          ) : (
                            <button onClick={() => setStatus(p, 'pending')} disabled={busy === `status:${p.id}`} className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40">Lift suspension (back to review)</button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
