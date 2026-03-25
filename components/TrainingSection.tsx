'use client';

import React from 'react';
import { TRAININGS } from '../data/constants';
import { useTranslation } from '../lib/i18n/context';

const TrainingSection: React.FC = () => {
  const now = new Date();
  const { t } = useTranslation();

  return (
    <div className="py-20 px-4 bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h2 className="text-4xl font-bold mb-4">{t('training.title')}</h2>
          <p className="text-slate-400">{t('training.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TRAININGS.map((item) => {
            const isPast = new Date(item.date) < now;
            return (
              <div
                key={item.id}
                className={`group bg-slate-800 border border-slate-700 rounded-3xl p-8 transition-all ${isPast ? 'opacity-60' : 'hover:border-indigo-500 cursor-pointer'}`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        item.category === 'Bootcamp'
                          ? 'bg-indigo-600 text-white'
                          : item.category === 'Event'
                            ? 'bg-amber-500 text-slate-900'
                            : 'bg-emerald-500 text-slate-900'
                      }`}
                    >
                      {item.category}
                    </span>
                    {isPast && (
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-red-500/20 text-red-400 border border-red-500/30">
                        {t('training.pastEvent')}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-slate-500 font-mono">{item.date}</span>
                </div>
                <h3
                  className={`text-2xl font-bold mb-4 transition-colors ${isPast ? '' : 'group-hover:text-indigo-400'}`}
                >
                  {item.title}
                </h3>
                <p className="text-slate-400 mb-6 line-clamp-2">{item.description}</p>
                <div className="flex flex-wrap gap-2 mb-8">
                  {item.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-1 bg-slate-700 rounded-md text-slate-300">
                      #{tag}
                    </span>
                  ))}
                </div>
                {isPast ? (
                  <button
                    disabled
                    className="w-full py-3 bg-slate-700 text-slate-500 rounded-xl font-bold cursor-not-allowed"
                  >
                    {t('training.pastEvent')}
                  </button>
                ) : (
                  <button className="w-full py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-indigo-50 transition-colors">
                    {t('training.reserveSpot')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrainingSection;
