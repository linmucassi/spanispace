'use client';

import React from 'react';
import { ACADEMIC_UPDATES } from '../data/constants';
import { useTranslation } from '../lib/i18n/context';

const AcademicPortal: React.FC = () => {
  const now = new Date();
  const { t } = useTranslation();

  return (
    <section className="py-20 px-4 max-w-7xl mx-auto">
      <div className="max-w-3xl">
        <h2 className="text-4xl font-extrabold text-slate-900 mb-6">{t('academic.title')}</h2>
        <p className="text-lg text-slate-600 mb-8 leading-relaxed">{t('academic.subtitle')}</p>
        <div className="space-y-4">
          {ACADEMIC_UPDATES.map((update, i) => {
            const isPast = new Date(update.deadline) < now;
            return (
              <div
                key={i}
                className={`flex items-center justify-between p-4 bg-white border rounded-2xl shadow-sm ${isPast ? 'border-slate-200 opacity-60' : 'border-slate-100'}`}
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isPast ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600'}`}
                  >
                    {update.institution.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{update.institution}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500">{update.type}</span>
                      {isPast && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                          {t('academic.deadlinePassed')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-xs text-slate-400 uppercase font-bold tracking-wider">
                    {t('academic.deadline')}
                  </span>
                  <span className={`text-sm font-bold ${isPast ? 'text-slate-400 line-through' : 'text-indigo-600'}`}>
                    {update.deadline}
                  </span>
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
