'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ACADEMIC_UPDATES } from '../data/constants';
import { useTranslation } from '../lib/i18n/context';
import { createClient } from '../lib/supabase/client';
import type { UniversityUpdate } from '../types';

// Captures who's applying before sending them to the institution's own
// portal -- Colleges/Universities had zero application tracking at all
// before this (just a bare external link). Fully separate from
// jobs/learnerships (see supabase/add-application-journeys.sql): its own
// table, its own route, no company visibility, admin + the candidate only.
function UniversityInterestModal({
  update,
  onClose,
}: {
  update: UniversityUpdate;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ fullName: '', phone: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function prefill() {
      const supabase = createClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('candidate_profiles')
        .select('full_name, phone')
        .eq('user_id', user.id)
        .maybeSingle();
      setForm((prev) => ({
        fullName: profile?.full_name ?? prev.fullName,
        phone: profile?.phone ?? prev.phone,
        email: user.email ?? prev.email,
      }));
    }
    prefill();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      setError('Your full name is required.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/university-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lateUniAppId: update.id, ...form }),
      });
      if (!res.ok) {
        const result = await res.json().catch(() => null);
        setError(result?.error ?? 'Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setDone(true);
    if (update.applyLink) window.open(update.applyLink, '_blank', 'noopener');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl border border-ink-100 p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="text-center py-2">
            <p className="font-bold text-ink-900 mb-2">Details saved</p>
            <p className="text-sm text-ink-600 mb-4">
              We&apos;ve opened {update.institution}&apos;s application page in a new tab. Didn&apos;t open?{' '}
              {update.applyLink && (
                <a href={update.applyLink} target="_blank" rel="noopener noreferrer" className="text-brand-600 font-semibold hover:underline">
                  Continue to {update.institution} →
                </a>
              )}
            </p>
            <button onClick={onClose} className="text-sm text-ink-500 hover:text-ink-700">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="font-bold text-ink-900 mb-1">Apply to {update.institution}</p>
            <p className="text-xs text-ink-500 mb-3">Leave your details, then you&apos;ll be sent to their site to finish applying.</p>
            <input
              placeholder="Full name *"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
              className="block w-full rounded-xl border border-ink-200 px-3 py-2 text-sm focus:border-brand-500 outline-none"
            />
            <input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="block w-full rounded-xl border border-ink-200 px-3 py-2 text-sm focus:border-brand-500 outline-none"
            />
            <input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="block w-full rounded-xl border border-ink-200 px-3 py-2 text-sm focus:border-brand-500 outline-none"
            />
            {error && <p className="text-red-600 text-xs">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={submitting} className="flex-1 bg-brand-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-brand-700 disabled:opacity-50">
                {submitting ? 'Continuing...' : 'Continue to application'}
              </button>
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-ink-500 hover:text-ink-700">Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

interface AcademicPortalProps {
  updates?: UniversityUpdate[];
}

/**
 * A monogram is the designed state, not the failure state.
 *
 * Three of these files turned out to be 2 KB Wikipedia error pages saved with
 * .png and .svg extensions, which rendered as the browser's broken image glyph.
 * The old onError only covered a request that failed outright, so a 200 response
 * carrying HTML slipped through. onLoad now also rejects anything that decodes
 * to nothing, and the monogram is styled to look deliberate either way.
 */
function InstitutionLogo({ logo, name, isPast }: { logo?: string; name: string; isPast: boolean }) {
  const [failed, setFailed] = useState(false);
  // 'University of Cape Town (UCT)' gives U, 'Wits University' gives W.
  const initials = name
    .replace(/\(.*?\)/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

  if (logo && !failed) {
    return (
      <div className={`w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden border ${isPast ? 'border-ink-200 bg-ink-50' : 'border-ink-200 bg-white'}`}>
        <img
          src={logo}
          alt={name}
          onError={() => setFailed(true)}
          onLoad={(e) => {
            const img = e.currentTarget;
            if (!img.naturalWidth || !img.naturalHeight) setFailed(true);
          }}
          className="w-full h-full object-contain p-1"
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center font-display font-extrabold text-xs tracking-tight ${
        isPast ? 'bg-ink-100 text-ink-400' : 'bg-brand-500 text-white'
      }`}
    >
      {initials}
    </div>
  );
}

/** Whole days from today until a deadline. Negative once it has passed. */
function daysUntil(deadline: string, now: Date): number {
  const end = new Date(deadline);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((end.getTime() - startOfToday.getTime()) / 86_400_000);
}

const AcademicPortal: React.FC<AcademicPortalProps> = ({ updates }) => {
  const now = new Date();
  const { t } = useTranslation();
  const items = updates ?? ACADEMIC_UPDATES;
  const [modalFor, setModalFor] = useState<UniversityUpdate | null>(null);

  // This page exists so nobody misses a closing date, and it was rendering every
  // institution in source order, so the first screen was a wall of DEADLINE
  // PASSED. Open ones first, soonest first, and the closed ones go behind a tap.
  const isPastUpdate = (u: UniversityUpdate) => (u.deadline ? new Date(u.deadline) < now : false);
  const open = items
    .filter((u) => !isPastUpdate(u))
    .sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''));
  const closed = items.filter(isPastUpdate);

  const renderCard = (update: UniversityUpdate, i: number) => {
    const isPast = isPastUpdate(update);
    const left = update.deadline ? daysUntil(update.deadline, now) : null;
    return (
              <div
                key={i}
                className={`flex flex-col p-5 bg-white border rounded-2xl shadow-sm h-full ${isPast ? 'border-ink-200 opacity-60' : 'border-ink-100 hover:border-brand-200 hover:shadow-md transition-all'}`}
              >
                {/* Header row */}
                <div className="flex items-start gap-3 mb-3">
                  <InstitutionLogo logo={update.logo} name={update.institution} isPast={isPast} />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-ink-900 leading-snug">{update.institution}</h4>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <span className="text-xs font-medium text-ink-500">{update.type}</span>
                      {isPast && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                          {t('academic.deadlinePassed')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {update.notes && (
                  <p className="text-xs text-ink-400 line-clamp-2 mb-3 flex-1">{update.notes}</p>
                )}

                {/* Footer row: deadline + apply link */}
                <div className="flex items-end justify-between mt-auto pt-3 border-t border-ink-100">
                  <div>
                    <span className="block text-[10px] text-ink-400 uppercase font-bold tracking-wider">
                      {t('academic.deadline')}
                    </span>
                    <span className={`text-sm font-bold ${isPast ? 'text-ink-400 line-through' : 'text-brand-600'}`}>
                      {update.deadline}
                    </span>
                    {/* How long you have is the useful number, not the date. */}
                    {!isPast && left !== null && (
                      <span
                        className={`block text-[11px] font-semibold ${
                          left <= 7 ? 'text-red-600' : left <= 21 ? 'text-amber-600' : 'text-ink-400'
                        }`}
                      >
                        {left <= 0 ? t('academic.closesToday') : t('academic.closesIn').replace('{n}', String(left))}
                      </span>
                    )}
                  </div>
                  {update.applyLink && !isPast && (
                    update.id ? (
                      <button
                        type="button"
                        onClick={() => setModalFor(update)}
                        className="text-xs bg-brand-600 text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-brand-700 transition-colors"
                      >
                        {t('academic.apply')}
                      </button>
                    ) : (
                      <Link
                        href={update.applyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-brand-600 text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-brand-700 transition-colors"
                      >
                        {t('academic.apply')}
                      </Link>
                    )
                  )}
                </div>
              </div>
    );
  };

  return (
    <section className="pt-8 pb-16 px-4 max-w-7xl mx-auto">
      <div className="max-w-5xl">
        <h2 className="font-display text-4xl font-extrabold text-ink-900 mb-6">{t('academic.title')}</h2>
        <p className="text-lg text-ink-600 mb-8 leading-relaxed">{t('academic.subtitle')}</p>

        {open.length > 0 ? (
          <>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-3">
              {t('academic.openCount').replace('{n}', String(open.length))}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{open.map(renderCard)}</div>
          </>
        ) : (
          <p className="rounded-2xl border border-dashed border-ink-200 py-12 px-6 text-center text-ink-500">
            {t('academic.noneOpen')}
          </p>
        )}

        {closed.length > 0 && (
          <details className="group mt-8">
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden text-sm font-semibold text-ink-500 hover:text-brand-600">
              {t('academic.showClosed').replace('{n}', String(closed.length))}
              <span className="inline-block ml-1.5 transition-transform group-open:rotate-45">+</span>
            </summary>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">{closed.map(renderCard)}</div>
          </details>
        )}
      </div>
      {modalFor && <UniversityInterestModal update={modalFor} onClose={() => setModalFor(null)} />}
    </section>
  );
};

export default AcademicPortal;
