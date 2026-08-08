'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ACADEMIC_UPDATES } from '../data/constants';
import { useTranslation } from '../lib/i18n/context';
import type { UniversityUpdate } from '../types';

interface AcademicPortalProps {
  updates?: UniversityUpdate[];
}

function InstitutionLogo({ logo, name, isPast }: { logo?: string; name: string; isPast: boolean }) {
  const [failed, setFailed] = useState(false);
  const initial = name.charAt(0);

  if (logo && !failed) {
    return (
      <div className={`w-10 h-10 rounded-full flex-shrink-0 overflow-hidden border ${isPast ? 'border-ink-200 bg-ink-50' : 'border-ink-200 bg-white'}`}>
        <img
          src={logo}
          alt={name}
          onError={() => setFailed(true)}
          className="w-full h-full object-contain p-1"
        />
      </div>
    );
  }

  return (
    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm ${isPast ? 'bg-ink-100 text-ink-400' : 'bg-brand-50 text-brand-600'}`}>
      {initial}
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
                    <Link
                      href={update.applyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-brand-700 transition-colors"
                    >
                      Apply →
                    </Link>
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
    </section>
  );
};

export default AcademicPortal;
