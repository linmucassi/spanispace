'use client';

import React, { useMemo, useState } from 'react';
import { TRAININGS } from '../data/constants';
import { useTranslation } from '../lib/i18n/context';
import { accessLabel, isFreeLevel, TRAINING_LEVELS, type TrainingLevel } from '../lib/training-level';

type LevelFilter = 'All' | TrainingLevel;

const TrainingSection: React.FC = () => {
  const now = new Date();
  const { t } = useTranslation();
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('All');

  const visible = useMemo(
    () => (levelFilter === 'All' ? TRAININGS : TRAININGS.filter((item) => item.level === levelFilter)),
    [levelFilter]
  );

  return (
    <div className="py-20 px-4 bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-4">{t('training.title')}</h2>
          <p className="text-slate-400">{t('training.subtitle')}</p>
          <p className="text-slate-500 text-sm mt-2">{t('training.pricingNote')}</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-12" role="group" aria-label={t('training.filterLabel')}>
          {(['All', ...TRAINING_LEVELS] as LevelFilter[]).map((option) => {
            const active = levelFilter === option;
            const label =
              option === 'All'
                ? t('training.filterAll')
                : option === 'Beginner'
                  ? t('training.filterBeginner')
                  : t('training.filterAdvanced');
            return (
              <button
                key={option}
                type="button"
                onClick={() => setLevelFilter(option)}
                aria-pressed={active}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                  active
                    ? 'bg-white text-slate-900'
                    : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-indigo-500'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {visible.map((item) => {
            const isPast = item.date ? new Date(item.date) < now : false;
            const free = isFreeLevel(item.level);
            return (
              <div
                key={item.id}
                className={`group flex flex-col bg-slate-800 border border-slate-700 rounded-3xl p-8 transition-all ${isPast ? 'opacity-60' : 'hover:border-indigo-500'}`}
              >
                <div className="flex justify-between items-start gap-3 mb-6">
                  <div className="flex flex-wrap items-center gap-2">
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
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-700 text-slate-200 border border-slate-600">
                      {item.level === 'Beginner' ? t('training.levelBeginner') : t('training.levelAdvanced')}
                    </span>
                    {isPast && (
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-red-500/20 text-red-400 border border-red-500/30">
                        {t('training.pastEvent')}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-slate-500 font-mono whitespace-nowrap">
                    {item.date ?? t('training.selfPaced')}
                  </span>
                </div>

                <h3
                  className={`text-2xl font-bold mb-2 transition-colors ${isPast ? '' : 'group-hover:text-indigo-400'}`}
                >
                  {item.title}
                </h3>

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs text-slate-400">{item.provider}</span>
                  <span className="text-slate-600">&middot;</span>
                  {item.external ? (
                    <span className="text-xs font-bold text-slate-300">
                      {t('training.pricedByProvider')}
                    </span>
                  ) : (
                    <span
                      className={`text-xs font-bold ${free ? 'text-emerald-400' : 'text-amber-400'}`}
                    >
                      {free ? t('training.free') : t('training.paid')}
                    </span>
                  )}
                </div>

                <p className="text-slate-400 mb-6 line-clamp-3">{item.description}</p>

                <div className="flex flex-wrap gap-2 mb-8">
                  {item.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-1 bg-slate-700 rounded-md text-slate-300">
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="mt-auto">
                  {isPast ? (
                    <button
                      disabled
                      className="w-full py-3 bg-slate-700 text-slate-500 rounded-xl font-bold cursor-not-allowed"
                    >
                      {t('training.pastEvent')}
                    </button>
                  ) : (
                    <a
                      href={item.href}
                      {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="block w-full py-3 bg-white text-slate-900 rounded-xl font-bold text-center hover:bg-indigo-50 transition-colors"
                    >
                      {item.external
                        ? t('training.openOnProvider').replace('{provider}', item.provider)
                        : accessLabel(item.level) === 'Free'
                          ? t('training.startFree')
                          : t('training.reserveSpot')}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrainingSection;
