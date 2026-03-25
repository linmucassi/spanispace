'use client';

import React from 'react';
import { useTranslation } from '../lib/i18n/context';

const Hero: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-indigo-50/50 to-transparent -z-10"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold mb-6 animate-bounce">
          <span>{t('hero.badge')}</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
          {t('hero.titleLine1')} <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            {t('hero.titleLine2')}
          </span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-slate-600 mb-10 leading-relaxed">
          {t('hero.subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <a
            href="#jobs"
            className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl hover:bg-slate-800 transition-all text-center"
          >
            {t('hero.browseJobs')}
          </a>
          <a
            href="#training"
            className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-bold shadow-sm hover:border-indigo-300 transition-all text-center"
          >
            {t('hero.joinBootcamp')}
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
