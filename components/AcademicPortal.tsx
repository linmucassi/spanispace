'use client';

import React from 'react';
import Link from 'next/link';
import { ACADEMIC_UPDATES } from '../data/constants';
import { useTranslation } from '../lib/i18n/context';
import type { UniversityUpdate } from '../types';

interface AcademicPortalProps {
  updates?: UniversityUpdate[];
}

const AcademicPortal: React.FC<AcademicPortalProps> = ({ updates }) => {
  const now = new Date();
  const { t } = useTranslation();
  const items = updates ?? ACADEMIC_UPDATES;

  return (
    <section className="py-20 px-4 max-w-7xl mx-auto">
      <div className="max-w-5xl">
        <h2 className="text-4xl font-extrabold text-slate-900 mb-6">{t('academic.title')}</h2>
        <p className="text-lg text-slate-600 mb-8 leading-relaxed">{t('academic.subtitle')}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((update, i) => {
            const isPast = update.deadline ? new Date(update.deadline) < now : false;
            return (
              <div
                key={i}
                className={`flex flex-col p-5 bg-white border rounded-2xl shadow-sm h-full ${isPast ? 'border-slate-200 opacity-60' : 'border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all'}`}
              >
                {/* Header row */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm ${isPast ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600'}`}
                  >
                    {update.institution.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-900 leading-snug">{update.institution}</h4>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <span className="text-xs font-medium text-slate-500">{update.type}</span>
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
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3 flex-1">{update.notes}</p>
                )}

                {/* Footer row: deadline + apply link */}
                <div className="flex items-end justify-between mt-auto pt-3 border-t border-slate-100">
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      {t('academic.deadline')}
                    </span>
                    <span className={`text-sm font-bold ${isPast ? 'text-slate-400 line-through' : 'text-indigo-600'}`}>
                      {update.deadline}
                    </span>
                  </div>
                  {update.applyLink && !isPast && (
                    <Link
                      href={update.applyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                    >
                      Apply →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AcademicPortal;
