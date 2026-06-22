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
      <div className="max-w-3xl">
        <h2 className="text-4xl font-extrabold text-slate-900 mb-6">{t('academic.title')}</h2>
        <p className="text-lg text-slate-600 mb-8 leading-relaxed">{t('academic.subtitle')}</p>
        <div className="space-y-4">
          {items.map((update, i) => {
            const isPast = update.deadline ? new Date(update.deadline) < now : false;
            return (
              <div
                key={i}
                className={`flex items-center justify-between p-4 bg-white border rounded-2xl shadow-sm ${isPast ? 'border-slate-200 opacity-60' : 'border-slate-100'}`}
              >
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold ${isPast ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600'}`}
                  >
                    {update.institution.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 truncate">{update.institution}</h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-slate-500">{update.type}</span>
                      {isPast && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                          {t('academic.deadlinePassed')}
                        </span>
                      )}
                    </div>
                    {update.notes && (
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{update.notes}</p>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <span className="block text-xs text-slate-400 uppercase font-bold tracking-wider">
                    {t('academic.deadline')}
                  </span>
                  <span className={`text-sm font-bold ${isPast ? 'text-slate-400 line-through' : 'text-indigo-600'}`}>
                    {update.deadline}
                  </span>
                  {update.applyLink && !isPast && (
                    <Link
                      href={update.applyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-indigo-500 hover:text-indigo-700 font-semibold mt-1"
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
